import { describe, it, expect } from "vitest";
import {
	canTransition,
	transition,
	getValidTransitions,
} from "./complaint-state-machine";

describe("complaint state machine", () => {
	it("allows a valid transition for the correct role", () => {
		expect(canTransition("draft", "recibida", "officer")).toBe(true);
	});

	it("blocks a valid transition for the wrong role", () => {
		expect(canTransition("draft", "recibida", "citizen")).toBe(false);
	});

	it("blocks an invalid transition regardless of role", () => {
		expect(canTransition("draft", "archivada", "admin")).toBe(false);
	});

	it("throws a descriptive error on illegal transition", () => {
		expect(() => transition("archivada", "recibida", "admin")).toThrow(
			"archivada → recibida is not allowed",
		);
	});

	it("returns only valid transitions for a given role", () => {
		const options = getValidTransitions("recibida", "officer");
		expect(options).toContain("en_revision");
		expect(options).not.toContain("archivada");
	});
});
