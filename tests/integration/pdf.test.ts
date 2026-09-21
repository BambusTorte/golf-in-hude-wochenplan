import { describe, it, expect, afterAll } from "vitest";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { PlanEvent } from "@prisma/client";
import { WochenplanDocument } from "@/lib/pdf/WochenplanDocument";
import { buildPdfData } from "@/lib/pdf/data";
import { renderAndStorePdf } from "@/lib/pdf/render";
import { generateWeeklyPlan } from "@/lib/plan/generate";
import { getStorage } from "@/lib/storage";
import { prisma } from "@/lib/db";
import { berlinDayInstant } from "@/lib/week/isoWeek";
import type { RawGolfEvent } from "@/lib/providers/types";

function ev(over: Partial<PlanEvent>): PlanEvent {
  return {
    id: Math.random().toString(36).slice(2),
    planId: "p",
    externalId: null,
    date: berlinDayInstant(2026, 9, 30),
    weekday: 2,
    startTime: "15:00",
    endTime: null,
    title: "Herrengolf",
    course: "Nordseeplatz",
    holes: 18,
    tee: "1",
    format: "Einzel - Stableford",
    handicapRelevant: true,
    maxParticipants: 48,
    freeOnline: 18,
    participantsEstimate: "ca. 30",
    playType: "CLUB_VW",
    links: {},
    source: "PCCADDIE_HTML",
    origin: "IMPORTED",
    rawRef: {},
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as PlanEvent;
}

async function renderPdf(events: PlanEvent[]) {
  const data = buildPdfData(
    { title: "Wochenplan 28.09.2026 - 04.10.2026", subtitle: "18-Loch Nordseeplatz + 9 Loch Weserplatz" },
    events,
  );
  const element = React.createElement(WochenplanDocument, {
    data,
  }) as Parameters<typeof renderToBuffer>[0];
  return renderToBuffer(element);
}

function isPdf(buf: Buffer): boolean {
  return buf.length > 800 && buf.subarray(0, 5).toString() === "%PDF-";
}

describe("Wochenplan-PDF Rendering", () => {
  it("leere Woche", async () => {
    expect(isPdf(await renderPdf([]))).toBe(true);
  });

  it("wenige Termine", async () => {
    expect(isPdf(await renderPdf([ev({}), ev({ weekday: 4, title: "Afterwork Finale" })]))).toBe(true);
  });

  it("viele Termine, lange Titel, mehrere pro Tag", async () => {
    const events: PlanEvent[] = [];
    for (let d = 0; d < 7; d++) {
      for (let k = 0; k < 3; k++) {
        events.push(
          ev({
            weekday: d,
            title: `Sehr langer Turniertitel mit Sponsor und Zusatz ${d}-${k} "Wer schlägt Johann (Brutto)!!!"`,
            startTime: `${8 + k}:00`,
          }),
        );
      }
    }
    const buf = await renderPdf(events);
    expect(isPdf(buf)).toBe(true);
  });

  it("mehrtägige/gemischte Plätze", async () => {
    const buf = await renderPdf([
      ev({ weekday: 5, course: "Weserplatz", holes: 9, tee: "Kanonenstart", title: "Monatscup + Matchplay Finale" }),
      ev({ weekday: 6, participantsEstimate: null, playType: null }),
    ]);
    expect(isPdf(buf)).toBe(true);
  });
});

describe("renderAndStorePdf (DB + Storage)", () => {
  afterAll(async () => {
    const files = await prisma.pdfFile.findMany();
    for (const f of files) await getStorage().delete(f.storageKey).catch(() => {});
    await prisma.planEvent.deleteMany();
    await prisma.pdfFile.deleteMany();
    await prisma.importRun.deleteMany();
    await prisma.weeklyPlan.deleteMany();
    await prisma.$disconnect();
  });

  it("rendert, speichert und ist wieder abrufbar", async () => {
    const manual: RawGolfEvent[] = [
      {
        externalId: "pdf-1",
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
    ];
    const gen = await generateWeeklyPlan({ year: 2026, week: 40, manualEvents: manual });
    const res = await renderAndStorePdf(gen.planId);
    expect(res.byteSize).toBeGreaterThan(800);

    const stored = await getStorage().get(res.storageKey);
    expect(stored).not.toBeNull();
    expect(isPdf(stored!.data)).toBe(true);

    // Erneutes Rendern ersetzt die PDF (nur eine aktuelle pro Plan).
    await renderAndStorePdf(gen.planId);
    const count = await prisma.pdfFile.count({ where: { planId: gen.planId } });
    expect(count).toBe(1);
  });
});
