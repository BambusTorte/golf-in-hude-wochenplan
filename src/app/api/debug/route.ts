import { NextResponse } from "next/server";

// TEMPORÄR – Flakiness-Diagnose: GitHub-Fetch vs Neon-HTTP.
export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = { node: process.version };
  const url = process.env.DATABASE_URL ?? "";

  try {
    const t = Date.now();
    const r = await fetch("https://api.github.com/zen", {
      signal: AbortSignal.timeout(9000),
    });
    out.gh = { ok: r.ok, status: r.status, ms: Date.now() - t };
  } catch (e) {
    out.gh = { ok: false, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }

  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    const t = Date.now();
    const rows = await sql`select 1 as ok`;
    out.neon = { ok: true, rows, ms: Date.now() - t };
  } catch (e) {
    out.neon = { ok: false, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }

  return NextResponse.json(out, { status: 200 });
}
