"use server";
import { db } from "@/lib/db";
import { complaints, complaintEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buildEvent, GENESIS_HASH } from "@/server/domain/audit-chain";
import { ok, err, type Result } from "@/lib/result";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";

const InputSchema = z.object({
	complaintId: z.string().uuid(),
	text: z.string().min(5, "La nota debe tener al menos 5 caracteres").max(2000),
	visibility: z.enum(["public", "private"]),
});

export async function addComplaintNote(input: unknown): Promise<Result<void>> {
	const startTime = Date.now();

	logger.info({ action: "addComplaintNote" }, "Add note started");

	try {
		const data = InputSchema.parse(input);

		const session = await auth();
		if (!session) {
			logger.warn({ action: "addComplaintNote" }, "Unauthenticated attempt");
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
					action: "addComplaintNote",
					actorRole: session.user.role,
					actorId: session.user.id,
				},
				"Unauthorized role attempted to add note",
			);
			return err("FORBIDDEN", "Sin permisos para agregar notas");
		}

		const complaint = await db.query.complaints.findFirst({
			where: eq(complaints.id, data.complaintId),
			columns: { id: true, currentHash: true },
		});

		if (!complaint) {
			logger.warn(
				{ action: "addComplaintNote", complaintId: data.complaintId },
				"Complaint not found",
			);
			return err("NOT_FOUND", "Denuncia no encontrada");
		}

		const event = buildEvent({
			complaintId: complaint.id,
			eventType: "note_added",
			actorId: session.user.id,
			actorRole: session.user.role as "officer",
			actorIp: null,
			payload: {
				text: data.text,
				visibility: data.visibility,
			},
			reason: null,
			prevHash: complaint.currentHash ?? GENESIS_HASH,
		});

		await db.transaction(async tx => {
			await tx.insert(complaintEvents).values(event);
			await tx
				.update(complaints)
				.set({ currentHash: event.hash, updatedAt: new Date() })
				.where(eq(complaints.id, complaint.id));
		});

		revalidatePath(`/officer/${complaint.id}`);

		logger.info(
			{
				action: "addComplaintNote",
				complaintId: complaint.id,
				visibility: data.visibility,
				actorId: session.user.id,
				actorRole: session.user.role,
				eventId: event.id,
				durationMs: Date.now() - startTime,
			},
			"Note added successfully",
		);

		return ok(undefined);
	} catch (error) {
		if (error instanceof z.ZodError) {
			logger.warn(
				{
					action: "addComplaintNote",
					errors: error.errors.map(e => ({ path: e.path, message: e.message })),
				},
				"Input validation failed",
			);
			return err("INVALID_INPUT", "Los datos proporcionados son inválidos");
		}

		logger.error(
			{
				action: "addComplaintNote",
				durationMs: Date.now() - startTime,
				error: error instanceof Error ? error.message : String(error),
			},
			"Unexpected error adding note",
		);

		Sentry.captureException(error, {
			tags: { action: "addComplaintNote" },
		});

		return err("DB_ERROR", "Error al agregar la nota");
	}
}
