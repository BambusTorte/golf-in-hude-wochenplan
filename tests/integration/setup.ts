// Wird vor Integrationstests geladen und richtet die Testdatenbank ein.
// Muss VOR dem Import des Prisma-Singletons laufen (setupFiles-Reihenfolge).
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://luca@localhost:5432/golf_in_hude_test";
process.env.ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY ?? "test-setup-key-1234";
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET ?? "test-session-secret-0123456789";
process.env.CRON_SECRET = process.env.CRON_SECRET ?? "test-cron-secret";
