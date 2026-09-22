import { NextResponse } from "next/server";

// TEMPORÄR – nur Neon HTTP.
export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = { node: process.version };
  const url = process.env.DATABASE_URL ?? "";
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    const t = Date.now();
    const rows = await sql`select 1 as ok`;
    out.http = { ok: true, rows, ms: Date.now() - t };
  } catch (e) {
    out.http = {
      ok: false,
      error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      stack: e instanceof Error ? e.stack?.slice(0, 800) : undefined,
    };
  }
  return NextResponse.json(out, { status: 200 });
}
