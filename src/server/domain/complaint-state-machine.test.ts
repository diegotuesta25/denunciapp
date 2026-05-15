import { describe, it, expect } from "vitest";
import {
	canTransition,
	transition,
	getValidTransitions,
} from "./complaint-state-machine";

describe("canTransition", () => {
	describe("valid transitions", () => {
		it("allows officer to move draft → recibida", () => {
			expect(canTransition("draft", "recibida", "officer")).toBe(true);
		});

		it("allows officer to move recibida → en_revision", () => {
			expect(canTransition("recibida", "en_revision", "officer")).toBe(true);
		});

		it("allows officer to move en_revision → asignada", () => {
			expect(canTransition("en_revision", "asignada", "officer")).toBe(true);
		});

		it("allows comisario to archive a case", () => {
			expect(canTransition("en_investigacion", "archivada", "comisario")).toBe(
				true,
			);
		});

		it("allows admin to make any valid transition", () => {
			expect(canTransition("draft", "recibida", "admin")).toBe(true);
			expect(canTransition("en_investigacion", "archivada", "admin")).toBe(
				true,
			);
		});
	});

	describe("role restrictions", () => {
		it("blocks citizen from advancing any status", () => {
			expect(canTransition("draft", "recibida", "citizen")).toBe(false);
			expect(canTransition("recibida", "en_revision", "citizen")).toBe(false);
		});

		it("blocks officer from archiving a case", () => {
			expect(canTransition("en_investigacion", "archivada", "officer")).toBe(
				false,
			);
		});

		it("blocks officer from deriving to fiscalia", () => {
			expect(
				canTransition("en_investigacion", "derivada_fiscalia", "officer"),
			).toBe(false);
		});
	});

	describe("invalid transitions", () => {
		it("blocks skipping states — draft cannot go directly to asignada", () => {
			expect(canTransition("draft", "asignada", "admin")).toBe(false);
		});

		it("blocks going backwards — en_revision cannot go back to draft", () => {
			expect(canTransition("en_revision", "draft", "admin")).toBe(false);
		});

		it("blocks any transition from archivada — it is terminal", () => {
			expect(canTransition("archivada", "recibida", "admin")).toBe(false);
			expect(canTransition("archivada", "en_revision", "admin")).toBe(false);
		});

		it("blocks any transition from anulada — it is terminal", () => {
			expect(canTransition("anulada", "recibida", "admin")).toBe(false);
		});
	});
});

describe("transition", () => {
	it("returns the new status on a valid transition", () => {
		const result = transition("draft", "recibida", "officer");
		expect(result).toBe("recibida");
	});

	it("throws a descriptive error on an illegal transition", () => {
		expect(() => transition("archivada", "recibida", "admin")).toThrow(
			"archivada → recibida is not allowed",
		);
	});

	it("throws when the role has no permission", () => {
		expect(() => transition("draft", "recibida", "citizen")).toThrow(
			'draft → recibida is not allowed for role "citizen"',
		);
	});
});

describe("getValidTransitions", () => {
	it("returns only statuses the officer can move to from recibida", () => {
		const result = getValidTransitions("recibida", "officer");
		expect(result).toContain("en_revision");
		expect(result).not.toContain("archivada");
		expect(result).not.toContain("derivada_fiscalia");
	});

	it("returns empty array from a terminal status", () => {
		expect(getValidTransitions("archivada", "admin")).toHaveLength(0);
		expect(getValidTransitions("anulada", "admin")).toHaveLength(0);
	});

	it("returns empty array for citizen role", () => {
		expect(getValidTransitions("draft", "citizen")).toHaveLength(0);
	});

	it("returns correct options for comisario from en_investigacion", () => {
		const result = getValidTransitions("en_investigacion", "comisario");
		expect(result).toContain("derivada_fiscalia");
		expect(result).toContain("archivada");
	});
});
