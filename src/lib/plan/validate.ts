import type { PlayType } from "@prisma/client";
import { WEEKDAY_LABELS_DE } from "@/lib/week/isoWeek";

export interface ValidatableEvent {
  title: string;
  weekday: number;
  startTime?: string | null;
  course?: string | null;
  holes?: number | null;
  participantsEstimate?: string | null;
  playType?: PlayType | null;
}

export interface ValidationResult {
  warnings: string[];
  /** Anzahl Events, die für die Veröffentlichung noch Aufmerksamkeit brauchen. */
  incompleteCount: number;
}

/**
 * Prüft einen Wochenplan vor der Veröffentlichung und liefert verständliche
 * Warnungen. Es wird nichts erfunden oder verändert – nur berichtet.
 */
export function validatePlan(events: ValidatableEvent[]): ValidationResult {
  const warnings: string[] = [];

  if (events.length === 0) {
    warnings.push(
      "Diese Woche enthält keine Termine. Prüfe die Datenquelle oder ergänze Termine manuell.",
    );
    return { warnings, incompleteCount: 0 };
  }

  let incomplete = 0;
  for (const e of events) {
    const day = WEEKDAY_LABELS_DE[e.weekday] ?? "";
    const missing: string[] = [];
    if (!e.startTime) missing.push("Startzeit");
    if (!e.course) missing.push("Platz");
    if (!e.participantsEstimate) missing.push("TN (Teilnehmerschätzung)");
    if (!e.playType) missing.push("Spielart");
    if (missing.length > 0) {
      incomplete++;
      warnings.push(
        `${day} · „${e.title}": fehlende Angaben – ${missing.join(", ")}.`,
      );
    }
  }

  // Mögliche Überschneidungen: gleicher Tag, gleicher Platz, gleiche Startzeit.
  const seen = new Map<string, string>();
  for (const e of events) {
    if (!e.startTime || !e.course) continue;
    const key = `${e.weekday}|${e.course}|${e.startTime}`;
    const prev = seen.get(key);
    if (prev) {
      warnings.push(
        `${WEEKDAY_LABELS_DE[e.weekday]} · mögliche Terminüberschneidung auf ${e.course} um ${e.startTime}: „${prev}" und „${e.title}".`,
      );
    } else {
      seen.set(key, e.title);
    }
  }

  return { warnings, incompleteCount: incomplete };
}
