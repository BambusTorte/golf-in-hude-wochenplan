import { describe, it, expect } from "vitest";
import {
  isoWeekFromYmd,
  isoWeeksInYear,
  getWeekRange,
  getIsoWeekForInstant,
  formatWeekRange,
  formatDateDe,
  weekdayIndex,
  isValidWeek,
  getWeekDays,
} from "@/lib/week/isoWeek";

describe("isoWeekFromYmd", () => {
  it("ordnet den 28.09.2026 der ISO-Woche 40/2026 zu (reale Vorlage)", () => {
    expect(isoWeekFromYmd(2026, 9, 28)).toEqual({ year: 2026, week: 40 });
    expect(isoWeekFromYmd(2026, 10, 4)).toEqual({ year: 2026, week: 40 });
  });

  it("behandelt den Jahreswechsel korrekt (Silvester gehört zu KW1/Folgejahr)", () => {
    // 31.12.2019 gehört zu ISO-Woche 1 von 2020.
    expect(isoWeekFromYmd(2019, 12, 31)).toEqual({ year: 2020, week: 1 });
    // 01.01.2021 gehört noch zu ISO-Woche 53 von 2020.
    expect(isoWeekFromYmd(2021, 1, 1)).toEqual({ year: 2020, week: 53 });
    // 04.01.2021 ist ISO-Woche 1 von 2021.
    expect(isoWeekFromYmd(2021, 1, 4)).toEqual({ year: 2021, week: 1 });
  });
});

describe("isoWeeksInYear", () => {
  it("erkennt 53-Wochen-Jahre", () => {
    expect(isoWeeksInYear(2020)).toBe(53);
    expect(isoWeeksInYear(2026)).toBe(53);
  });
  it("erkennt 52-Wochen-Jahre", () => {
    expect(isoWeeksInYear(2021)).toBe(52);
    expect(isoWeeksInYear(2025)).toBe(52);
  });
});

describe("getWeekRange", () => {
  it("liefert Montag 00:00 bis Sonntag 23:59 (Europe/Berlin) für KW40/2026", () => {
    const r = getWeekRange(2026, 40);
    expect(formatDateDe(r.start)).toBe("28.09.2026");
    expect(formatDateDe(r.end)).toBe("04.10.2026");
    expect(formatWeekRange(r)).toBe("28.09.2026 - 04.10.2026");
    // Start ist Berlin-Mitternacht = 22:00 UTC des Vortags (Sommerzeit +2).
    expect(r.start.toISOString()).toBe("2026-09-27T22:00:00.000Z");
  });

  it("überspannt den Jahreswechsel korrekt (KW1/2021 beginnt am 04.01.2021)", () => {
    const r = getWeekRange(2021, 1);
    expect(formatDateDe(r.start)).toBe("04.01.2021");
    expect(formatDateDe(r.end)).toBe("10.01.2021");
  });

  it("liefert 7 Wochentage Mo..So", () => {
    const days = getWeekDays(2026, 40);
    expect(days).toHaveLength(7);
    expect(formatDateDe(days[0])).toBe("28.09.2026");
    expect(formatDateDe(days[6])).toBe("04.10.2026");
  });
});

describe("getIsoWeekForInstant", () => {
  it("interpretiert Instants in Europe/Berlin", () => {
    // 28.09.2026 00:30 Berlin (= 27.09 22:30 UTC) ist Montag KW40.
    const instant = new Date("2026-09-27T22:30:00.000Z");
    expect(getIsoWeekForInstant(instant)).toEqual({ year: 2026, week: 40 });
    expect(weekdayIndex(instant)).toBe(0); // Montag
  });
});

describe("isValidWeek", () => {
  it("akzeptiert gültige und lehnt ungültige Wochen ab", () => {
    expect(isValidWeek(2026, 40)).toBe(true);
    expect(isValidWeek(2026, 53)).toBe(true); // 2026 hat 53 Wochen
    expect(isValidWeek(2025, 53)).toBe(false); // 2025 hat nur 52
    expect(isValidWeek(2026, 0)).toBe(false);
    expect(isValidWeek(2026, 60)).toBe(false);
  });
});
