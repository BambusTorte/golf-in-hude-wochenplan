import * as cheerio from "cheerio";
import { fetchText } from "./http";
import type { GolfDataProvider, ProviderResult, RawGolfEvent } from "./types";
import { berlinDayInstant, getWeekRange } from "@/lib/week/isoWeek";
import { getEnv } from "@/env";

/**
 * Baut aus der Kalender-URL die Basis-App-URL, um kanonische Turnier-Links
 * (Ausschreibung, Teilnehmerliste, Anmeldung) je externer ID zu erzeugen.
 */
function deriveBaseUrl(calendarUrl: string): string {
  try {
    const u = new URL(calendarUrl);
    return `${u.origin}${u.pathname}`;
  } catch {
    return "https://www.pccaddie.net/clubs/0493369/app.php";
  }
}

function normText(s: string): string {
  return s.replace(/ /g, " ").replace(/\s+/g, " ").trim();
}

function toInt(s?: string | null): number | undefined {
  if (!s) return undefined;
  const n = parseInt(s.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : undefined;
}

function extractTime(text: string): string | undefined {
  const m = text.match(/(\d{1,2}):(\d{2})/);
  if (!m) return undefined;
  const h = m[1].padStart(2, "0");
  return `${h}:${m[2]}`;
}

function buildLinks(baseUrl: string, id: string) {
  const q = (sub: string) => `${baseUrl}?cat=ts_calendar&sub=${sub}&id=${id}`;
  return {
    announcement: q("detail"),
    entrylist: q("entrylist"),
    register: q("register"),
  };
}

/**
 * Pure Parser-Funktion: extrahiert alle Events aus dem PC-CADDIE-Kalender-HTML.
 * Ohne Netzwerk – dadurch mit Fixtures unit-testbar.
 */
export function parsePccaddieHtml(
  html: string,
  baseUrl: string,
): RawGolfEvent[] {
  const $ = cheerio.load(html);
  const events: RawGolfEvent[] = [];

  $("tr.pcco-xcal-list-item").each((_, el) => {
    const $row = $(el);
    const externalId = ($row.attr("data-id") || "").trim() || undefined;

    const $intern = $row.find("td.tk-intern").first();
    const $body = $row.find("td.tk-body-name").first();

    // --- Datum ---
    const datetimeAttr = $intern.find("time").attr("datetime") || "";
    const dateMatch = datetimeAttr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (!dateMatch) return; // ohne Datum kein verwertbares Event
    const day = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const year = Number(dateMatch[3]);
    const date = berlinDayInstant(year, month, day);

    // --- Zeiten ---
    const warnings: string[] = [];
    const headerTime = extractTime($intern.find("small").text() || datetimeAttr);
    const resourceText = normText($body.find(".tk-resources-container").text());
    const resourceTime = extractTime(resourceText);
    // Die Platzbelegungszeit ist die maßgebliche Startzeit (deckt sich mit den
    // gedruckten Wochenplänen); Kopfzeit dient als Fallback.
    const startTime = resourceTime ?? headerTime;
    if (resourceTime && headerTime && resourceTime !== headerTime) {
      warnings.push(
        `Abweichende Zeiten: Kopf ${headerTime}, Platzbelegung ${resourceTime} – Startzeit ${startTime} übernommen, bitte prüfen.`,
      );
    }

    // --- Titel & Platz ---
    const title = normText($body.find(".tk-turnier").first().text());
    if (!title) return;
    const courseRaw =
      normText($body.children("span.tk-club").first().text()) || undefined;

    // --- Löcher ---
    const numHolesClass = ($intern.attr("class") || "").match(/numholes-(\d+)/);
    const bodyText = normText($body.text());
    const holes =
      toInt(numHolesClass?.[1]) ?? toInt(bodyText.match(/Löcher:\s*(\d+)/)?.[1]);

    // --- Teilnehmer / freie Plätze ---
    const maxParticipants = toInt(
      bodyText.match(/Teilnehmer maximal:\s*([\d.]+)/)?.[1],
    );
    const freeOnline = toInt(
      bodyText.match(/Freie Plätze online:\s*([\d.]+)/)?.[1],
    );

    // --- Handicap-Relevanz (Reihenfolge: "nicht" zuerst prüfen) ---
    let handicapRelevant: boolean | undefined;
    if (/nicht\s+Handicap-relevant/i.test(bodyText)) handicapRelevant = false;
    else if (/Handicap-relevant/i.test(bodyText)) handicapRelevant = true;

    // --- Format (Segment direkt vor der Handicap-Angabe) ---
    const formatMatch = bodyText.match(
      /\|\s*([^|]+?)\s*\|\s*(?:nicht\s+)?Handicap-relevant/i,
    );
    const format = formatMatch ? normText(formatMatch[1]) : undefined;

    // --- Tee / Kanonenstart (aus dem Titel ableitbar) ---
    const tee = /kanonen?start|kanone/i.test(title) ? "Kanonenstart" : undefined;

    events.push({
      externalId,
      date,
      startTime,
      title,
      courseRaw,
      holes,
      tee,
      format,
      handicapRelevant,
      maxParticipants,
      freeOnline,
      links: externalId ? buildLinks(baseUrl, externalId) : undefined,
      source: "PCCADDIE_HTML",
      warnings: warnings.length ? warnings : undefined,
      raw: {
        courseRaw,
        headerTime,
        resourceTime,
        datetimeAttr: normText(datetimeAttr),
      },
    });
  });

  return events;
}

export class PccaddieHtmlProvider implements GolfDataProvider {
  key = "pccaddie-html";
  label = "PC CADDIE (Turnierkalender)";

  constructor(
    private calendarUrl: string = getEnv().PCCADDIE_CALENDAR_URL,
  ) {}

  async getEventsForWeek(year: number, week: number): Promise<ProviderResult> {
    const warnings: string[] = [];
    const html = await fetchText(this.calendarUrl, { accept: "text/html" });
    const all = parsePccaddieHtml(html, deriveBaseUrl(this.calendarUrl));

    const { start, end } = getWeekRange(year, week);
    const events = all.filter((e) => e.date >= start && e.date <= end);

    if (all.length > 0 && events.length === 0) {
      warnings.push(
        `Für KW ${week}/${year} wurden im aktuell gelieferten Kalenderausschnitt keine Termine gefunden. Ggf. liegt die Woche außerhalb des von PC-CADDIE gelieferten Zeitraums – dann manuell erfassen.`,
      );
    }
    for (const e of events) {
      if (e.warnings) warnings.push(`${e.title}: ${e.warnings.join(" ")}`);
    }

    return {
      providerKey: this.key,
      events,
      warnings,
      fetchedAt: new Date(),
    };
  }
}
