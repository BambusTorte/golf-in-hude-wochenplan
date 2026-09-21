import type { RawGolfEvent } from "@/lib/providers/types";
import { berlinYmd } from "@/lib/week/isoWeek";

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/["'!.,–-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Duplikatschlüssel eines Events:
 * - primär die stabile externe ID
 * - sonst Datum + normalisierter Titel + Startzeit (fängt mehrfachen Import
 *   ohne ID sowie provider-übergreifende Dubletten ab).
 */
export function eventKey(e: RawGolfEvent): string {
  if (e.externalId) return `id:${e.externalId}`;
  const { y, m, d } = berlinYmd(e.date);
  return `k:${y}-${m}-${d}:${normalizeTitle(e.title)}:${e.startTime ?? "?"}`;
}

/**
 * Entfernt Duplikate; das zuerst gesehene Event gewinnt (Reihenfolge =
 * Providerpriorität). Verhindert doppelte Termine bei mehrfachem Import.
 */
export function dedupeEvents(events: RawGolfEvent[]): RawGolfEvent[] {
  const seen = new Set<string>();
  const result: RawGolfEvent[] = [];
  for (const e of events) {
    const key = eventKey(e);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(e);
  }
  return result;
}
