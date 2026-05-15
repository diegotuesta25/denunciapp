"use server";
import { db } from "@/lib/db";
import { evidence } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { ok, err, type Result } from "@/lib/result";

export type EvidenceItem = {
	id: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	blobUrl: string;
	sha256Hash: string;
	createdAt: Date;
};

export async function getComplaintEvidence(
	complaintId: string,
): Promise<Result<EvidenceItem[]>> {
	const session = await auth();
	if (!session) return err("AUTH_REQUIRED", "No autorizado");

	const rows = await db.query.evidence.findMany({
		where: eq(evidence.complaintId, complaintId),
		columns: {
			id: true,
			fileName: true,
			fileSize: true,
			mimeType: true,
			blobUrl: true,
			sha256Hash: true,
			createdAt: true,
		},
		orderBy: (e, { asc }) => [asc(e.createdAt)],
	});

	return ok(rows);
}
