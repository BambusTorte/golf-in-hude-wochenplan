import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parsePccaddieHtml } from "@/lib/providers/pccaddieHtml";
import { formatDateDe } from "@/lib/week/isoWeek";

const html = readFileSync(
  fileURLToPath(new URL("../fixtures/pccaddie-calendar.html", import.meta.url)),
  "utf8",
);
const BASE = "https://www.pccaddie.net/clubs/0493369/app.php";
const events = parsePccaddieHtml(html, BASE);

describe("parsePccaddieHtml", () => {
  it("findet mehrere Events", () => {
    expect(events.length).toBeGreaterThanOrEqual(10);
  });

  it("parst das Damengolf-Event vollständig und korrekt", () => {
    const dg = events.find((e) => e.title.startsWith("Damengolf"));
    expect(dg).toBeDefined();
    expect(formatDateDe(dg!.date)).toBe("22.09.2026");
    expect(dg!.courseRaw).toBe("1-18 Nordsee");
    expect(dg!.holes).toBe(18);
    expect(dg!.maxParticipants).toBe(36);
    expect(dg!.freeOnline).toBe(25);
    expect(dg!.handicapRelevant).toBe(true);
    expect(dg!.format).toBe("Einzel - Stableford");
    expect(dg!.startTime).toBe("11:00");
    expect(dg!.externalId).toBe("3300346");
    expect(dg!.links?.entrylist).toContain("sub=entrylist&id=3300346");
  });

  it("nutzt die Platzbelegungszeit als Startzeit und warnt bei Abweichung", () => {
    // Herrengolf am 30.09.2026: Kopfzeit 14:00, Platzbelegung 15:00.
    const hg = events.find(
      (e) =>
        e.title.startsWith("Herrengolf") &&
        formatDateDe(e.date) === "30.09.2026",
    );
    expect(hg).toBeDefined();
    expect(hg!.startTime).toBe("15:00");
    expect(hg!.warnings?.join(" ")).toMatch(/Abweichende Zeiten/);
  });

  it("erkennt nicht-handicap-relevante Events (Happy Oldies)", () => {
    const ho = events.find((e) => e.title.startsWith("Happy Oldies"));
    expect(ho).toBeDefined();
    expect(ho!.handicapRelevant).toBe(false);
    expect(ho!.holes).toBe(9);
  });

  it("liefert stabile externe IDs zur Duplikaterkennung", () => {
    const ids = events.map((e) => e.externalId).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length); // eindeutig
  });
});
