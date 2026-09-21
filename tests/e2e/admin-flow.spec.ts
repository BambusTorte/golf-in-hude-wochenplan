import { test, expect, type Page } from "@playwright/test";

const EMAIL = "chef@golfinhude.de";
const PASSWORD = "GolfHude2026!";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await page.waitForURL(/\/admin\/dashboard/);
}

// Auth (Szenarien 6, 7)
test("falsche Zugangsdaten werden abgewiesen", async ({ page }) => {
  await page.goto("/admin/login");
  await page.fill("#email", EMAIL);
  await page.fill("#password", "falschesPasswort");
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await expect(page.getByText(/ist falsch/i)).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("die Ersteinrichtung ist nach Abschluss gesperrt", async ({ page }) => {
  await page.goto("/admin/setup");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("Administrator meldet sich erfolgreich an und sieht den Entwurf", async ({
  page,
}) => {
  await login(page);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  // Entwurf ist gelistet
  await page.goto("/admin/plans");
  await expect(page.getByText("KW 40/2026").or(page.getByText(/28\.09\.2026/))).toBeVisible();
});

// Voller Veröffentlichungs-Lebenszyklus (Szenarien 8–14)
test("veröffentlichen → öffentlich sichtbar → PDF → zurücknehmen → verborgen", async ({
  page,
}) => {
  await login(page);

  // Entwurf öffnen
  await page.goto("/admin/plans");
  await page.getByText(/28\.09\.2026/).first().click();
  await expect(page.getByText("Entwurf")).toBeVisible();

  // Termin bearbeiten: TN setzen (Szenario 10)
  await page.getByRole("button", { name: "Bearbeiten" }).first().click();
  await page.fill("#participantsEstimate", "ca. 25");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByText("Veröffentlicht").or(page.getByText("Entwurf"))).toBeVisible();

  // Veröffentlichen mit Bestätigungsdialog (Szenario 11)
  await page.getByRole("button", { name: "Veröffentlichen" }).click();
  await page.getByRole("button", { name: "Jetzt veröffentlichen" }).click();
  await expect(page.getByText("Veröffentlicht")).toBeVisible();

  // Öffentlich sichtbar (Szenario 12)
  await page.goto("/plan/2026/40");
  await expect(page.getByRole("heading", { name: /Wochenplan/ })).toBeVisible();
  // Titel erscheint in Tabelle (Desktop) und Karte (Mobil) – Sichtbarkeit je
  // Viewport unterschiedlich, daher inhaltsbasiert prüfen.
  await expect(page.locator("main")).toContainText("Herrengolf");

  // PDF abrufbar (Szenario 4)
  const pdfHref = await page
    .getByRole("link", { name: "PDF öffnen" })
    .getAttribute("href");
  expect(pdfHref).toContain("/api/pdf/");
  const pdf = await page.request.get(pdfHref!);
  expect(pdf.ok()).toBeTruthy();
  expect(pdf.headers()["content-type"]).toContain("pdf");

  // Zurücknehmen (Szenario 13)
  await page.goto("/admin/plans");
  await page.getByText(/28\.09\.2026/).first().click();
  await page.getByRole("button", { name: "Veröffentlichung zurücknehmen" }).click();
  await page.getByRole("button", { name: "Zurücknehmen", exact: true }).click();
  await expect(page.getByText("Zur Prüfung")).toBeVisible();

  // Öffentlich nicht mehr sichtbar (Szenario 14)
  const res = await page.request.get("/plan/2026/40");
  expect(res.status()).toBe(404);

  // Aufräumen: zurück in den Entwurf für stabile Wiederholbarkeit
  await page.getByRole("button", { name: "Zurück zu Entwurf" }).click();
});
