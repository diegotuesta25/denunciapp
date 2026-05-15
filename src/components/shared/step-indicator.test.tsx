import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepIndicator } from "./step-indicator";

describe("StepIndicator", () => {
	const labels = ["Incidente", "Lugar", "Tus datos"];

	it("renders all step labels", () => {
		render(<StepIndicator currentStep={1} totalSteps={3} labels={labels} />);
		expect(screen.getByText("Incidente")).toBeInTheDocument();
		expect(screen.getByText("Lugar")).toBeInTheDocument();
		expect(screen.getByText("Tus datos")).toBeInTheDocument();
	});

	it("shows step number for upcoming steps", () => {
		render(<StepIndicator currentStep={1} totalSteps={3} labels={labels} />);
		// Steps 2 and 3 should show their numbers
		expect(screen.getByText("2")).toBeInTheDocument();
		expect(screen.getByText("3")).toBeInTheDocument();
	});

	it("shows checkmark for completed steps", () => {
		render(<StepIndicator currentStep={3} totalSteps={3} labels={labels} />);
		// Steps 1 and 2 should show ✓ when on step 3
		const checkmarks = screen.getAllByText("✓");
		expect(checkmarks).toHaveLength(2);
	});

	it("applies active styling to the current step label", () => {
		render(<StepIndicator currentStep={2} totalSteps={3} labels={labels} />);
		const activeLabel = screen.getByText("Lugar");
		expect(activeLabel).toHaveClass("text-blue-600");
	});
});
