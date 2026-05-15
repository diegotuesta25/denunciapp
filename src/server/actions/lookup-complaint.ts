"use server";
import { db } from "@/lib/db";
import {
	complaints,
	complaintEvents,
	complaintParties,
	persons,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ok, err, type Result } from "@/lib/result";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";
import { trackingLimiter } from "@/lib/rate-limit";
import { getIp } from "@/lib/get-ip";
import { z } from "zod";

const LookupSchema = z.object({
	trackingCode: z
		.string()
		.min(10, "Código inválido")
		.max(20, "Código inválido")
		.regex(/^DEN-[A-Z0-9]+$/, "Formato de código inválido"),
	dniSuffix: z
		.string()
		.length(4, "Ingresa exactamente 4 dígitos")
		.regex(/^\d{4}$/, "Solo se permiten dígitos"),
});

type LookupInput = {
	trackingCode: string;
	dniSuffix: string;
};

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
	input: unknown,
): Promise<Result<ComplaintPublicView>> {
	const parseResult = LookupSchema.safeParse(input);
	if (!parseResult.success) {
		return err("INVALID_INPUT", "Código o DNI inválidos");
	}
	const data = parseResult.data;
	const startTime = Date.now();

	logger.info(
		{ action: "lookupComplaint", trackingCode: data.trackingCode },
		"Complaint lookup started",
	);

	try {
		const ip = await getIp();
		const {
			success: rateLimitOk,
			limit,
			remaining,
		} = await trackingLimiter.limit(ip);

		if (!rateLimitOk) {
			logger.warn({ action: "lookupComplaint", ip }, "Rate limit exceeded");
			return err(
				"RATE_LIMITED",
				`Has intentado tracker demasiadas denuncias. Intenta nuevamente en un minuto.`,
			);
		}

		logger.info(
			{ action: "lookupComplaint", ip, remaining },
			"Rate limit check passed",
		);
		const complaint = await db.query.complaints.findFirst({
			where: eq(complaints.trackingCode, data.trackingCode),
			columns: {
				id: true,
				trackingCode: true,
				status: true,
				type: true,
				createdAt: true,
			},
		});

		if (!complaint) {
			logger.warn(
				{ action: "lookupComplaint", trackingCode: data.trackingCode },
				"Complaint not found",
			);
			return err("NOT_FOUND", "No encontramos una denuncia con ese código.");
		}

		const party = await db.query.complaintParties.findFirst({
			where: and(
				eq(complaintParties.complaintId, complaint.id),
				eq(complaintParties.role, "victima"),
			),
			with: { person: { columns: { dni: true } } },
		});

		const dni = party?.person?.dni ?? "";
		if (!dni.endsWith(data.dniSuffix)) {
			logger.warn(
				{ action: "lookupComplaint", trackingCode: data.trackingCode },
				"DNI suffix mismatch",
			);
			return err("NOT_FOUND", "El código o los dígitos del DNI no coinciden.");
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

		logger.info(
			{
				action: "lookupComplaint",
				trackingCode: complaint.trackingCode,
				eventCount: events.length,
				durationMs: Date.now() - startTime,
			},
			"Complaint lookup succeeded",
		);

		return ok({ ...complaint, events });
	} catch (error) {
		logger.error(
			{
				action: "lookupComplaint",
				trackingCode: data.trackingCode,
				durationMs: Date.now() - startTime,
				error: error instanceof Error ? error.message : String(error),
			},
			"Unexpected error during complaint lookup",
		);

		Sentry.captureException(error, {
			tags: { action: "lookupComplaint" },
		});

		return err(
			"DB_ERROR",
			"Error al consultar la denuncia. Intenta nuevamente.",
		);
	}
}
