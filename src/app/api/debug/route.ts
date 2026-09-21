import { NextResponse } from "next/server";

// TEMPORÄR – nur zur Fehlersuche auf Netlify. Wird danach wieder entfernt.
export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = {};
  try {
    out.db_url_present = Boolean(process.env.DATABASE_URL);
    out.db_url_len = (process.env.DATABASE_URL || "").length;
    const { prisma } = await import("@/lib/db");
    const start = Date.now();
    const count = await prisma.weeklyPlan.count();
    out.ok = true;
    out.count = count;
    out.ms = Date.now() - start;
  } catch (e) {
    out.ok = false;
    out.error = e instanceof Error ? e.message : String(e);
    out.name = e instanceof Error ? e.name : undefined;
    out.stack = e instanceof Error ? e.stack?.slice(0, 1500) : undefined;
  }
  return NextResponse.json(out, { status: 200 });
}
