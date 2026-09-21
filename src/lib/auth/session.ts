import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import type { Admin } from "@prisma/client";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "gih_session";
const SESSION_TTL_DAYS = 14;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Secure-Cookies in Produktion. Über SESSION_COOKIE_SECURE=0 kann dies für
 * lokale E2E-Tests (HTTP) deaktiviert werden – niemals in der echten Produktion.
 */
function secureCookieEnabled(): boolean {
  if (process.env.SESSION_COOKIE_SECURE === "0") return false;
  if (process.env.SESSION_COOKIE_SECURE === "1") return true;
  return process.env.NODE_ENV === "production";
}

/** Erstellt eine serverseitige Session und setzt ein sicheres Cookie. */
export async function createSession(
  adminId: string,
  meta?: { userAgent?: string; ip?: string },
): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400_000);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      adminId,
      expiresAt,
      userAgent: meta?.userAgent?.slice(0, 300),
      ip: meta?.ip,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: secureCookieEnabled(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Liest die aktuelle Session (oder null) und säubert abgelaufene Sessions. */
export async function getSessionAdmin(): Promise<Admin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.admin;
}

/** Meldet ab: löscht Session in DB und entfernt das Cookie. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE);
}
