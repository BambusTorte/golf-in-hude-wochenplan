import { test, expect } from "@playwright/test";

// Öffentlicher Bereich & Zugriffsschutz (Szenarien 1–5, 17).

test("Besucher öffnet die Website ohne Login", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Alle Wochen/i })).toBeVisible();
});

test("ohne veröffentlichten Plan erscheint ein Leerzustand", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByText(/kein Wochenplan veröffentlicht/i),
  ).toBeVisible();
});

test("Entwürfe sind öffentlich nicht sichtbar (404)", async ({ page }) => {
  const res = await page.goto("/plan/2026/40");
  expect(res?.status()).toBe(404);
  await expect(page.getByText(/nicht gefunden/i)).toBeVisible();
});

test("Besucher kann keine Adminseite nutzen (Redirect zum Login)", async ({
  page,
}) => {
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("die öffentliche Seite funktioniert auf mobilen Bildschirmen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.getByText(/Golf\. In Hude!/i)).toBeVisible();
});
