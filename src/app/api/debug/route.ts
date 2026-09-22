import { NextResponse } from "next/server";

// TEMPORÄR – WebSocket-Fehler einfangen.
export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = { node: process.version };
  const url = process.env.DATABASE_URL ?? "";
  const captured: string[] = [];
  const onErr = (e: unknown) =>
    captured.push((e instanceof Error ? `${e.name}: ${e.message}` : String(e)).slice(0, 400));
  process.on("unhandledRejection", onErr);
  process.on("uncaughtException", onErr);

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

  await new Promise((r) => setTimeout(r, 500));
  process.off("unhandledRejection", onErr);
  process.off("uncaughtException", onErr);
  out.captured = captured;
  return NextResponse.json(out, { status: 200 });
}
