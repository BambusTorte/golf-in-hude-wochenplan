import { execSync } from "node:child_process";

/**
 * Bereitet die E2E-Datenbank vor: legt sie an, migriert, leert alle Tabellen
 * und seedet einen Admin sowie einen ENTWURF-Plan (deterministisch, ohne Netz).
 */
export const E2E_DB =
  process.env.E2E_DATABASE_URL ??
  "postgresql://luca@localhost:5432/golf_in_hude_e2e";
export const E2E_ADMIN_EMAIL = "chef@golfinhude.de";
export const E2E_ADMIN_PASSWORD = "GolfHude2026!";
export const E2E_SETUP_KEY = "e2e-setup-key-0123456789";

async function globalSetup() {
  process.env.DATABASE_URL = E2E_DB;
  process.env.ADMIN_SETUP_KEY = E2E_SETUP_KEY;
  process.env.SESSION_SECRET = "e2e-session-secret-0123456789";
  process.env.CRON_SECRET = "e2e-cron-secret";
  process.env.STORAGE_DRIVER = "local";
  process.env.LOCAL_STORAGE_DIR = "./storage-e2e";

  // Datenbank sicherstellen + migrieren.
  try {
    execSync("createdb -h localhost golf_in_hude_e2e", { stdio: "ignore" });
  } catch {
    // existiert bereits
  }
  execSync("npx prisma migrate deploy", {
    stdio: "ignore",
    env: { ...process.env, DATABASE_URL: E2E_DB },
  });

  const { prisma } = await import("@/lib/db");
  const { completeSetup } = await import("@/lib/auth/setup");
  const { generateWeeklyPlan } = await import("@/lib/plan/generate");
  const { berlinDayInstant } = await import("@/lib/week/isoWeek");

  // Alles leeren.
  await prisma.$transaction([
    prisma.planEvent.deleteMany(),
    prisma.pdfFile.deleteMany(),
    prisma.changeLog.deleteMany(),
    prisma.publishEvent.deleteMany(),
    prisma.importRun.deleteMany(),
    prisma.errorLog.deleteMany(),
    prisma.weeklyPlan.deleteMany(),
    prisma.session.deleteMany(),
    prisma.loginAttempt.deleteMany(),
    prisma.admin.deleteMany(),
    prisma.setupState.deleteMany(),
  ]);

  await completeSetup({
    email: E2E_ADMIN_EMAIL,
    password: E2E_ADMIN_PASSWORD,
    setupKey: E2E_SETUP_KEY,
  });

  // Ein ENTWURF-Plan für KW40/2026 (deterministisch, ohne Netzwerk).
  await generateWeeklyPlan({
    year: 2026,
    week: 40,
    manualEvents: [
      {
        externalId: "e2e-1",
        date: berlinDayInstant(2026, 9, 30),
        startTime: "15:00",
        title: "Herrengolf",
        courseRaw: "1-18 Nordsee",
        holes: 18,
        handicapRelevant: true,
        maxParticipants: 48,
        freeOnline: 18,
        source: "PCCADDIE_HTML",
      },
      {
        externalId: "e2e-2",
        date: berlinDayInstant(2026, 10, 4),
        startTime: "10:00",
        title: "Monatscup Oktober",
        courseRaw: "1-18 Nordsee",
        holes: 18,
        handicapRelevant: true,
        maxParticipants: 72,
        freeOnline: 60,
        source: "PCCADDIE_HTML",
      },
    ],
  });

  await prisma.$disconnect();
}

export default globalSetup;
