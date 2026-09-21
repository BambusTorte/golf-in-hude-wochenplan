import type { PlanStatus, PlayType } from "@prisma/client";

export const STATUS_LABELS: Record<PlanStatus, string> = {
  DRAFT: "Entwurf",
  REVIEW: "Zur Prüfung",
  PUBLISHED: "Veröffentlicht",
  ARCHIVED: "Archiviert",
};

/** Kurzform der Spielart wie in der gedruckten Vorlage. */
export const PLAY_TYPE_SHORT: Record<PlayType, string> = {
  CLUB_VW: "Club vw.",
  CLUB_NVW: "Club nvw.",
  VERBAND: "Verband",
  SPONSOR: "Sponsor",
};

export const PLAY_TYPE_LABELS: Record<PlayType, string> = {
  CLUB_VW: "Clubwettspiel vorgabewirksam",
  CLUB_NVW: "Clubwettspiel nicht vorgabewirksam",
  VERBAND: "Verbandswettspiel",
  SPONSOR: "Sponsorenveranstaltung",
};

/** Legende wie im Fuß der Vorlage. */
export const PLAY_TYPE_LEGEND =
  "Club Wettspiel vw. – Club vw, Clubwettspiel nicht vw. – Club nvw, Verbandswettspiel – Verband, Sponsor – Sponsor";

export const PLAN_SUBTITLE_DEFAULT = "18-Loch Nordseeplatz + 9 Loch Weserplatz";

export const PLAY_TYPE_OPTIONS = (
  Object.keys(PLAY_TYPE_SHORT) as PlayType[]
).map((value) => ({ value, label: PLAY_TYPE_LABELS[value] }));
