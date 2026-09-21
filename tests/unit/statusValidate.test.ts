import { describe, it, expect } from "vitest";
import { canTransition, allowedTransitions } from "@/lib/plan/status";
import { validatePlan } from "@/lib/plan/validate";

describe("status transitions", () => {
  it("erlaubt den regulären Fluss", () => {
    expect(canTransition("DRAFT", "REVIEW")).toBe(true);
    expect(canTransition("REVIEW", "PUBLISHED")).toBe(true);
    expect(canTransition("PUBLISHED", "ARCHIVED")).toBe(true);
    expect(canTransition("PUBLISHED", "REVIEW")).toBe(true); // Rücknahme
  });
  it("verbietet unzulässige Sprünge", () => {
    expect(canTransition("DRAFT", "PUBLISHED")).toBe(false);
    expect(canTransition("ARCHIVED", "PUBLISHED")).toBe(false);
    expect(canTransition("DRAFT", "DRAFT")).toBe(false);
  });
  it("listet erlaubte Ziele", () => {
    expect(allowedTransitions("REVIEW")).toContain("PUBLISHED");
  });
});

describe("validatePlan", () => {
  it("warnt bei leerer Woche", () => {
    const r = validatePlan([]);
    expect(r.warnings[0]).toMatch(/keine Termine/);
  });
  it("meldet fehlende Angaben pro Event", () => {
    const r = validatePlan([
      { title: "Herrengolf", weekday: 2, startTime: "15:00", course: "Nordseeplatz" },
    ]);
    expect(r.incompleteCount).toBe(1);
    expect(r.warnings.join(" ")).toMatch(/TN/);
    expect(r.warnings.join(" ")).toMatch(/Spielart/);
  });
  it("erkennt mögliche Überschneidungen", () => {
    const r = validatePlan([
      { title: "A", weekday: 2, startTime: "15:00", course: "Nordseeplatz", participantsEstimate: "ca. 10", playType: "CLUB_VW" },
      { title: "B", weekday: 2, startTime: "15:00", course: "Nordseeplatz", participantsEstimate: "ca. 10", playType: "CLUB_VW" },
    ]);
    expect(r.warnings.join(" ")).toMatch(/überschneidung/i);
  });
  it("ist zufrieden mit vollständigen Events", () => {
    const r = validatePlan([
      { title: "A", weekday: 2, startTime: "15:00", course: "Nordseeplatz", participantsEstimate: "ca. 10", playType: "CLUB_VW" },
    ]);
    expect(r.incompleteCount).toBe(0);
    expect(r.warnings).toHaveLength(0);
  });
});
