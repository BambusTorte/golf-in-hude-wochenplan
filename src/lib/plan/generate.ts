import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  getWeekRange,
  weekdayIndex,
  formatWeekRange,
  isValidWeek,
} from "@/lib/week/isoWeek";
import {
  normalizeCourse,
  suggestPlayType,
  suggestParticipants,
} from "@/lib/week/mapping";
import { dedupeEvents, eventKey } from "@/lib/plan/dedupe";
import { validatePlan } from "@/lib/plan/validate";
import { PLAN_SUBTITLE_DEFAULT } from "@/lib/plan/labels";
import { fetchWeekWithFallback } from "@/lib/providers/registry";
import { ManualImportProvider } from "@/lib/providers/manual";
import type { RawGolfEvent } from "@/lib/providers/types";

export interface GenerateOptions {
  year: number;
  week: number;
  /** Optional: manuell erfasste Rohdaten statt automatischem Abruf. */
  manualEvents?: RawGolfEvent[];
}

export interface GenerateResult {
  planId: string;
  importRunId: string;
  eventsFound: number;
  eventsImported: number;
  warnings: string[];
  status: string;
}

/** Baut den Titel im Stil der gedruckten Vorlage. */
function buildTitle(year: number, week: number): string {
  return `Wochenplan ${formatWeekRange(getWeekRange(year, week))}`;
}

/**
 * Erzeugt/aktualisiert einen Wochenplan als ENTWURF (DRAFT).
 * - niemals automatische Veröffentlichung
 * - idempotent: mehrfacher Aufruf erzeugt keine Duplikate (Upsert per externalId)
 * - manuell bearbeitete Events (origin=EDITED) werden nicht überschrieben
 */
export async function generateWeeklyPlan(
  opts: GenerateOptions,
): Promise<GenerateResult> {
  const { year, week } = opts;
  if (!isValidWeek(year, week)) {
    throw new Error(`Ungültige Kalenderwoche: KW ${week}/${year}`);
  }

  const range = getWeekRange(year, week);
  const providerKey = opts.manualEvents ? "manual" : "pccaddie";

  const importRun = await prisma.importRun.create({
    data: { provider: providerKey, year, week, status: "RUNNING" },
  });

  try {
    // 1) Rohdaten holen
    const fetched = opts.manualEvents
      ? await new ManualImportProvider(opts.manualEvents).getEventsForWeek()
      : await fetchWeekWithFallback(year, week);
    const warnings = [...fetched.warnings];

    // 2) Duplikate entfernen, sortieren
    const deduped = dedupeEvents(fetched.events).sort((a, b) => {
      const d = a.date.getTime() - b.date.getTime();
      if (d !== 0) return d;
      return (a.startTime ?? "").localeCompare(b.startTime ?? "");
    });

    // 3) Plan upserten, Events upserten (sequenziell; der Neon-HTTP-Treiber
    //    unterstützt keine interaktiven Transaktionen).
    const result = await (async () => {
      const plan = await prisma.weeklyPlan.upsert({
        where: { year_isoWeek: { year, isoWeek: week } },
        create: {
          year,
          isoWeek: week,
          weekStart: range.start,
          weekEnd: range.end,
          status: "DRAFT",
          title: buildTitle(year, week),
          subtitle: PLAN_SUBTITLE_DEFAULT,
          sourceInfo: {
            provider: fetched.providerKey,
            fetchedAt: fetched.fetchedAt.toISOString(),
            usedFallback: "usedFallback" in fetched ? fetched.usedFallback : false,
          } as Prisma.JsonObject,
        },
        update: {
          sourceInfo: {
            provider: fetched.providerKey,
            fetchedAt: fetched.fetchedAt.toISOString(),
            usedFallback: "usedFallback" in fetched ? fetched.usedFallback : false,
          } as Prisma.JsonObject,
        },
      });

      let imported = 0;
      for (let i = 0; i < deduped.length; i++) {
        const e = deduped[i];
        const externalId = e.externalId ?? eventKey(e);
        const weekday = weekdayIndex(e.date);

        const existing = await prisma.planEvent.findUnique({
          where: { planId_externalId: { planId: plan.id, externalId } },
        });

        // Manuell bearbeitete Events nicht überschreiben.
        if (existing && existing.origin === "EDITED") continue;

        const data = {
          date: e.date,
          weekday,
          startTime: e.startTime ?? null,
          endTime: e.endTime ?? null,
          title: e.title,
          course: normalizeCourse(e.courseRaw) ?? null,
          holes: e.holes ?? null,
          tee: e.tee ?? null,
          format: e.format ?? null,
          handicapRelevant: e.handicapRelevant ?? null,
          maxParticipants: e.maxParticipants ?? null,
          freeOnline: e.freeOnline ?? null,
          participantsEstimate: suggestParticipants(
            e.maxParticipants,
            e.freeOnline,
          ) ?? null,
          playType: suggestPlayType(e.handicapRelevant) ?? null,
          links: (e.links ?? {}) as Prisma.JsonObject,
          source: e.source,
          origin: "IMPORTED" as const,
          rawRef: (e.raw ?? {}) as Prisma.JsonObject,
          sortOrder: i,
        };

        await prisma.planEvent.upsert({
          where: { planId_externalId: { planId: plan.id, externalId } },
          create: { planId: plan.id, externalId, ...data },
          update: data,
        });
        imported++;
      }

      // 4) Validierung über den aktuellen Planbestand
      const planEvents = await prisma.planEvent.findMany({
        where: { planId: plan.id },
      });
      const validation = validatePlan(planEvents);
      const allWarnings = [...warnings, ...validation.warnings];

      const updatedPlan = await prisma.weeklyPlan.update({
        where: { id: plan.id },
        data: { warnings: allWarnings as Prisma.JsonArray },
      });

      return {
        plan: updatedPlan,
        imported,
        found: fetched.events.length,
        warnings: allWarnings,
      };
    })();

    await prisma.importRun.update({
      where: { id: importRun.id },
      data: {
        status: "SUCCESS",
        eventsFound: result.found,
        eventsImported: result.imported,
        warnings: result.warnings as Prisma.JsonArray,
        planId: result.plan.id,
        finishedAt: new Date(),
        message: `KW ${week}/${year}: ${result.imported} Termine importiert.`,
      },
    });

    return {
      planId: result.plan.id,
      importRunId: importRun.id,
      eventsFound: result.found,
      eventsImported: result.imported,
      warnings: result.warnings,
      status: result.plan.status,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.importRun.update({
      where: { id: importRun.id },
      data: { status: "FAILED", message, finishedAt: new Date() },
    });
    await prisma.errorLog.create({
      data: {
        scope: "generate",
        message,
        meta: { year, week } as Prisma.JsonObject,
      },
    });
    throw err;
  }
}
