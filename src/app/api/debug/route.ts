import { NextResponse } from "next/server";

// TEMPORÄR – Fehlersuche: testet ausgehende HTTP-Verbindung (nicht Neon).
export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = { node: process.version };

  // Neutraler ausgehender HTTPS-Request (kein Neon).
  try {
    const t = Date.now();
    const r = await fetch("https://api.github.com/zen", {
      signal: AbortSignal.timeout(8000),
    });
    out.plainFetch = { ok: true, status: r.status, ms: Date.now() - t };
  } catch (e) {
    out.plainFetch = {
      ok: false,
      error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    };
  }

  return NextResponse.json(out, { status: 200 });
}
