"use server";
import { db } from "@/lib/db";
import {
	complaints,
	complaintEvents,
	complaintParties,
	persons,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

type LookupInput = {
	trackingCode: string;
	dniSuffix: string;
};

export type ComplaintLookupResult =
	| { success: true; data: ComplaintPublicView }
	| { success: false; error: string };

export type ComplaintPublicView = {
	trackingCode: string;
	status: string;
	type: string;
	createdAt: Date;
	events: {
		id: string;
		eventType: string;
		hash: string;
		createdAt: Date;
		payload: unknown;
	}[];
};

export async function lookupComplaint(
	input: LookupInput,
): Promise<ComplaintLookupResult> {
	try {
		const complaint = await db.query.complaints.findFirst({
			where: eq(complaints.trackingCode, input.trackingCode),
			columns: {
				id: true,
				trackingCode: true,
				status: true,
				type: true,
				createdAt: true,
			},
		});

		if (!complaint) {
			return {
				success: false,
				error: "No encontramos una denuncia con ese código.",
			};
		}

		const party = await db.query.complaintParties.findFirst({
			where: and(
				eq(complaintParties.complaintId, complaint.id),
				eq(complaintParties.role, "victima"),
			),
			with: {
				person: {
					columns: { dni: true },
				},
			},
		});

		const dni = party?.person?.dni ?? "";
		if (!dni.endsWith(input.dniSuffix)) {
			return {
				success: false,
				error: "El código o los dígitos del DNI no coinciden.",
			};
		}

		const events = await db.query.complaintEvents.findMany({
			where: eq(complaintEvents.complaintId, complaint.id),
			columns: {
				id: true,
				eventType: true,
				hash: true,
				createdAt: true,
				payload: true,
			},
			orderBy: (e, { asc }) => [asc(e.createdAt)],
		});

		return {
			success: true,
			data: { ...complaint, events },
		};
	} catch {
		return {
			success: false,
			error: "Error al consultar la denuncia. Intenta nuevamente.",
		};
	}
}
