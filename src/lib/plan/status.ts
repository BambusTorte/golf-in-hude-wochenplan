import type { PlanStatus } from "@prisma/client";

/**
 * Erlaubte Statusübergänge. Regulärer Fluss:
 *   DRAFT -> REVIEW -> PUBLISHED -> ARCHIVED
 * Zusätzlich: Rücknahme (PUBLISHED -> REVIEW), Zurückstufen, Reaktivieren.
 */
const TRANSITIONS: Record<PlanStatus, PlanStatus[]> = {
  DRAFT: ["REVIEW", "ARCHIVED"],
  REVIEW: ["PUBLISHED", "DRAFT", "ARCHIVED"],
  PUBLISHED: ["REVIEW", "ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};

export function canTransition(from: PlanStatus, to: PlanStatus): boolean {
  if (from === to) return false;
  return TRANSITIONS[from].includes(to);
}

export function allowedTransitions(from: PlanStatus): PlanStatus[] {
  return TRANSITIONS[from];
}

export function assertTransition(from: PlanStatus, to: PlanStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Unzulässiger Statuswechsel: ${from} -> ${to}`);
  }
}
