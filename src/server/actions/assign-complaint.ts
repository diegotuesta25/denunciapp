"use server";
import { db } from "@/lib/db";
import { complaints, complaintEvents, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ok, err, type Result } from "@/lib/result";
import { buildEvent, GENESIS_HASH } from "@/server/domain/audit-chain";
import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

const InputSchema = z.object({
	complaintId: z.string().uuid(),
	officerId: z.string().uuid(),
});

export async function assignComplaint(input: unknown): Promise<Result<void>> {
	const startTime = Date.now();

	try {
		const parseResult = InputSchema.safeParse(input);
		if (!parseResult.success) {
			return err("INVALID_INPUT", "Datos inválidos");
		}
		const data = parseResult.data;

		const session = await auth();
		if (!session) return err("AUTH_REQUIRED", "No autorizado");

		const assignerRoles = [
			"comisario",
			"regional_commander",
			"internal_affairs",
			"admin",
		];
		if (!assignerRoles.includes(session.user.role)) {
			return err("FORBIDDEN", "Solo el comisario puede asignar denuncias");
		}

		const complaint = await db.query.complaints.findFirst({
			where: eq(complaints.id, data.complaintId),
			columns: {
				id: true,
				currentHash: true,
				status: true,
				assignedOfficerId: true,
			},
		});
		if (!complaint) return err("NOT_FOUND", "Denuncia no encontrada");

		const officer = await db.query.users.findFirst({
			where: eq(users.id, data.officerId),
			columns: { id: true, name: true, role: true },
		});
		if (!officer || officer.role !== "officer") {
			return err("NOT_FOUND", "Oficial no encontrado");
		}

		const event = buildEvent({
			complaintId: complaint.id,
			eventType: "assigned",
			actorId: session.user.id,
			actorRole: session.user.role as any,
			actorIp: null,
			payload: {
				previousOfficerId: complaint.assignedOfficerId,
				newOfficerId: data.officerId,
				newOfficerName: officer.name,
			},
			reason: null,
			prevHash: complaint.currentHash ?? GENESIS_HASH,
		});

		await db.transaction(async tx => {
			await tx.insert(complaintEvents).values(event);
			await tx
				.update(complaints)
				.set({
					assignedOfficerId: data.officerId,
					currentHash: event.hash,
					updatedAt: new Date(),
				})
				.where(eq(complaints.id, complaint.id));
		});

		revalidatePath(`/officer`);
		revalidatePath(`/officer/${complaint.id}`);

		logger.info(
			{
				action: "assignComplaint",
				complaintId: complaint.id,
				officerId: data.officerId,
				assignedBy: session.user.id,
				durationMs: Date.now() - startTime,
			},
			"Complaint assigned successfully",
		);

		return ok(undefined);
	} catch (error) {
		logger.error(
			{
				action: "assignComplaint",
				durationMs: Date.now() - startTime,
				error: error instanceof Error ? error.message : String(error),
			},
			"Unexpected error during assignment",
		);

		Sentry.captureException(error, {
			tags: { action: "assignComplaint" },
		});

		return err("DB_ERROR", "Error al asignar la denuncia");
	}
}
