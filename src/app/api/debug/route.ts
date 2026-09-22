import { NextResponse } from "next/server";

// TEMPORÄR – Prisma-Query über HTTP testen.
export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = { node: process.version };
  try {
    const { prisma } = await import("@/lib/db");
    const t = Date.now();
    const count = await prisma.weeklyPlan.count();
    out.prismaCount = { ok: true, count, ms: Date.now() - t };
  } catch (e) {
    out.prismaCount = {
      ok: false,
      error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      stack: e instanceof Error ? e.stack?.slice(0, 800) : undefined,
    };
  }
  return NextResponse.json(out, { status: 200 });
}
