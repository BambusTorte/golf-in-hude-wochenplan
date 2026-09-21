import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { generateWeeklyPlan } from "@/lib/plan/generate";
import type { RawGolfEvent } from "@/lib/providers/types";
import { berlinDayInstant } from "@/lib/week/isoWeek";

const YEAR = 2026;
const WEEK = 40; // 28.09 – 04.10.2026

function manualEvents(): RawGolfEvent[] {
  return [
    {
      externalId: "3300400",
      date: berlinDayInstant(2026, 9, 30),
      startTime: "15:00",
      title: "Herrengolf",
      courseRaw: "1-18 Nordsee",
      holes: 18,
      handicapRelevant: true,
      maxParticipants: 48,
      freeOnline: 18,
      source: "PCCADDIE_HTML",
    },
    {
      externalId: "3300401",
      date: berlinDayInstant(2026, 10, 4),
      startTime: "10:00",
      title: "Monatscup Oktober",
      courseRaw: "1-18 Nordsee",
      holes: 18,
      handicapRelevant: true,
      maxParticipants: 72,
      freeOnline: 60,
      source: "PCCADDIE_HTML",
    },
  ];
}

async function cleanDb() {
  await prisma.planEvent.deleteMany();
  await prisma.importRun.deleteMany();
  await prisma.pdfFile.deleteMany();
  await prisma.changeLog.deleteMany();
  await prisma.publishEvent.deleteMany();
  await prisma.weeklyPlan.deleteMany();
  await prisma.errorLog.deleteMany();
}

describe("generateWeeklyPlan", () => {
  beforeEach(cleanDb);
  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it("erzeugt einen Wochenplan als DRAFT mit gemappten Events", async () => {
    const res = await generateWeeklyPlan({ year: YEAR, week: WEEK, manualEvents: manualEvents() });
    expect(res.status).toBe("DRAFT");
    expect(res.eventsImported).toBe(2);

    const plan = await prisma.weeklyPlan.findUnique({
      where: { year_isoWeek: { year: YEAR, isoWeek: WEEK } },
      include: { events: true },
    });
    expect(plan).not.toBeNull();
    expect(plan!.status).toBe("DRAFT");
    expect(plan!.title).toBe("Wochenplan 28.09.2026 - 04.10.2026");
    expect(plan!.events).toHaveLength(2);

    const hg = plan!.events.find((e) => e.title === "Herrengolf")!;
    expect(hg.course).toBe("Nordseeplatz");
    expect(hg.playType).toBe("CLUB_VW");
    expect(hg.participantsEstimate).toBe("ca. 30"); // 48 - 18
    expect(hg.weekday).toBe(2); // Mittwoch
  });

  it("ist idempotent – mehrfacher Import erzeugt keine Duplikate", async () => {
    await generateWeeklyPlan({ year: YEAR, week: WEEK, manualEvents: manualEvents() });
    await generateWeeklyPlan({ year: YEAR, week: WEEK, manualEvents: manualEvents() });
    await generateWeeklyPlan({ year: YEAR, week: WEEK, manualEvents: manualEvents() });

    const count = await prisma.planEvent.count();
    expect(count).toBe(2);
    const plans = await prisma.weeklyPlan.count();
    expect(plans).toBe(1);
  });

  it("überschreibt manuell bearbeitete Events nicht", async () => {
    await generateWeeklyPlan({ year: YEAR, week: WEEK, manualEvents: manualEvents() });
    const plan = await prisma.weeklyPlan.findUniqueOrThrow({
      where: { year_isoWeek: { year: YEAR, isoWeek: WEEK } },
    });
    // Admin bearbeitet ein Event
    await prisma.planEvent.updateMany({
      where: { planId: plan.id, externalId: "3300400" },
      data: { title: "Herrengolf (verschoben)", startTime: "16:00", origin: "EDITED" },
    });

    // Erneuter Import darf die Bearbeitung nicht überschreiben
    await generateWeeklyPlan({ year: YEAR, week: WEEK, manualEvents: manualEvents() });
    const edited = await prisma.planEvent.findFirst({
      where: { planId: plan.id, externalId: "3300400" },
    });
    expect(edited!.title).toBe("Herrengolf (verschoben)");
    expect(edited!.startTime).toBe("16:00");
  });

  it("protokolliert den Importlauf als SUCCESS", async () => {
    await generateWeeklyPlan({ year: YEAR, week: WEEK, manualEvents: manualEvents() });
    const run = await prisma.importRun.findFirst({ orderBy: { startedAt: "desc" } });
    expect(run!.status).toBe("SUCCESS");
    expect(run!.eventsImported).toBe(2);
  });
});
