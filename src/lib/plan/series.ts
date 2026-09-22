import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getWeekDays } from "@/lib/week/isoWeek";

/**
 * Trägt alle aktiven Turnierserien in einen Wochenplan ein (je Serie ein Termin
 * am passenden Wochentag). Idempotent über den synthetischen externalId
 * `series:<id>`. Manuell bearbeitete Vorkommen (origin=EDITED) bleiben erhalten.
 * Gibt die Anzahl angewandter/aktualisierter Serien zurück.
 */
export async function applySeriesToWeek(
  planId: string,
  year: number,
  week: number,
): Promise<number> {
  const series = await prisma.series.findMany({
    where: { active: true },
    orderBy: [{ weekday: "asc" }, { sortOrder: "asc" }, { startTime: "asc" }],
  });
  if (series.length === 0) return 0;

  const days = getWeekDays(year, week); // Mo..So als UTC-Instants
  let applied = 0;

  for (const s of series) {
    if (s.weekday < 0 || s.weekday > 6) continue;
    const externalId = `series:${s.id}`;
    const existing = await prisma.planEvent.findUnique({
      where: { planId_externalId: { planId, externalId } },
    });
    // Manuell für diese Woche bearbeitete Termine nicht überschreiben.
    if (existing && existing.origin === "EDITED") continue;

    const data = {
      date: days[s.weekday],
      weekday: s.weekday,
      startTime: s.startTime ?? null,
      title: s.title,
      course: s.course ?? null,
      holes: s.holes ?? null,
      tee: s.tee ?? null,
      format: s.format ?? null,
      playType: s.playType ?? null,
      participantsEstimate: s.participantsEstimate ?? null,
      handicapRelevant: null,
      maxParticipants: null,
      freeOnline: null,
      source: "MANUAL" as const,
      origin: "IMPORTED" as const,
      seriesId: s.id,
      links: {} as Prisma.InputJsonValue,
      rawRef: { series: s.id } as Prisma.InputJsonValue,
      sortOrder: s.sortOrder,
    };

    await prisma.planEvent.upsert({
      where: { planId_externalId: { planId, externalId } },
      create: { planId, externalId, ...data },
      update: data,
    });
    applied++;
  }
  return applied;
}
