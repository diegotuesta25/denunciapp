import { test, expect } from "@playwright/test";

test.describe("Officer Flow", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/sign-in");
		await page.click('button:has-text("Ingresar como")');
		await expect(page).toHaveURL(/\/officer/, { timeout: 10_000 });
	});

	test("should show the officer console with complaint list", async ({
		page,
	}) => {
		await expect(
			page.locator('h1:has-text("Consola del Oficial")'),
		).toBeVisible();

		const rows = page.locator("tbody tr");
		await expect(rows.first()).toBeVisible();

		const firstCode = page.locator("tbody tr:first-child td:first-child");
		await expect(firstCode).toHaveText(/DEN-/);
	});

	test("should navigate to complaint detail page", async ({ page }) => {
		await page.locator('a:has-text("Ver →")').first().click();

		await expect(page).toHaveURL(/\/officer\/.+/, { timeout: 8_000 });

		await expect(page.locator("h1, h2").first()).toBeVisible();
	});

	test("should add a note to a complaint", async ({ page }) => {
		await page.locator('a:has-text("Ver →")').first().click();
		await expect(page).toHaveURL(/\/officer\/.+/, { timeout: 8_000 });

		await page.click('button:has-text("Agregar nota")');

		const noteTextarea = page.locator('textarea[placeholder*="Se contactó"]');
		await expect(noteTextarea).toBeVisible();
		await noteTextarea.fill(
			"Nota de prueba E2E — caso revisado por el oficial.",
		);

		await page.click('button:has-text("Guardar nota")');

		await expect(page.locator('button:has-text("Agregar nota")')).toBeVisible({
			timeout: 8_000,
		});
	});

	test("should update the status of a complaint", async ({ page }) => {
		await page.locator('a:has-text("Ver →")').first().click();
		await expect(page).toHaveURL(/\/officer\/.+/, { timeout: 8_000 });

		await page.click('button:has-text("Actualizar estado")');

		const firstRadio = page.locator('input[name="newStatus"]').first();
		await expect(firstRadio).toBeVisible();
		await firstRadio.click();

		const reasonTextarea = page.locator('textarea[placeholder*="Se asigna"]');
		await reasonTextarea.fill("Cambio de estado en prueba E2E.");

		await page.click('button:has-text("Confirmar cambio")');

		await expect(
			page
				.locator('button:has-text("Actualizar estado")')
				.or(page.locator("text=estado final")),
		).toBeVisible({ timeout: 8_000 });
	});
});
