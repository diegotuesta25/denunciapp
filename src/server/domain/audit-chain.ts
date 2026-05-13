import { createHash } from "crypto";
import { ulid } from "ulid";
import type { complaintEvents } from "@/lib/db/schema";
import type { InferSelectModel } from "drizzle-orm";

type ComplaintEvent = InferSelectModel<typeof complaintEvents>;

function canonicalString(
	prevHash: string,
	payload: unknown,
	meta: { eventType: string; actorId: string | null; createdAt: Date },
): string {
	const sortedPayload = payload
		? JSON.stringify(payload, Object.keys(payload as object).sort())
		: "null";

	return [
		prevHash,
		sortedPayload,
		meta.eventType,
		meta.actorId ?? "system",
		meta.createdAt.toISOString(),
	].join("|");
}

export function computeHash(
	prevHash: string,
	payload: unknown,
	meta: { eventType: string; actorId: string | null; createdAt: Date },
): string {
	return createHash("sha256")
		.update(canonicalString(prevHash, payload, meta))
		.digest("hex");
}

type NewEventInput = {
	complaintId: string;
	eventType: ComplaintEvent["eventType"];
	actorId: string | null;
	actorRole: ComplaintEvent["actorRole"];
	actorIp: string | null;
	payload: Record<string, unknown> | null;
	reason: string | null;
	prevHash: string;
};

export function buildEvent(input: NewEventInput) {
	const id = ulid();
	const createdAt = new Date();

	const hash = computeHash(input.prevHash, input.payload, {
		eventType: input.eventType,
		actorId: input.actorId,
		createdAt,
	});

	return {
		id,
		complaintId: input.complaintId,
		eventType: input.eventType,
		actorId: input.actorId,
		actorRole: input.actorRole,
		actorIp: input.actorIp,
		payload: input.payload,
		reason: input.reason,
		prevHash: input.prevHash,
		hash,
		createdAt,
	};
}

export const GENESIS_HASH = "0".repeat(64);

export function verifyChain(
	events: ComplaintEvent[],
): { valid: true } | { valid: false; brokenAtIndex: number } {
	const sorted = [...events].sort((a, b) => a.id.localeCompare(b.id));

	for (let i = 0; i < sorted.length; i++) {
		const event = sorted[i];

		const expectedHash = computeHash(
			event.prevHash ?? GENESIS_HASH,
			event.payload,
			{
				eventType: event.eventType,
				actorId: event.actorId,
				createdAt: event.createdAt,
			},
		);

		if (expectedHash !== event.hash) {
			return { valid: false, brokenAtIndex: i };
		}
	}

	return { valid: true };
}
