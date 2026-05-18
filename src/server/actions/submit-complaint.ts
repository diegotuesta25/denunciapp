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
	const startTime = Date.now();
	try {
		const ip = await getIp();

		if (process.env.DISABLE_RATE_LIMIT !== "true") {
			const { success, remaining } = await complaintSubmitLimiter.limit(ip);

			logger.info(
				{ action: "submitComplaint", ip, remaining },
				"Rate limit check passed",
			);

			if (!success) {
				logger.warn({ action: "submitComplaint", ip }, "Rate limit exceeded");
				return err(
					"RATE_LIMITED",
					"Has enviado demasiadas denuncias. Intenta nuevamente en una hora.",
				);
			}
		}

		const parsed = complaintFormSchema.safeParse(formData);
		if (!parsed.success) {
			return err("INVALID_INPUT", "Datos del formulario inválidos.");
		}
		const data = parsed.data;

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
			await tx.insert(complaints).values({
				id: complaintId,
				trackingCode,
				type: data.type,
				subtype: data.subtype,
				status: "recibida",
				narrativeOriginal: data.narrative,
				narrativeFinal: data.narrative,
				locationAddress: data.locationAddress,
				jurisdictionId: data.jurisdictionId,
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

		logger.info(
			{
				action: "submitComplaint",
				complaintId,
				trackingCode,
				durationMs: Date.now() - startTime,
			},
			"Complaint submitted successfully",
		);

		return ok({ trackingCode, complaintId });
	} catch (error) {
		logger.error({
			action: "submitComplaint",
			error: String(error),
			durationMs: Date.now() - startTime,
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
