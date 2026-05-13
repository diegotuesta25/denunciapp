import { z } from "zod";
import { router, publicProcedure, officerProcedure } from "@/server/trpc";
import { db } from "@/lib/db";
import { complaints, complaintEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
	buildEvent,
	GENESIS_HASH,
	verifyChain,
} from "@/server/domain/audit-chain";
import { transition } from "@/server/domain/complaint-state-machine";

export const complaintsRouter = router({
	getByTrackingCode: publicProcedure
		.input(
			z.object({
				trackingCode: z.string().length(10),
				dniSuffix: z.string().length(4),
			}),
		)
		.query(async ({ input }) => {
			const complaint = await db.query.complaints.findFirst({
				where: eq(complaints.trackingCode, input.trackingCode),
				columns: {
					id: true,
					trackingCode: true,
					status: true,
					type: true,
					createdAt: true,
					updatedAt: true,
				},
			});

			if (!complaint) {
				throw new Error("Complaint not found");
			}

			return complaint;
		}),

	getEvents: officerProcedure
		.input(z.object({ complaintId: z.string().uuid() }))
		.query(async ({ input }) => {
			const events = await db.query.complaintEvents.findMany({
				where: eq(complaintEvents.complaintId, input.complaintId),
				orderBy: (events, { asc }) => [asc(events.createdAt)],
			});
			return events;
		}),

	verifyIntegrity: publicProcedure
		.input(z.object({ complaintId: z.string().uuid() }))
		.query(async ({ input }) => {
			const events = await db.query.complaintEvents.findMany({
				where: eq(complaintEvents.complaintId, input.complaintId),
			});
			return verifyChain(events);
		}),

	updateStatus: officerProcedure
		.input(
			z.object({
				complaintId: z.string().uuid(),
				newStatus: z.enum([
					"recibida",
					"en_revision",
					"asignada",
					"en_investigacion",
					"derivada_fiscalia",
					"archivada",
				]),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const complaint = await db.query.complaints.findFirst({
				where: eq(complaints.id, input.complaintId),
				columns: { id: true, status: true, currentHash: true },
			});

			if (!complaint) throw new Error("Complaint not found");

			const role = ctx.session.user.role as Parameters<typeof transition>[2];

			const newStatus = transition(complaint.status, input.newStatus, role);

			const event = buildEvent({
				complaintId: complaint.id,
				eventType: "status_changed",
				actorId: ctx.session.user.id,
				actorRole: role,
				actorIp: null,
				payload: {
					from: complaint.status,
					to: newStatus,
				},
				reason: input.reason ?? null,
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

			return { success: true, newStatus };
		}),
});
