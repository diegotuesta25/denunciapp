import { test, expect } from "@playwright/test";

test.describe("Citizen Happy Path — Submit Complaint", () => {
	test("should submit a complaint and receive a tracking code", async ({
		page,
	}) => {
		await page.goto("/denunciar");

		await page.click(
			'a:has-text("Registrar denuncia"), button:has-text("Registrar denuncia")',
		);

		await page.selectOption("#type", "patrimonio");
		await page.fill("#incidentDate", "2026-05-10");
		await page.fill("#incidentTime", "14:30");
		await page.fill(
			"#narrative",
			"Me robaron el celular en el mercado central. El sujeto aprovechó el momento de distracción para sustraer el dispositivo de mi bolsillo trasero y escapar corriendo hacia la salida norte del mercado.",
		);
		await page.click('button:has-text("Continuar")');

		await expect(page.locator("#jurisdictionId")).not.toBeDisabled();
		await page.selectOption("#jurisdictionId", { index: 1 });
		await page.fill("#locationAddress", "Av. Abancay 123, frente al mercado");
		await page.click('button:has-text("Continuar")');

		await page.fill("#complainantName", "Juan Pérez García");
		await page.fill("#complainantDni", "12345678");
		await page.fill("#complainantEmail", "juan@example.com");
		await page.fill("#complainantPhone", "987654321");
		await page.click('button:has-text("Enviar denuncia")');

		await expect(
			page.locator('h2:has-text("Denuncia registrada")'),
		).toBeVisible({ timeout: 10_000 });

		const trackingCode = page.locator('[data-testid="tracking-code"]');
		await expect(trackingCode).toBeVisible();
		const code = await trackingCode.textContent();
		expect(code?.trim()).toMatch(/^DEN-[A-Z0-9]{7}$/);
	});
});
