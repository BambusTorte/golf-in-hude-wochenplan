import ical from "node-ical";
import { fetchText } from "./http";
import type { GolfDataProvider, ProviderResult, RawGolfEvent } from "./types";
import { berlinDayInstant, berlinYmd, getWeekRange } from "@/lib/week/isoWeek";
import { getEnv } from "@/env";

/** Berlin-Wandzeit "HH:mm" aus einem UTC-Instant. */
function berlinHm(instant: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(instant);
}

/**
 * Pure Parser-Funktion für den offiziellen PC-CADDIE/golfcloud ICS-Export.
 * Der ICS-Export ist sauber für Datum/Zeit, liefert aber weniger Detailfelder
 * (kein Platz, keine Teilnehmerzahlen). Er dient als robuster Fallback.
 */
export function parsePccaddieIcs(text: string): RawGolfEvent[] {
  const data = ical.parseICS(text);
  const events: RawGolfEvent[] = [];

  for (const item of Object.values(data)) {
    if (!item || (item as { type?: string }).type !== "VEVENT") continue;
    const ev = item as ical.VEvent;
    if (!ev.start) continue;

    const start = new Date(ev.start as unknown as string);
    const { y, m, d } = berlinYmd(start);
    const title = String(ev.summary ?? "").trim();
    if (!title) continue;

    // node-ical liefert bereits entfaltete Beschreibung mit echten Zeilen-
    // umbrüchen; auf eine Zeile normalisieren für stabile Regex-Auswertung.
    const description = String(ev.description ?? "")
      .replace(/\s+/g, " ")
      .trim();
    // Beschreibung beginnt mit dem wiederholten Titel – diesen abschneiden.
    let rest = description;
    if (title && rest.startsWith(title)) rest = rest.slice(title.length).trim();

    const holes = Number(rest.match(/(\d+)\s*Löcher/i)?.[1]) || undefined;
    const teeMatch = rest.match(/Tee\s*([0-9]+)/i);
    const tee = /kanonen?start/i.test(description)
      ? "Kanonenstart"
      : teeMatch
        ? teeMatch[1]
        : undefined;
    // Format = Text vor "- N Löcher" (z. B. "Einzel - Stableford").
    const formatMatch = rest.match(/^(.*?)\s*-\s*\d+\s*Löcher/i);
    const format = formatMatch ? formatMatch[1].trim() : undefined;
    // Zeit aus Beschreibung, sonst aus DTSTART (Berlin).
    const descTime = rest.match(/(\d{1,2}:\d{2})\s*Uhr/)?.[1];
    const startTime = descTime
      ? descTime.padStart(5, "0")
      : berlinHm(start);

    events.push({
      externalId: ev.uid ? String(ev.uid) : undefined,
      date: berlinDayInstant(y, m, d),
      startTime,
      endTime: ev.end ? berlinHm(new Date(ev.end as unknown as string)) : undefined,
      title,
      holes,
      tee,
      format,
      source: "PCCADDIE_ICS",
      raw: { description, location: String(ev.location ?? "") },
    });
  }

  return events;
}

export class PccaddieIcsProvider implements GolfDataProvider {
  key = "pccaddie-ics";
  label = "PC CADDIE (ICS-Export)";

  constructor(private icsUrl: string = getEnv().PCCADDIE_ICS_URL) {}

  async getEventsForWeek(year: number, week: number): Promise<ProviderResult> {
    const warnings: string[] = [];
    const text = await fetchText(this.icsUrl, { accept: "text/calendar" });
    const all = parsePccaddieIcs(text);
    const { start, end } = getWeekRange(year, week);
    const events = all.filter((e) => e.date >= start && e.date <= end);
    if (all.length > 0 && events.length === 0) {
      warnings.push(
        `Der ICS-Export enthält keine Termine für KW ${week}/${year}.`,
      );
    }
    return { providerKey: this.key, events, warnings, fetchedAt: new Date() };
  }
}
