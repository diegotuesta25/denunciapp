"use server";
import { db } from "@/lib/db";
import { complaints, complaintEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { ok, err, type Result } from "@/lib/result";
import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

export type ReconciliationResult = {
	total: number;
	mismatches: {
		complaintId: string;
		trackingCode: string;
		storedStatus: string;
		expectedStatus: string;
	}[];
};

function computeExpectedStatus(
	events: { eventType: string; payload: unknown }[],
): string {
	let status = "recibida";

	for (const event of events) {
		if (event.eventType === "status_changed") {
			const payload = event.payload as { to?: string } | null;
			if (payload?.to) status = payload.to;
		}
	}

	return status;
}

export async function reconcileComplaints(): Promise<
	Result<ReconciliationResult>
> {
	const session = await auth();
	if (!session) return err("AUTH_REQUIRED", "No autorizado");

	const allowedRoles = ["internal_affairs", "admin"];
	if (!allowedRoles.includes(session.user.role)) {
		return err("FORBIDDEN", "Sin permisos para reconciliar denuncias");
	}

	try {
		const allComplaints = await db.query.complaints.findMany({
			columns: { id: true, trackingCode: true, status: true },
		});

		const mismatches: ReconciliationResult["mismatches"] = [];

		for (const complaint of allComplaints) {
			const events = await db.query.complaintEvents.findMany({
				where: eq(complaintEvents.complaintId, complaint.id),
				columns: { eventType: true, payload: true },
				orderBy: (e, { asc }) => [asc(e.createdAt)],
			});

			const expectedStatus = computeExpectedStatus(events);

			if (expectedStatus !== complaint.status) {
				mismatches.push({
					complaintId: complaint.id,
					trackingCode: complaint.trackingCode,
					storedStatus: complaint.status,
					expectedStatus,
				});

				logger.error(
					{
						action: "reconcileComplaints",
						complaintId: complaint.id,
						trackingCode: complaint.trackingCode,
						storedStatus: complaint.status,
						expectedStatus,
					},
					"Status mismatch detected — possible tampering",
				);

				Sentry.captureMessage(
					`Status mismatch on complaint ${complaint.trackingCode}: stored=${complaint.status}, expected=${expectedStatus}`,
					"error",
				);
			}
		}

		logger.info(
			{
				action: "reconcileComplaints",
				total: allComplaints.length,
				mismatches: mismatches.length,
				actorId: session.user.id,
			},
			"Reconciliation completed",
		);

		return ok({ total: allComplaints.length, mismatches });
	} catch (error) {
		logger.error(
			{ action: "reconcileComplaints", error: String(error) },
			"Reconciliation failed",
		);
		Sentry.captureException(error, { tags: { action: "reconcileComplaints" } });
		return err("DB_ERROR", "Error al reconciliar denuncias");
	}
}
