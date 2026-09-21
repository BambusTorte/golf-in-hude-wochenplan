import { redirect } from "next/navigation";
import type { Admin } from "@prisma/client";
import { getSessionAdmin } from "./session";

/** Aktuellen Admin holen (oder null). */
export async function getCurrentAdmin(): Promise<Admin | null> {
  return getSessionAdmin();
}

/**
 * Erzwingt eine Admin-Session. Ohne gültige Session wird serverseitig auf die
 * Login-Seite umgeleitet. Für Server Components und Route Handler.
 */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getSessionAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** Wie requireAdmin, aber ohne Redirect – für API-Routen (401 selbst setzen). */
export async function requireAdminApi(): Promise<Admin | null> {
  return getSessionAdmin();
}
