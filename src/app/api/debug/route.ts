import { NextResponse } from "next/server";

// TEMPORÄR – Fehlersuche. Kein DB-Zugriff, nur Basisinfo.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    node: process.version,
    db_url_present: Boolean(process.env.DATABASE_URL),
    is_neon: /neon\.tech/i.test(process.env.DATABASE_URL ?? ""),
    storage: process.env.STORAGE_DRIVER,
  });
}
