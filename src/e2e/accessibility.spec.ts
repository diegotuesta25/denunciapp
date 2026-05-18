import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility — Public Pages", () => {
	test("home page has no critical violations", async ({ page }) => {
		await page.goto("/");
		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa"])
			.analyze();
		expect(results.violations).toEqual([]);
	});

	test("complaint form page has no critical violations", async ({ page }) => {
		await page.goto("/denunciar");
		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa"])
			.analyze();
		expect(results.violations).toEqual([]);
	});

	test("tracking page has no critical violations", async ({ page }) => {
		await page.goto("/seguimiento");
		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa"])
			.analyze();
		expect(results.violations).toEqual([]);
	});
});

test.describe("Accessibility — Officer Pages", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/sign-in");
		await page.click('button:has-text("Ingresar como")');
		await expect(page).toHaveURL(/\/officer/, { timeout: 10_000 });
	});

	test("officer console has no critical violations", async ({ page }) => {
		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa"])
			.analyze();
		expect(results.violations).toEqual([]);
	});
});
