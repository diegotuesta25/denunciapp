"use server";
import { db } from "@/lib/db";
import { complaints, complaintEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { transition } from "@/server/domain/complaint-state-machine";
import { buildEvent, GENESIS_HASH } from "@/server/domain/audit-chain";
import { ok, err, type Result } from "@/lib/result";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";

const InputSchema = z.object({
	complaintId: z.string().uuid(),
	newStatus: z.enum([
		"recibida",
		"en_revision",
		"asignada",
		"en_investigacion",
		"derivada_fiscalia",
		"archivada",
	]),
	reason: z.string().max(500).optional(),
});

type SubmitResult = Result<{ complaintId: string }>;

export async function updateComplaintStatus(
	input: unknown,
): Promise<SubmitResult> {
	const startTime = Date.now();

	logger.info({ action: "updateComplaintStatus", input }, "Action started");

	try {
		const data = InputSchema.parse(input);

		const session = await auth();
		if (!session) {
			logger.warn(
				{ action: "updateComplaintStatus" },
				"Unauthenticated attempt",
			);
			return err("AUTH_REQUIRED", "No autorizado");
		}

		const allowedRoles = [
			"officer",
			"comisario",
			"regional_commander",
			"internal_affairs",
			"admin",
		];
		if (!allowedRoles.includes(session.user.role)) {
			logger.warn(
				{
					action: "updateComplaintStatus",
					actorRole: session.user.role,
					actorId: session.user.id,
				},
				"Unauthorized role attempted action",
			);
			return err("FORBIDDEN", "No tienes permisos para esta acción");
		}

		const complaint = await db.query.complaints.findFirst({
			where: eq(complaints.id, data.complaintId),
			columns: { id: true, status: true, currentHash: true },
		});

		if (!complaint) {
			logger.warn(
				{
					action: "updateComplaintStatus",
					complaintId: data.complaintId,
				},
				"Complaint not found",
			);
			return err("NOT_FOUND", "Denuncia no encontrada");
		}

		const role = session.user.role as Parameters<typeof transition>[2];
		const newStatus = transition(complaint.status, data.newStatus, role);

		const event = buildEvent({
			complaintId: complaint.id,
			eventType: "status_changed",
			actorId: session.user.id,
			actorRole: role,
			actorIp: null,
			payload: {
				from: complaint.status,
				to: newStatus,
			},
			reason: data.reason ?? null,
			prevHash: complaint.currentHash ?? GENESIS_HASH,
		});

		await db.transaction(async tx => {
			await tx.insert(complaintEvents).values(event);
			await tx
				.update(complaints)
				.set({
					status: newStatus,
					currentHash: event.hash,
					updatedAt: new Date(),
				})
				.where(eq(complaints.id, complaint.id));
		});

		revalidatePath(`/officer/${complaint.id}`);
		revalidatePath("/officer");

		logger.info(
			{
				action: "updateComplaintStatus",
				complaintId: complaint.id,
				from: complaint.status,
				to: newStatus,
				actorId: session.user.id,
				actorRole: role,
				durationMs: Date.now() - startTime,
				eventId: event.id,
			},
			"Status transition succeeded",
		);

		return ok({ complaintId: complaint.id });
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof z.ZodError) {
			logger.warn(
				{
					action: "updateComplaintStatus",
					durationMs: duration,
					errors: error.errors.map(e => ({ path: e.path, message: e.message })),
				},
				"Input validation failed",
			);
			return err("INVALID_INPUT", "Los datos proporcionados son inválidos");
		}

		logger.error(
			{
				action: "updateComplaintStatus",
				durationMs: duration,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			},
			"Unexpected error during status transition",
		);

		Sentry.captureException(error, {
			tags: { action: "updateComplaintStatus" },
			contexts: {
				duration: { durationMs: duration },
			},
		});

		return err("DB_ERROR", "Error al actualizar el estado.");
	}
}
