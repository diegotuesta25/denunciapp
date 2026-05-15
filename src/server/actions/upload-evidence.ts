"use server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { evidence, complaints, complaintEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ok, err, type Result } from "@/lib/result";
import { buildEvent, GENESIS_HASH } from "@/server/domain/audit-chain";
import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

const ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/heic",
	"application/pdf",
	"audio/mpeg",
	"audio/mp4",
	"audio/wav",
	"video/mp4",
	"video/quicktime",
] as const;

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

const ConfirmUploadSchema = z.object({
	complaintId: z.string().uuid(),
	fileName: z.string().min(1).max(255),
	fileSize: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
	mimeType: z.enum(ALLOWED_MIME_TYPES),
	blobUrl: z.string().url(),
	sha256Hash: z
		.string()
		.length(64)
		.regex(/^[a-f0-9]+$/),
});

export type ConfirmUploadInput = z.infer<typeof ConfirmUploadSchema>;

export async function confirmEvidenceUpload(
	input: unknown,
): Promise<Result<{ evidenceId: string }>> {
	const startTime = Date.now();

	try {
		console.log("confirmEvidenceUpload called with:", JSON.stringify(input));
		const parseResult = ConfirmUploadSchema.safeParse(input);
		console.log(
			"Parse result:",
			parseResult.success,
			parseResult.success ? "ok" : parseResult.error.errors,
		);

		if (!parseResult.success) {
			return err("INVALID_INPUT", "Datos de archivo inválidos");
		}
		const data = parseResult.data;

		const session = await auth();

		const complaint = await db.query.complaints.findFirst({
			where: eq(complaints.id, data.complaintId),
			columns: { id: true, currentHash: true, status: true },
		});

		if (!complaint) return err("NOT_FOUND", "Denuncia no encontrada");

		const evidenceId = crypto.randomUUID();

		const event = buildEvent({
			complaintId: complaint.id,
			eventType: "evidence_added",
			actorId: session?.user?.id ?? null,
			actorRole: session?.user?.role as any,
			actorIp: null,
			payload: {
				evidenceId,
				fileName: data.fileName,
				fileSize: data.fileSize,
				mimeType: data.mimeType,
				sha256Hash: data.sha256Hash,
			},
			reason: null,
			prevHash: complaint.currentHash ?? GENESIS_HASH,
		});

		await db.transaction(async tx => {
			await tx.insert(evidence).values({
				id: evidenceId,
				complaintId: data.complaintId,
				uploadedById: session?.user?.id,
				fileName: data.fileName,
				fileSize: data.fileSize,
				mimeType: data.mimeType,
				blobUrl: data.blobUrl,
				sha256Hash: data.sha256Hash,
				status: "confirmed",
			});

			await tx.insert(complaintEvents).values(event);

			await tx
				.update(complaints)
				.set({ currentHash: event.hash, updatedAt: new Date() })
				.where(eq(complaints.id, complaint.id));
		});

		revalidatePath(`/officer/${complaint.id}`);

		logger.info(
			{
				action: "confirmEvidenceUpload",
				complaintId: complaint.id,
				evidenceId,
				fileName: data.fileName,
				fileSize: data.fileSize,
				sha256Hash: data.sha256Hash,
				actorId: session?.user?.id,
				durationMs: Date.now() - startTime,
			},
			"Evidence upload confirmed",
		);

		return ok({ evidenceId });
	} catch (error) {
		logger.error(
			{
				action: "confirmEvidenceUpload",
				durationMs: Date.now() - startTime,
				error: error instanceof Error ? error.message : String(error),
			},
			"Unexpected error confirming evidence upload",
		);

		Sentry.captureException(error, {
			tags: { action: "confirmEvidenceUpload" },
		});

		return err("UPLOAD_ERROR", "Error al registrar el archivo");
	}
}
