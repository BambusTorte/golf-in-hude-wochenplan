import type { GolfDataProvider, ProviderResult, RawGolfEvent } from "./types";

/**
 * Manueller Import als vollwertiger Fallback. Wird mit bereits erfassten
 * Events initialisiert (z. B. aus dem Admin-Formular) und gibt sie – nach
 * Wochenfilter – unverändert zurück. Funktioniert immer, auch ohne externe
 * Datenquelle.
 */
export class ManualImportProvider implements GolfDataProvider {
  key = "manual";
  label = "Manuelle Erfassung";

  constructor(private events: RawGolfEvent[] = []) {}

  async getEventsForWeek(): Promise<ProviderResult> {
    return {
      providerKey: this.key,
      events: this.events.map((e) => ({ ...e, source: "MANUAL" })),
      warnings: [],
      fetchedAt: new Date(),
    };
  }
}
