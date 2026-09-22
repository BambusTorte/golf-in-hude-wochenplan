import { timingSafeEqual } from "node:crypto";
import type { Admin } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getEnv } from "@/env";
import { hashPassword } from "./password";

/** Zeitkonstanter String-Vergleich (verhindert Timing-Angriffe auf den Key). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Ist die Ersteinrichtung abgeschlossen? True, sobald ein Admin existiert
 * ODER der Setup-Status als abgeschlossen markiert wurde.
 */
export async function isSetupCompleted(): Promise<boolean> {
  const [state, adminCount] = await Promise.all([
    prisma.setupState.findUnique({ where: { id: 1 } }),
    prisma.admin.count(),
  ]);
  return Boolean(state?.completed) || adminCount > 0;
}

export class SetupError extends Error {}

/**
 * Legt den ersten (einzigen) Administrator an – nur mit gültigem Setup-Key und
 * nur solange die Einrichtung nicht abgeschlossen ist. Danach wird die
 * Einrichtung dauerhaft gesperrt.
 */
export async function completeSetup(input: {
  email: string;
  password: string;
  setupKey: string;
}): Promise<Admin> {
  const env = getEnv();
  if (!safeEqual(input.setupKey, env.ADMIN_SETUP_KEY)) {
    throw new SetupError("Ungültiger Einrichtungsschlüssel.");
  }
  if (await isSetupCompleted()) {
    throw new SetupError("Die Ersteinrichtung wurde bereits abgeschlossen.");
  }

  const email = input.email.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);

  // Sequenziell statt Transaktion (Neon-HTTP-Treiber ohne interaktive Tx).
  if ((await prisma.admin.count()) > 0) {
    throw new SetupError("Es existiert bereits ein Administrator.");
  }
  const admin = await prisma.admin.create({ data: { email, passwordHash } });
  await prisma.setupState.upsert({
    where: { id: 1 },
    create: { id: 1, completed: true, completedAt: new Date() },
    update: { completed: true, completedAt: new Date() },
  });
  return admin;
}
