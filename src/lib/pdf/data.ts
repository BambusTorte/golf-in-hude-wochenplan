import type { PlanEvent, WeeklyPlan } from "@prisma/client";
import { WEEKDAY_LABELS_DE } from "@/lib/week/isoWeek";
import { PLAY_TYPE_SHORT, PLAY_TYPE_LEGEND } from "@/lib/plan/labels";

export interface PdfEvent {
  title: string;
  course: string;
  startTime: string;
  holes: string;
  tee: string;
  participants: string;
  playType: string;
}

export interface PdfDay {
  weekday: number;
  label: string;
  events: PdfEvent[];
}

export interface PdfPlanData {
  title: string;
  subtitle: string;
  days: PdfDay[];
  legend: string;
}

const DASH = "–";

function toPdfEvent(e: PlanEvent): PdfEvent {
  return {
    title: e.title,
    course: e.course ?? DASH,
    startTime: e.startTime ?? DASH,
    holes: e.holes != null ? String(e.holes) : DASH,
    tee: e.tee ?? DASH,
    participants: e.participantsEstimate ?? DASH,
    playType: e.playType ? PLAY_TYPE_SHORT[e.playType] : "",
  };
}

/** Wandelt Plan + Events in die druckfertige, nach Wochentagen gruppierte Struktur. */
export function buildPdfData(
  plan: Pick<WeeklyPlan, "title" | "subtitle">,
  events: PlanEvent[],
): PdfPlanData {
  const days: PdfDay[] = WEEKDAY_LABELS_DE.map((label, weekday) => ({
    weekday,
    label,
    events: events
      .filter((e) => e.weekday === weekday)
      .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""))
      .map(toPdfEvent),
  }));

  return {
    title: plan.title,
    subtitle: plan.subtitle ?? "",
    days,
    legend: PLAY_TYPE_LEGEND,
  };
}
