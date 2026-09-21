import type { GolfDataProvider, ProviderResult } from "./types";

/**
 * Platzhalter-Provider für Campo (Platzsperren/Blockierungszeiten).
 *
 * Status: Die Integration von Campo-Belegungsdaten wurde geprüft, ist aber
 * ohne dokumentierte öffentliche, zulässige Schnittstelle nicht zuverlässig
 * umsetzbar. Dieser Provider erfüllt bewusst das gemeinsame Interface, liefert
 * aktuell keine Events und signalisiert die Einschränkung als Warnung.
 *
 * Sobald eine zulässige Datenquelle vorliegt, wird nur diese Klasse ergänzt –
 * die restliche Anwendung bleibt unverändert (austauschbare Provider-Architektur).
 */
export class CampoProvider implements GolfDataProvider {
  key = "campo";
  label = "Campo (Platzsperren) – nicht aktiv";

  async getEventsForWeek(): Promise<ProviderResult> {
    return {
      providerKey: this.key,
      events: [],
      warnings: [
        "Campo-Datenquelle ist derzeit nicht angebunden (keine zulässige öffentliche Schnittstelle bekannt).",
      ],
      fetchedAt: new Date(),
    };
  }
}
