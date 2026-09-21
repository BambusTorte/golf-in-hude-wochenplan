import { prisma } from "@/lib/db";

const WINDOW_MS = 15 * 60_000; // 15 Minuten
const MAX_FAILED = 5;

export interface RateLimitState {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Prüft, ob für einen Schlüssel (z. B. E-Mail oder IP) noch Loginversuche
 * erlaubt sind. Zählt fehlgeschlagene Versuche im Zeitfenster (DB-basiert,
 * serverless-tauglich).
 */
export async function checkLoginRateLimit(
  key: string,
): Promise<RateLimitState> {
  const since = new Date(Date.now() - WINDOW_MS);
  const failed = await prisma.loginAttempt.findMany({
    where: { key, success: false, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
  });
  if (failed.length < MAX_FAILED) {
    return { allowed: true, remaining: MAX_FAILED - failed.length, retryAfterSec: 0 };
  }
  const oldest = failed[0].createdAt.getTime();
  const retryAfterSec = Math.max(
    0,
    Math.ceil((oldest + WINDOW_MS - Date.now()) / 1000),
  );
  return { allowed: false, remaining: 0, retryAfterSec };
}

export async function recordLoginAttempt(
  key: string,
  success: boolean,
): Promise<void> {
  await prisma.loginAttempt.create({ data: { key, success } });
  // Bei Erfolg das Zeitfenster für diesen Schlüssel zurücksetzen.
  if (success) {
    await prisma.loginAttempt.deleteMany({
      where: { key, success: false },
    });
  }
}
