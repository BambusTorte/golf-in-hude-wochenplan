import { NextResponse } from "next/server";

// TEMPORÄR – Fehlersuche mit Abfangen unbehandelter Rejections/Exceptions.
export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = { node: process.version };
  const captured: string[] = [];
  const onErr = (e: unknown) =>
    captured.push(
      (e instanceof Error ? `${e.name}: ${e.message}\n${e.stack}` : String(e)).slice(
        0,
        1200,
      ),
    );
  process.on("unhandledRejection", onErr);
  process.on("uncaughtException", onErr);

  const url = process.env.DATABASE_URL ?? "";
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    const t = Date.now();
    const rows = await sql`select 1 as ok`;
    out.rawNeon = { ok: true, rows, ms: Date.now() - t };
  } catch (e) {
    out.rawNeon = {
      ok: false,
      error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      stack: e instanceof Error ? e.stack?.slice(0, 1000) : undefined,
    };
  }

  // kurz warten, damit hängende Rejections sichtbar werden
  await new Promise((r) => setTimeout(r, 300));
  process.off("unhandledRejection", onErr);
  process.off("uncaughtException", onErr);
  out.captured = captured;
  return NextResponse.json(out, { status: 200 });
}
