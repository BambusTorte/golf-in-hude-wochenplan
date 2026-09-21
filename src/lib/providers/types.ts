import type { EventSource } from "@prisma/client";

/** Links, die PC-CADDIE je Turnier anbietet. */
export interface EventLinks {
  announcement?: string; // Ausschreibung / Detail
  entrylist?: string; // Teilnehmerliste
  draw?: string; // Auslosung / Startliste
  result?: string; // Ergebnisse
  register?: string; // Anmeldung
}

/**
 * Rohes, quellenunabhängiges Turnier-/Veranstaltungs-Event.
 * Wird von Providern geliefert und von der Wochenplanlogik weiterverarbeitet.
 * Bewusst KEINE Interpretationen (z. B. Teilnehmerschätzung) – nur Rohdaten.
 */
export interface RawGolfEvent {
  externalId?: string;
  /** Konkretes Datum des Termins (Berlin-Mitternacht als UTC-Instant). */
  date: Date;
  /** Echte Startzeit "HH:mm" (aus der Platzbelegung), falls vorhanden. */
  startTime?: string;
  endTime?: string;
  title: string;
  /** Rohe Platzangabe, z. B. "1-18 Nordsee" / "1-9 Weserplatz - C". */
  courseRaw?: string;
  holes?: number;
  tee?: string;
  format?: string;
  handicapRelevant?: boolean;
  maxParticipants?: number;
  freeOnline?: number;
  links?: EventLinks;
  source: EventSource;
  /** Provider-Hinweise/Unstimmigkeiten (z. B. abweichende Zeiten). */
  warnings?: string[];
  /** Rohdatenreferenz zur Nachvollziehbarkeit. */
  raw?: Record<string, unknown>;
}

export interface ProviderResult {
  providerKey: string;
  events: RawGolfEvent[];
  warnings: string[];
  fetchedAt: Date;
}

/**
 * Austauschbare Datenquelle. Neue Quellen (z. B. Campo) müssen nur dieses
 * Interface erfüllen; die restliche Anwendung bleibt unverändert.
 */
export interface GolfDataProvider {
  key: string;
  label: string;
  getEventsForWeek(year: number, week: number): Promise<ProviderResult>;
}
