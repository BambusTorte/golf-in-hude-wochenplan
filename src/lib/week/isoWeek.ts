import { fromZonedTime, toZonedTime } from "date-fns-tz";

/**
 * ISO-Kalenderwochen-Logik für den Golfclub Hude.
 * - Wochen laufen Montag–Sonntag (ISO-8601).
 * - Alle "Wochen"-Grenzen beziehen sich auf die Zeitzone Europe/Berlin.
 * - Die Kern-Wochenmathematik ist reine UTC-Ganzzahlarithmetik und damit
 *   unabhängig von der Zeitzone des laufenden Servers. Nur für die Umrechnung
 *   "Berlin-Wandzeit -> UTC-Instant" (DST-korrekt) wird date-fns-tz genutzt.
 */

export const TIME_ZONE = "Europe/Berlin";

export interface IsoWeek {
  /** ISO-Wochen-Jahr (kann am Jahreswechsel vom Kalenderjahr abweichen). */
  year: number;
  /** ISO-Wochennummer 1..53. */
  week: number;
}

export interface WeekRange extends IsoWeek {
  /** Montag 00:00 Europe/Berlin als UTC-Instant. */
  start: Date;
  /** Sonntag 23:59:59.999 Europe/Berlin als UTC-Instant. */
  end: Date;
}

interface Ymd {
  y: number;
  m: number; // 1..12
  d: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** ISO-Wochentag Mo=0..So=6 aus einem UTC-Date. */
function isoDayIndexUtc(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

/** Wandelt Y-M-D (1..12) in {isoYear, isoWeek} um – reine UTC-Arithmetik. */
export function isoWeekFromYmd(y: number, m: number, d: number): IsoWeek {
  const date = new Date(Date.UTC(y, m - 1, d));
  // Zum Donnerstag derselben ISO-Woche springen – der bestimmt das ISO-Jahr.
  date.setUTCDate(date.getUTCDate() - isoDayIndexUtc(date) + 3);
  const isoYear = date.getUTCFullYear();
  // Donnerstag der ISO-Woche 1 des isoYear.
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  firstThursday.setUTCDate(
    firstThursday.getUTCDate() - isoDayIndexUtc(firstThursday) + 3,
  );
  const week =
    1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * DAY_MS));
  return { year: isoYear, week };
}

/** Montag (Y-M-D) der ISO-Woche (year, week) – reine UTC-Arithmetik. */
function mondayOfIsoWeek(year: number, week: number): Ymd {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - isoDayIndexUtc(jan4));
  const monday = new Date(mondayWeek1);
  monday.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);
  return {
    y: monday.getUTCFullYear(),
    m: monday.getUTCMonth() + 1,
    d: monday.getUTCDate(),
  };
}

function addDaysYmd(ymd: Ymd, days: number): Ymd {
  const dt = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

/** Anzahl ISO-Wochen (52 oder 53) eines ISO-Jahres. */
export function isoWeeksInYear(year: number): number {
  // Der 28. Dezember liegt immer in der letzten ISO-Woche des Jahres.
  return isoWeekFromYmd(year, 12, 28).week;
}

/** Berlin-Wandzeit (Y-M-D + Uhrzeit) -> UTC-Instant (DST-korrekt). */
function berlinInstant(ymd: Ymd, time: string): Date {
  const iso = `${ymd.y}-${pad(ymd.m)}-${pad(ymd.d)}T${time}`;
  return fromZonedTime(iso, TIME_ZONE);
}

/** Berlin-Kalendertag (Y-M-D) + Uhrzeit -> UTC-Instant (DST-korrekt). */
export function berlinDayInstant(
  y: number,
  m: number,
  d: number,
  time = "00:00:00.000",
): Date {
  return berlinInstant({ y, m, d }, time);
}

/** Kalenderdatum (Y-M-D) eines UTC-Instants in Europe/Berlin. */
export function berlinYmd(instant: Date): Ymd {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

/** ISO-Woche eines beliebigen Instants (in Berlin interpretiert). */
export function getIsoWeekForInstant(instant: Date): IsoWeek {
  const { y, m, d } = berlinYmd(instant);
  return isoWeekFromYmd(y, m, d);
}

/** Aktuelle ISO-Woche (Standard: jetzt). */
export function getCurrentWeek(now: Date = new Date()): IsoWeek {
  return getIsoWeekForInstant(now);
}

/** Vollständiger Wochenbereich (Start/Ende als UTC-Instants) für (year, week). */
export function getWeekRange(year: number, week: number): WeekRange {
  const monday = mondayOfIsoWeek(year, week);
  const sunday = addDaysYmd(monday, 6);
  return {
    year,
    week,
    start: berlinInstant(monday, "00:00:00.000"),
    end: berlinInstant(sunday, "23:59:59.999"),
  };
}

/** Alle 7 Tage (als UTC-Instants für 00:00 Berlin) einer Woche, Mo..So. */
export function getWeekDays(year: number, week: number): Date[] {
  const monday = mondayOfIsoWeek(year, week);
  return Array.from({ length: 7 }, (_, i) =>
    berlinInstant(addDaysYmd(monday, i), "00:00:00.000"),
  );
}

/**
 * Ordnet ein konkretes Datum (Instant) einem Wochentag-Index 0..6 (Mo..So)
 * relativ zur Berlin-Wandzeit zu.
 */
export function weekdayIndex(instant: Date): number {
  const zoned = toZonedTime(instant, TIME_ZONE);
  return (zoned.getDay() + 6) % 7;
}

/** Formatiert einen Instant als YYYY-MM-DD (Berlin) – für <input type=date>. */
export function berlinYmdStr(instant: Date): string {
  const { y, m, d } = berlinYmd(instant);
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Formatiert einen Instant als DD.MM.YYYY (Berlin). */
export function formatDateDe(instant: Date): string {
  const { y, m, d } = berlinYmd(instant);
  return `${pad(d)}.${pad(m)}.${y}`;
}

/** "28.09.2026 - 04.10.2026" für einen Wochenbereich. */
export function formatWeekRange(range: Pick<WeekRange, "start" | "end">): string {
  return `${formatDateDe(range.start)} - ${formatDateDe(range.end)}`;
}

export const WEEKDAY_LABELS_DE = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
] as const;

/** Prüft, ob (year, week) eine gültige ISO-Woche ist. */
export function isValidWeek(year: number, week: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(week)) return false;
  if (year < 2000 || year > 2100) return false;
  return week >= 1 && week <= isoWeeksInYear(year);
}
