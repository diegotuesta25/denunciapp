"use server";
import { db } from "@/lib/db";
import { complaints, complaintEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyChain } from "@/server/domain/audit-chain";

export type VerifyResult =
	| {
			success: true;
			data: {
				trackingCode: string;
				eventCount: number;
				firstEventAt: Date;
				lastEventAt: Date;
				chainValid: boolean;
				brokenAtIndex: number | null;
			};
	  }
	| { success: false; error: string };

export async function verifyComplaint(
	trackingCode: string,
): Promise<VerifyResult> {
	try {
		const code = trackingCode.trim().toUpperCase();
		if (!code) {
			return { success: false, error: "Ingresa un código válido" };
		}

		const complaint = await db.query.complaints.findFirst({
			where: eq(complaints.trackingCode, code),
			columns: { id: true, trackingCode: true },
		});

		if (!complaint) {
			return {
				success: false,
				error: "No se encontró ninguna denuncia con ese código",
			};
		}

		const events = await db.query.complaintEvents.findMany({
			where: eq(complaintEvents.complaintId, complaint.id),
			orderBy: (e, { asc }) => [asc(e.createdAt)],
		});

		if (events.length === 0) {
			return {
				success: false,
				error: "Esta denuncia no tiene eventos registrados",
			};
		}

		const chainResult = verifyChain(events);

		return {
			success: true,
			data: {
				trackingCode: complaint.trackingCode,
				eventCount: events.length,
				firstEventAt: events[0].createdAt,
				lastEventAt: events[events.length - 1].createdAt,
				chainValid: chainResult.valid,
				brokenAtIndex: chainResult.valid ? null : chainResult.brokenAtIndex,
			},
		};
	} catch (error) {
		console.error("verifyComplaint error:", error);
		return { success: false, error: "Error al verificar la denuncia" };
	}
}
