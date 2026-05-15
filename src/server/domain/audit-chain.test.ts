import { describe, it, expect } from "vitest";
import {
	buildEvent,
	verifyChain,
	computeHash,
	GENESIS_HASH,
} from "./audit-chain";

function makeEvent(overrides: Partial<Parameters<typeof buildEvent>[0]> = {}) {
	return buildEvent({
		complaintId: "complaint-123",
		eventType: "created",
		actorId: "user-456",
		actorRole: "officer",
		actorIp: null,
		payload: { test: true },
		reason: null,
		prevHash: GENESIS_HASH,
		...overrides,
	});
}

describe("buildEvent", () => {
	it("generates a ULID id", () => {
		const event = makeEvent();
		expect(event.id).toHaveLength(26);
	});

	it("computes a 64-character SHA-256 hash", () => {
		const event = makeEvent();
		expect(event.hash).toHaveLength(64);
		expect(event.hash).toMatch(/^[a-f0-9]+$/);
	});

	it("stores the prevHash correctly", () => {
		const event = makeEvent({ prevHash: GENESIS_HASH });
		expect(event.prevHash).toBe(GENESIS_HASH);
	});

	it("produces different hashes for different payloads", () => {
		const event1 = makeEvent({ payload: { type: "a" } });
		const event2 = makeEvent({ payload: { type: "b" } });
		expect(event1.hash).not.toBe(event2.hash);
	});

	it("produces different hashes for different actors", () => {
		const event1 = makeEvent({ actorId: "user-1" });
		const event2 = makeEvent({ actorId: "user-2" });
		expect(event1.hash).not.toBe(event2.hash);
	});

	it("produces the same hash for identical inputs", () => {
		const payload = { key: "value" };
		const meta = {
			eventType: "created" as const,
			actorId: "user-1",
			createdAt: new Date("2026-05-01T12:00:00Z"),
		};
		const hash1 = computeHash(GENESIS_HASH, payload, meta);
		const hash2 = computeHash(GENESIS_HASH, payload, meta);
		expect(hash1).toBe(hash2);
	});
});

describe("verifyChain", () => {
	it("verifies a single-event chain as valid", () => {
		const event = makeEvent();
		const result = verifyChain([event]);
		expect(result.valid).toBe(true);
	});

	it("verifies a multi-event chain as valid", () => {
		const event1 = makeEvent();
		const event2 = makeEvent({
			eventType: "status_changed",
			prevHash: event1.hash,
			payload: { from: "draft", to: "recibida" },
		});
		const event3 = makeEvent({
			eventType: "note_added",
			prevHash: event2.hash,
			payload: { text: "Officer note", visibility: "private" },
		});

		const result = verifyChain([event1, event2, event3]);
		expect(result.valid).toBe(true);
	});

	it("detects tampering in the first event", () => {
		const event = makeEvent();

		const tampered = {
			...event,
			payload: { test: false },
		};

		const result = verifyChain([tampered]);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.brokenAtIndex).toBe(0);
		}
	});

	it("detects tampering in a middle event", () => {
		const event1 = makeEvent();
		const event2 = makeEvent({
			eventType: "status_changed",
			prevHash: event1.hash,
			payload: { from: "draft", to: "recibida" },
		});
		const event3 = makeEvent({
			eventType: "note_added",
			prevHash: event2.hash,
			payload: { text: "note" },
		});

		const tamperedEvent2 = {
			...event2,
			payload: { from: "draft", to: "archivada" },
		};

		const result = verifyChain([event1, tamperedEvent2, event3]);

		expect(result.valid).toBe(false);

		if (!result.valid) {
			expect(result.brokenAtIndex).toBeGreaterThanOrEqual(0);
		}
	});

	it("detects tampering in the actorId", () => {
		const event = makeEvent({ actorId: "user-legitimate" });
		const tampered = { ...event, actorId: "user-corrupt" };

		const result = verifyChain([tampered]);
		expect(result.valid).toBe(false);
	});

	it("verifies events regardless of input order", () => {
		const event1 = makeEvent();
		const event2 = makeEvent({
			eventType: "status_changed",
			prevHash: event1.hash,
		});

		const result = verifyChain([event2, event1]);
		expect(result.valid).toBe(true);
	});

	it("returns valid for an empty event list", () => {
		const result = verifyChain([]);
		expect(result.valid).toBe(true);
	});
});
