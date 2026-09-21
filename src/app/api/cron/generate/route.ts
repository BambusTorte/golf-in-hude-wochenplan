import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getEnv } from "@/env";
import { getCurrentWeek, getIsoWeekForInstant } from "@/lib/week/isoWeek";
import { generateWeeklyPlan } from "@/lib/plan/generate";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Anzahl der im Voraus zu generierenden Wochen (aktuelle + n-1 folgende).
const WEEKS_AHEAD = 3;

function authorized(req: NextRequest): boolean {
  const env = getEnv();
  const provided =
    req.headers.get("x-cron-secret") ??
    req.nextUrl.searchParams.get("secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  const a = Buffer.from(provided);
  const b = Buffer.from(env.CRON_SECRET);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function run() {
  const now = new Date();
  const targets: { year: number; week: number }[] = [];
  for (let i = 0; i < WEEKS_AHEAD; i++) {
    const d = new Date(now.getTime() + i * 7 * 86400_000);
    const { year, week } = i === 0 ? getCurrentWeek(now) : getIsoWeekForInstant(d);
    if (!targets.some((t) => t.year === year && t.week === week)) {
      targets.push({ year, week });
    }
  }

  const results = [];
  for (const t of targets) {
    try {
      const res = await generateWeeklyPlan(t);
      results.push({ ...t, ok: true, imported: res.eventsImported, status: res.status });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.errorLog.create({
        data: { scope: "cron", message, meta: t },
      });
      results.push({ ...t, ok: false, error: message });
    }
  }
  return results;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const results = await run();
  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    note: "Alle Pläne werden als ENTWURF erstellt und niemals automatisch veröffentlicht.",
    results,
  });
}

// GET erlaubt einfache Trigger (z. B. externe Cron-Dienste), ebenfalls geschützt.
export async function GET(req: NextRequest) {
  return POST(req);
}
