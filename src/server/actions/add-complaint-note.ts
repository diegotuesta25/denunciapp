"use server";
import { db } from "@/lib/db";
import { complaints, complaintEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buildEvent, GENESIS_HASH } from "@/server/domain/audit-chain";

const InputSchema = z.object({
	complaintId: z.string().uuid(),
	text: z.string().min(5, "La nota debe tener al menos 5 caracteres").max(2000),
	visibility: z.enum(["public", "private"]),
});

type Result = { success: true } | { success: false; error: string };

export async function addComplaintNote(input: unknown): Promise<Result> {
	try {
		const data = InputSchema.parse(input);
		const session = await auth();
		if (!session) return { success: false, error: "No autorizado" };

		const allowedRoles = [
			"officer",
			"comisario",
			"regional_commander",
			"internal_affairs",
			"admin",
		];
		if (!allowedRoles.includes(session.user.role)) {
			return { success: false, error: "Sin permisos" };
		}

		const complaint = await db.query.complaints.findFirst({
			where: eq(complaints.id, data.complaintId),
			columns: { id: true, currentHash: true },
		});
		if (!complaint) return { success: false, error: "Denuncia no encontrada" };

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
		return { success: true };
	} catch (error) {
		console.error("addComplaintNote error:", error);
		return { success: false, error: "Error al agregar la nota" };
	}
}
