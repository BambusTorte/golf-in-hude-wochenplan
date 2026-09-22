import { NextResponse } from "next/server";

// TEMPORÄR – nur zur Fehlersuche auf Netlify. Wird danach entfernt.
export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = {};
  const url = process.env.DATABASE_URL ?? "";
  out.db_url_present = Boolean(url);
  out.is_neon = /neon\.tech/i.test(url);

  // 1) Rohe Neon-Abfrage über HTTP (fetch) – ohne Prisma, ohne native Engine.
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    const t = Date.now();
    const rows = await sql`select 1 as ok`;
    out.rawNeon = { ok: true, rows, ms: Date.now() - t };
  } catch (e) {
    out.rawNeon = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      name: e instanceof Error ? e.name : undefined,
    };
  }

  // 2) Prisma-Abfrage (nutzt Adapter/Engine).
  try {
    const { prisma } = await import("@/lib/db");
    const t = Date.now();
    const count = await prisma.weeklyPlan.count();
    out.prisma = { ok: true, count, ms: Date.now() - t };
  } catch (e) {
    out.prisma = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      name: e instanceof Error ? e.name : undefined,
    };
  }

  return NextResponse.json(out, { status: 200 });
}
