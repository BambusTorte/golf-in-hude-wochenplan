import type { PlayType } from "@prisma/client";

/**
 * Normalisiert die rohe Platzangabe aus PC-CADDIE zu einem sauberen Platznamen.
 * "1-18 Nordsee" -> "Nordseeplatz", "1-9 Weserplatz - C" -> "Weserplatz".
 * Unbekannte Werte werden (getrimmt) unverändert übernommen, nie erfunden.
 */
export function normalizeCourse(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const text = raw.trim();
  if (/nordsee/i.test(text)) return "Nordseeplatz";
  if (/weser/i.test(text)) return "Weserplatz";
  if (!text) return undefined;
  return text;
}

/**
 * Schlägt eine Spielart auf Basis der Handicap-Relevanz vor.
 * Verband/Sponsor lassen sich nicht zuverlässig automatisch erkennen und
 * bleiben dem Betreiber überlassen. Rückgabe ist ein VORSCHLAG.
 */
export function suggestPlayType(
  handicapRelevant?: boolean | null,
): PlayType | undefined {
  if (handicapRelevant === true) return "CLUB_VW";
  if (handicapRelevant === false) return "CLUB_NVW";
  return undefined;
}

/**
 * Schätzt die voraussichtliche Teilnehmerzahl (Spalte "TN") als
 * Anmeldungen = Teilnehmer maximal − freie Online-Plätze.
 * WICHTIG: Das ist ausdrücklich eine Schätzung und wird als "ca. N" markiert.
 * Die echte Teilnehmerzahl ist der Quelle nicht zuverlässig zu entnehmen.
 */
export function suggestParticipants(
  maxParticipants?: number | null,
  freeOnline?: number | null,
): string | undefined {
  if (
    typeof maxParticipants === "number" &&
    typeof freeOnline === "number" &&
    maxParticipants >= 0 &&
    freeOnline >= 0 &&
    maxParticipants >= freeOnline
  ) {
    const registered = maxParticipants - freeOnline;
    if (registered > 0) return `ca. ${registered}`;
  }
  return undefined;
}
