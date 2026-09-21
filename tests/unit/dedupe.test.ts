import { describe, it, expect } from "vitest";
import { dedupeEvents, eventKey } from "@/lib/plan/dedupe";
import type { RawGolfEvent } from "@/lib/providers/types";
import { berlinDayInstant } from "@/lib/week/isoWeek";

function ev(partial: Partial<RawGolfEvent>): RawGolfEvent {
  return {
    date: berlinDayInstant(2026, 9, 30),
    title: "Herrengolf",
    startTime: "15:00",
    source: "PCCADDIE_HTML",
    ...partial,
  };
}

describe("dedupeEvents", () => {
  it("entfernt Duplikate mit gleicher externer ID", () => {
    const list = [ev({ externalId: "1" }), ev({ externalId: "1" }), ev({ externalId: "2" })];
    expect(dedupeEvents(list)).toHaveLength(2);
  });

  it("erkennt Duplikate ohne ID über Datum+Titel+Zeit", () => {
    const list = [
      ev({ title: "Herrengolf!" }),
      ev({ title: "Herrengolf" }), // gleiche normalisierte Form
    ];
    expect(dedupeEvents(list)).toHaveLength(1);
  });

  it("behält verschiedene Events am selben Tag", () => {
    const list = [
      ev({ title: "Herrengolf", startTime: "15:00" }),
      ev({ title: "AfterWork", startTime: "17:00" }),
    ];
    expect(dedupeEvents(list)).toHaveLength(2);
  });

  it("eventKey bevorzugt die externe ID", () => {
    expect(eventKey(ev({ externalId: "abc" }))).toBe("id:abc");
  });
});
