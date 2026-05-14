"use server";
import { db } from "@/lib/db";
import { complaints, complaintEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { transition } from "@/server/domain/complaint-state-machine";
import { buildEvent, GENESIS_HASH } from "@/server/domain/audit-chain";

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

type Result = { success: true } | { success: false; error: string };

export async function updateComplaintStatus(input: unknown): Promise<Result> {
	try {
		const data = InputSchema.parse(input);

		const session = await auth();
		if (!session) {
			return { success: false, error: "No autorizado" };
		}

		const allowedRoles = [
			"officer",
			"comisario",
			"regional_commander",
			"internal_affairs",
			"admin",
		];
		if (!allowedRoles.includes(session.user.role)) {
			return { success: false, error: "No tienes permisos para esta acción" };
		}

		const complaint = await db.query.complaints.findFirst({
			where: eq(complaints.id, data.complaintId),
			columns: { id: true, status: true, currentHash: true },
		});

		if (!complaint) {
			return { success: false, error: "Denuncia no encontrada" };
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

		return { success: true };
	} catch (error) {
		if (
			error instanceof Error &&
			error.message.startsWith("Invalid transition")
		) {
			return { success: false, error: error.message };
		}
		console.error("updateComplaintStatus error:", error);
		return { success: false, error: "Error al actualizar el estado." };
	}
}
