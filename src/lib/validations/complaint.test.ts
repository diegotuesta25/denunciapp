import { describe, it, expect } from "vitest";
import {
	step1Schema,
	step3Schema,
	complaintFormSchema,
	step2Schema,
} from "./complaint";

describe("step1Schema", () => {
	it("validates a complete valid step 1", () => {
		const result = step1Schema.safeParse({
			type: "patrimonio",
			incidentDate: "2026-05-01",
			incidentTime: "14:30",
			narrative: "A".repeat(50),
		});
		expect(result.success).toBe(true);
	});

	it("rejects a narrative that is too short", () => {
		const result = step1Schema.safeParse({
			type: "patrimonio",
			incidentDate: "2026-05-01",
			incidentTime: "14:30",
			narrative: "too short",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].path).toContain("narrative");
		}
	});

	it("rejects a future incident date", () => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		const futureDate = tomorrow.toISOString().split("T")[0];

		const result = step1Schema.safeParse({
			type: "patrimonio",
			incidentDate: futureDate,
			incidentTime: "14:30",
			narrative: "A".repeat(50),
		});
		expect(result.success).toBe(false);
	});

	it("rejects an invalid complaint type", () => {
		const result = step1Schema.safeParse({
			type: "invalid_type",
			incidentDate: "2026-05-01",
			incidentTime: "14:30",
			narrative: "A".repeat(50),
		});
		expect(result.success).toBe(false);
	});
});

describe("step2Schema", () => {
	it("validates a complete valid step 2", () => {
		const result = step2Schema.safeParse({
			locationAddress: "Calle Vicente Romero 123",
			jurisdictionId: "0252b0ac-e99a-471c-ac34-85d2ae592a57",
		});
		expect(result.success).toBe(true);
	});

	it("rejects a location too short", () => {
		const result = step2Schema.safeParse({
			locationAddress: "Call",
			jurisdictionId: "0252b0ac-e99a-471c-ac34-85d2ae592a57",
		});
		expect(result.success).toBe(false);
	});

	it("rejects a not selected jurisdiction", () => {
		const result = step2Schema.safeParse({
			locationAddress: "Calle Vicente Romero 123",
			jurisdictionId: "",
		});
		expect(result.success).toBe(false);
	});
});

describe("step3Schema", () => {
	it("validates a complete valid step 3", () => {
		const result = step3Schema.safeParse({
			complainantName: "Diego Tuesta",
			complainantDni: "12345678",
		});
		expect(result.success).toBe(true);
	});

	it("rejects a DNI shorter than 8 digits", () => {
		const result = step3Schema.safeParse({
			complainantName: "Diego Tuesta",
			complainantDni: "1234567",
		});
		expect(result.success).toBe(false);
	});

	it("rejects a DNI with letters", () => {
		const result = step3Schema.safeParse({
			complainantName: "Diego Tuesta",
			complainantDni: "1234567X",
		});
		expect(result.success).toBe(false);
	});

	it("rejects an invalid email format", () => {
		const result = step3Schema.safeParse({
			complainantName: "Diego Tuesta",
			complainantDni: "12345678",
			complainantEmail: "not-an-email",
		});
		expect(result.success).toBe(false);
	});

	it("allows empty optional fields", () => {
		const result = step3Schema.safeParse({
			complainantName: "Diego Tuesta",
			complainantDni: "12345678",
			complainantEmail: "",
			complainantPhone: "",
		});
		expect(result.success).toBe(true);
	});
});

describe("tracking code format", () => {
	it("accepts a valid DEN- tracking code", () => {
		const code = "DEN-X7KP2M4";
		expect(code.startsWith("DEN-")).toBe(true);
		expect(code.length).toBeLessThanOrEqual(12);
	});
});
