"use server";
import { db } from "@/lib/db";
import {
	complaints,
	complaintEvents,
	persons,
	complaintParties,
} from "@/lib/db/schema";
import { complaintFormSchema } from "@/lib/validations/complaint";
import { buildEvent, GENESIS_HASH } from "@/server/domain/audit-chain";
import { generateTrackingCode } from "@/lib/tracking-code";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { ok, err, type Result } from "@/lib/result";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";
import { complaintSubmitLimiter } from "@/lib/rate-limit";
import { getIp } from "@/lib/get-ip";

type SubmitResult = Result<{ trackingCode: string; complaintId: string }>;

export async function submitComplaint(
	formData: unknown,
): Promise<SubmitResult> {
	try {
		const ip = await getIp();
		const { success: rateLimitOk, remaining } =
			await complaintSubmitLimiter.limit(ip);
		if (!rateLimitOk) {
			logger.warn({ action: "submitComplaint", ip }, "Rate limit exceeded");
			return err(
				"RATE_LIMITED",
				`Has enviado demasiadas denuncias. Intenta nuevamente en una hora.`,
			);
		}
		const data = complaintFormSchema.parse(formData);
		const session = await auth();
		const complaintId = uuid();
		const trackingCode = generateTrackingCode();
		const incidentAt = new Date(`${data.incidentDate}T${data.incidentTime}`);

		logger.info(
			{ action: "submitComplaint", ip, remaining },
			"Rate limit check passed",
		);
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

		return ok({ trackingCode, complaintId });
	} catch (error) {
		logger.error({
			action: "submitComplaint",
			error: String(error),
		});

		Sentry.captureException(error, {
			tags: { action: "submitComplaint" },
		});

		return err(
			"DB_ERROR",
			"Ocurrió un error al registrar la denuncia. Por favor intenta nuevamente.",
		);
	}
}
