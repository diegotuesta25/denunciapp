"use server";
import { db } from "@/lib/db";
import { complaints, complaintEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyChain } from "@/server/domain/audit-chain";
import { ok, err, type Result } from "@/lib/result";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";
import { getIp } from "@/lib/get-ip";
import { verifyLimiter } from "@/lib/rate-limit";

export type VerifyResult = {
	trackingCode: string;
	eventCount: number;
	firstEventAt: Date;
	lastEventAt: Date;
	chainValid: boolean;
	brokenAtIndex: number | null;
};

export async function verifyComplaint(
	trackingCode: string,
): Promise<Result<VerifyResult>> {
	const startTime = Date.now();
	const code = trackingCode.trim().toUpperCase();

	logger.info(
		{ action: "verifyComplaint", trackingCode: code },
		"Chain verification started",
	);

	try {
		if (!code) {
			return err("INVALID_INPUT", "Ingresa un código válido");
		}
		const ip = await getIp();
		const {
			success: rateLimitOk,
			limit,
			remaining,
		} = await verifyLimiter.limit(ip);

		if (!rateLimitOk) {
			logger.warn({ action: "verifyComplaint", ip }, "Rate limit exceeded");
			return err(
				"RATE_LIMITED",
				`Has verificado demasiadas denuncias. Intenta nuevamente en un minuto.`,
			);
		}

		logger.info(
			{ action: "verifyComplaint", ip, remaining },
			"Rate limit check passed",
		);

		const complaint = await db.query.complaints.findFirst({
			where: eq(complaints.trackingCode, code),
			columns: { id: true, trackingCode: true },
		});

		if (!complaint) {
			logger.warn(
				{ action: "verifyComplaint", trackingCode: code },
				"Complaint not found for verification",
			);
			return err("NOT_FOUND", "No se encontró ninguna denuncia con ese código");
		}

		const events = await db.query.complaintEvents.findMany({
			where: eq(complaintEvents.complaintId, complaint.id),
			orderBy: (e, { asc }) => [asc(e.createdAt)],
		});

		if (events.length === 0) {
			logger.warn(
				{ action: "verifyComplaint", complaintId: complaint.id },
				"Complaint has no events — data integrity issue",
			);
			// This should never happen — flag it in Sentry
			Sentry.captureMessage(
				`Complaint ${complaint.id} has no audit events`,
				"warning",
			);
			return err("CHAIN_ERROR", "Esta denuncia no tiene eventos registrados");
		}

		const chainResult = verifyChain(events);

		// A broken chain is a security event — always flag it
		if (!chainResult.valid) {
			logger.error(
				{
					action: "verifyComplaint",
					complaintId: complaint.id,
					trackingCode: code,
					brokenAtIndex: chainResult.brokenAtIndex,
				},
				"Chain integrity violation detected",
			);
			Sentry.captureMessage(
				`Audit chain broken for complaint ${complaint.id} at index ${chainResult.brokenAtIndex}`,
				"error",
			);
		}

		logger.info(
			{
				action: "verifyComplaint",
				trackingCode: code,
				eventCount: events.length,
				chainValid: chainResult.valid,
				durationMs: Date.now() - startTime,
			},
			"Chain verification completed",
		);

		return ok({
			trackingCode: complaint.trackingCode,
			eventCount: events.length,
			firstEventAt: events[0].createdAt,
			lastEventAt: events[events.length - 1].createdAt,
			chainValid: chainResult.valid,
			brokenAtIndex: chainResult.valid ? null : chainResult.brokenAtIndex,
		});
	} catch (error) {
		logger.error(
			{
				action: "verifyComplaint",
				trackingCode: code,
				durationMs: Date.now() - startTime,
				error: error instanceof Error ? error.message : String(error),
			},
			"Unexpected error during chain verification",
		);

		Sentry.captureException(error, {
			tags: { action: "verifyComplaint" },
		});

		return err("DB_ERROR", "Error al verificar la denuncia");
	}
}
