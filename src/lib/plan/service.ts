import type { Prisma, PlanStatus, PlayType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertTransition } from "./status";
import { validatePlan } from "./validate";
import { getWeekRange, weekdayIndex, isValidWeek } from "@/lib/week/isoWeek";


/** Aktuelle PDF-Datei eines Plans (jüngste). */
export async function getCurrentPdf(planId: string) {
  return prisma.pdfFile.findFirst({
    where: { planId },
    orderBy: { createdAt: "desc" },
  });
}

async function refreshWarnings(planId: string): Promise<string[]> {
  const events = await prisma.planEvent.findMany({ where: { planId } });
  const plan = await prisma.weeklyPlan.findUniqueOrThrow({ where: { id: planId } });
  const existing = Array.isArray(plan.warnings) ? plan.warnings : [];
  // Nur die validierungsbasierten Warnungen neu berechnen; Provider-Warnungen
  // (aus sourceInfo) bleiben in der Historie erhalten.
  const { warnings } = validatePlan(events);
  await prisma.weeklyPlan.update({
    where: { id: planId },
    data: { warnings: warnings as Prisma.JsonArray },
  });
  return warnings.length ? warnings : (existing as string[]);
}

/** Setzt einen Status mit Prüfung des erlaubten Übergangs. */
export async function setStatus(
  planId: string,
  to: PlanStatus,
  adminId: string,
): Promise<void> {
  const plan = await prisma.weeklyPlan.findUniqueOrThrow({ where: { id: planId } });
  assertTransition(plan.status, to);
  await prisma.weeklyPlan.update({ where: { id: planId }, data: { status: to } });
  await prisma.changeLog.create({
    data: { planId, adminId, action: `status:${plan.status}->${to}` },
  });
}

/**
 * Veröffentlicht einen Plan bewusst. Erlaubt aus DRAFT oder REVIEW.
 * Rendert bei Bedarf die PDF und protokolliert das Veröffentlichungsereignis.
 */
