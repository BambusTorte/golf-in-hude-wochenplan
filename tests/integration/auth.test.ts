import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { completeSetup, isSetupCompleted, SetupError } from "@/lib/auth/setup";
import { checkLoginRateLimit, recordLoginAttempt } from "@/lib/auth/rateLimit";

const SETUP_KEY = process.env.ADMIN_SETUP_KEY!;

async function clean() {
  await prisma.session.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.setupState.deleteMany();
}

describe("password hashing (Argon2id)", () => {
  it("verifiziert korrekt und lehnt falsche Passwörter ab", async () => {
    const hash = await hashPassword("Sicher123!");
    expect(hash).not.toContain("Sicher123!");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(hash, "Sicher123!")).toBe(true);
    expect(await verifyPassword(hash, "falsch")).toBe(false);
  });
});

describe("Ersteinrichtung", () => {
  beforeEach(clean);
  afterAll(async () => {
    await clean();
    await prisma.$disconnect();
  });

  it("legt den ersten Admin mit gültigem Key an und sperrt danach", async () => {
    expect(await isSetupCompleted()).toBe(false);
    const admin = await completeSetup({
      email: "Chef@Golfinhude.de",
      password: "Sicher123!",
      setupKey: SETUP_KEY,
    });
    expect(admin.email).toBe("chef@golfinhude.de"); // normalisiert
    expect(await isSetupCompleted()).toBe(true);

    await expect(
      completeSetup({ email: "x@y.de", password: "abcdefgh", setupKey: SETUP_KEY }),
    ).rejects.toBeInstanceOf(SetupError);
  });

  it("lehnt einen falschen Setup-Key ab", async () => {
    await expect(
      completeSetup({ email: "a@b.de", password: "abcdefgh", setupKey: "falsch" }),
    ).rejects.toBeInstanceOf(SetupError);
    expect(await prisma.admin.count()).toBe(0);
  });
});

describe("Login-Rate-Limit", () => {
  beforeEach(clean);

  it("blockiert nach zu vielen Fehlversuchen und setzt bei Erfolg zurück", async () => {
    const key = "email:test@golfinhude.de";
    for (let i = 0; i < 5; i++) await recordLoginAttempt(key, false);
    const blocked = await checkLoginRateLimit(key);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);

    await recordLoginAttempt(key, true);
    const after = await checkLoginRateLimit(key);
    expect(after.allowed).toBe(true);
  });
});
