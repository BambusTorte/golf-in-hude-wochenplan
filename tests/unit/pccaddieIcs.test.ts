import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parsePccaddieIcs } from "@/lib/providers/pccaddieIcs";
import { formatDateDe } from "@/lib/week/isoWeek";

const ics = readFileSync(
  fileURLToPath(new URL("../fixtures/pccaddie-calendar.ics", import.meta.url)),
  "utf8",
);
const events = parsePccaddieIcs(ics);

describe("parsePccaddieIcs", () => {
  it("liest alle VEVENTs", () => {
    expect(events.length).toBe(19);
  });

  it("parst Titel, Datum, Löcher und Format aus der Beschreibung", () => {
    const dg = events.find((e) => e.title.startsWith("Damengolf"));
    expect(dg).toBeDefined();
    expect(formatDateDe(dg!.date)).toBe("22.09.2026");
    expect(dg!.holes).toBe(18);
    expect(dg!.format).toBe("Einzel - Stableford");
    expect(dg!.startTime).toBe("11:00");
    expect(dg!.source).toBe("PCCADDIE_ICS");
  });
});