export async function publishPlan(
  planId: string,
  adminId: string,
): Promise<void> {
  const plan = await prisma.weeklyPlan.findUniqueOrThrow({ where: { id: planId } });
  if (plan.status !== "DRAFT" && plan.status !== "REVIEW") {
    throw new Error("Nur Entwürfe oder geprüfte Pläne können veröffentlicht werden.");
  }
  await refreshWarnings(planId);

  // Kein Vor-Rendern nötig: Die PDF wird bei jedem Abruf zustandslos frisch
  // erzeugt (siehe /api/pdf). Das ist plattformunabhängig serverless-tauglich.

  await prisma.weeklyPlan.update({
    where: { id: planId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
  await prisma.publishEvent.create({ data: { planId, adminId, type: "PUBLISH" } });
  await prisma.changeLog.create({
    data: { planId, adminId, action: `publish:${plan.status}->PUBLISHED` },
  });
}

/** Nimmt eine Veröffentlichung zurück (zurück nach REVIEW). */
export async function unpublishPlan(
  planId: string,
  adminId: string,
): Promise<void> {
  const plan = await prisma.weeklyPlan.findUniqueOrThrow({ where: { id: planId } });
  if (plan.status !== "PUBLISHED") {
    throw new Error("Nur veröffentlichte Pläne können zurückgenommen werden.");
  }
  await prisma.weeklyPlan.update({
    where: { id: planId },
    data: { status: "REVIEW", publishedAt: null },
  });
  await prisma.publishEvent.create({ data: { planId, adminId, type: "UNPUBLISH" } });
  await prisma.changeLog.create({
    data: { planId, adminId, action: "unpublish:PUBLISHED->REVIEW" },
  });
}

export async function deletePlan(planId: string): Promise<void> {
  const pdfs = await prisma.pdfFile.findMany({ where: { planId } });
  await prisma.weeklyPlan.delete({ where: { id: planId } });
  // Blobs best-effort entfernen.
  const { getStorage } = await import("@/lib/storage");
  for (const p of pdfs) await getStorage().delete(p.storageKey).catch(() => {});
}

// --- Event-CRUD --------------------------------------------------------------

export interface EventInput {
  date: Date;
  startTime?: string | null;
  endTime?: string | null;
  title: string;
  course?: string | null;
  holes?: number | null;
  tee?: string | null;
  participantsEstimate?: string | null;
  playType?: PlayType | null;
  format?: string | null;
}

export async function addEvent(planId: string, input: EventInput, adminId: string) {
  const event = await prisma.planEvent.create({
    data: {
      planId,
      weekday: weekdayIndex(input.date),
      origin: "EDITED",
      source: "MANUAL",
      ...normalizeInput(input),
    },
  });
  await prisma.changeLog.create({
    data: { planId, adminId, action: "event:add", after: toJson(input) },
  });
  await refreshWarnings(planId);
  return event;
}

export async function updateEvent(
  eventId: string,
  input: EventInput,
  adminId: string,
) {
  const before = await prisma.planEvent.findUniqueOrThrow({ where: { id: eventId } });
  const event = await prisma.planEvent.update({
    where: { id: eventId },
    data: {
      weekday: weekdayIndex(input.date),
      origin: "EDITED", // markiert manuelle Bearbeitung -> Import überschreibt nicht
      ...normalizeInput(input),
    },
  });
  await prisma.changeLog.create({
    data: {
      planId: before.planId,
      adminId,
      action: "event:update",
      after: toJson(input),
    },
  });
  await refreshWarnings(before.planId);
  return event;
}

export async function deleteEvent(eventId: string, adminId: string) {
  const before = await prisma.planEvent.findUniqueOrThrow({ where: { id: eventId } });
  await prisma.planEvent.delete({ where: { id: eventId } });
  await prisma.changeLog.create({
    data: { planId: before.planId, adminId, action: "event:delete" },
  });
  await refreshWarnings(before.planId);
}

/** Wandelt beliebige Eingaben in einen JSON-kompatiblen Wert (Dates -> ISO). */
function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizeInput(input: EventInput) {
  return {
    date: input.date,
    startTime: input.startTime || null,
    endTime: input.endTime || null,
    title: input.title,
    course: input.course || null,
    holes: input.holes ?? null,
    tee: input.tee || null,
    participantsEstimate: input.participantsEstimate || null,
    playType: input.playType ?? null,
    format: input.format || null,
  };
}

// --- Abfragen ----------------------------------------------------------------

export async function getDashboardStats() {
  const [draft, review, published, archived, imports, errors] = await Promise.all([
    prisma.weeklyPlan.count({ where: { status: "DRAFT" } }),
    prisma.weeklyPlan.count({ where: { status: "REVIEW" } }),
    prisma.weeklyPlan.count({ where: { status: "PUBLISHED" } }),
    prisma.weeklyPlan.count({ where: { status: "ARCHIVED" } }),
    prisma.importRun.findMany({ orderBy: { startedAt: "desc" }, take: 5 }),
    prisma.errorLog.findMany({ orderBy: { at: "desc" }, take: 5 }),
  ]);
  return { draft, review, published, archived, imports, errors };
}

export async function listPlans(filter?: { status?: PlanStatus; year?: number }) {
  return prisma.weeklyPlan.findMany({
    where: {
      status: filter?.status,
      year: filter?.year,
    },
    orderBy: [{ year: "desc" }, { isoWeek: "desc" }],
    include: { _count: { select: { events: true } } },
  });
}

export async function getPlanWithEvents(planId: string) {
  return prisma.weeklyPlan.findUnique({
    where: { id: planId },
    include: { events: { orderBy: [{ date: "asc" }, { startTime: "asc" }] } },
  });
}

// --- Öffentliche Abfragen (nur PUBLISHED) ------------------------------------

export async function listPublishedPlans() {
  return prisma.weeklyPlan.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ year: "desc" }, { isoWeek: "desc" }],
  });
}

export async function getPublishedPlan(year: number, week: number) {
  if (!isValidWeek(year, week)) return null;
  return prisma.weeklyPlan.findFirst({
    where: { year, isoWeek: week, status: "PUBLISHED" },
    include: { events: { orderBy: [{ date: "asc" }, { startTime: "asc" }] } },
  });
}

/** Aktuellste veröffentlichte Woche (für die Startseite). */
export async function getCurrentPublishedPlan() {
  return prisma.weeklyPlan.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: [{ year: "desc" }, { isoWeek: "desc" }],
    include: { events: { orderBy: [{ date: "asc" }, { startTime: "asc" }] } },
  });
}

export function weekRangeFor(year: number, week: number) {
  return getWeekRange(year, week);
}
