import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.E2E_PORT ? Number(process.env.E2E_PORT) : 3100;
const baseURL = `http://localhost:${PORT}`;

const E2E_DB =
  process.env.E2E_DATABASE_URL ??
  "postgresql://luca@localhost:5432/golf_in_hude_e2e";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  timeout: 60_000,
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // Nutzt den vorhandenen Produktions-Build (vorab `npm run build` ausführen).
    command: `npm run start -- --port ${PORT}`,
    url: baseURL,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: E2E_DB,
      ADMIN_SETUP_KEY: "e2e-setup-key-0123456789",
      SESSION_SECRET: "e2e-session-secret-0123456789",
      CRON_SECRET: "e2e-cron-secret",
      STORAGE_DRIVER: "local",
      LOCAL_STORAGE_DIR: "./storage-e2e",
      SESSION_COOKIE_SECURE: "0",
      NEXT_PUBLIC_SITE_URL: baseURL,
    },
  },
});
