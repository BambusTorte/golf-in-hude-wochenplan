import { NextResponse } from "next/server";

// TEMPORÄR – Fehlersuche: Neon HTTP vs WebSocket.
export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = { node: process.version };
  const url = process.env.DATABASE_URL ?? "";

  // A) Neon über HTTP (fetch-basiert).
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    const t = Date.now();
    const rows = await sql`select 1 as ok`;
    out.http = { ok: true, rows, ms: Date.now() - t };
  } catch (e) {
    out.http = { ok: false, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }

  // B) Neon über WebSocket-Pool (wie der Prisma-Adapter).
  try {
    const { Pool, neonConfig } = await import("@neondatabase/serverless");
    const ws = (await import("ws")).default;
    neonConfig.webSocketConstructor = ws as unknown as typeof WebSocket;
    const pool = new Pool({ connectionString: url });
    const t = Date.now();
    const res = await pool.query("select 1 as ok");
    out.ws = { ok: true, rows: res.rows, ms: Date.now() - t };
    await pool.end();
  } catch (e) {
    out.ws = { ok: false, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }

  return NextResponse.json(out, { status: 200 });
}
