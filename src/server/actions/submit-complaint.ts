"use server";
import { db } from "@/lib/db";
import {
	complaints,
	complaintEvents,
	users,
	persons,
	complaintParties,
} from "@/lib/db/schema";
import { complaintFormSchema } from "@/lib/validations/complaint";
import { buildEvent, GENESIS_HASH } from "@/server/domain/audit-chain";
import { generateTrackingCode } from "@/lib/tracking-code";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

type SubmitResult =
	| { success: true; trackingCode: string }
	| { success: false; error: string };

export async function submitComplaint(
	formData: unknown,
): Promise<SubmitResult> {
	try {
		const data = complaintFormSchema.parse(formData);
		const session = await auth();
		const complaintId = uuid();
		const trackingCode = generateTrackingCode();
		const incidentAt = new Date(`${data.incidentDate}T${data.incidentTime}`);
		const genesisEvent = buildEvent({
			complaintId,
			eventType: "created",
			actorId: session?.user?.id ?? null,
			actorRole: session?.user?.role ?? "citizen",
			actorIp: null,
			payload: {
				type: data.type,
				subtype: data.subtype ?? null,
				narrativeLength: data.narrative.length,
			},
			reason: null,
			prevHash: GENESIS_HASH,
		});

		await db.transaction(async tx => {
			// Insert the complaint
			await tx.insert(complaints).values({
				id: complaintId,
				trackingCode,
				type: data.type,
				subtype: data.subtype,
				status: "recibida",
				narrativeOriginal: data.narrative,
				narrativeFinal: data.narrative,
				locationAddress: data.locationAddress,
				incidentAt,
				currentHash: genesisEvent.hash,
			});

			await tx.insert(complaintEvents).values(genesisEvent);

			const existingPerson = await tx.query.persons.findFirst({
				where: eq(persons.dni, data.complainantDni),
			});

			const personId = existingPerson?.id ?? uuid();

			if (!existingPerson) {
				await tx.insert(persons).values({
					id: personId,
					dni: data.complainantDni,
					name: data.complainantName,
					phone: data.complainantPhone || null,
					email: data.complainantEmail || null,
				});
			}

			await tx.insert(complaintParties).values({
				complaintId,
				personId,
				role: "victima",
			});
		});

		return { success: true, trackingCode };
	} catch (error) {
		console.error("submitComplaint error:", error);
		return {
			success: false,
			error:
				"Ocurrió un error al registrar la denuncia. Por favor intenta nuevamente.",
		};
	}
}
