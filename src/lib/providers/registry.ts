import type { GolfDataProvider, ProviderResult } from "./types";
import { PccaddieHtmlProvider } from "./pccaddieHtml";
import { PccaddieIcsProvider } from "./pccaddieIcs";
import { CampoProvider } from "./campo";

export const PROVIDER_KEYS = {
  pccaddieHtml: "pccaddie-html",
  pccaddieIcs: "pccaddie-ics",
  campo: "campo",
  manual: "manual",
} as const;

export function createProvider(key: string): GolfDataProvider {
  switch (key) {
    case PROVIDER_KEYS.pccaddieHtml:
      return new PccaddieHtmlProvider();
    case PROVIDER_KEYS.pccaddieIcs:
      return new PccaddieIcsProvider();
    case PROVIDER_KEYS.campo:
      return new CampoProvider();
    default:
      throw new Error(`Unbekannter Provider: ${key}`);
  }
}

export interface WeekFetchResult extends ProviderResult {
  /** True, wenn auf den ICS-Fallback zurückgegriffen wurde. */
  usedFallback: boolean;
}

/**
 * Holt die Events einer Woche mit Fallback-Kette:
 *   1. PC-CADDIE HTML (reichhaltigste Daten)
 *   2. PC-CADDIE ICS (offizieller Export) als Fallback bei Fehler/Leerergebnis
 * Fehler werden nicht verschluckt, sondern als Warnungen weitergereicht.
 */
export async function fetchWeekWithFallback(
  year: number,
  week: number,
): Promise<WeekFetchResult> {
  const warnings: string[] = [];
  const html = new PccaddieHtmlProvider();

  try {
    const res = await html.getEventsForWeek(year, week);
    if (res.events.length > 0) {
      return { ...res, usedFallback: false };
    }
    warnings.push(...res.warnings);
  } catch (err) {
    warnings.push(
      `PC-CADDIE HTML nicht verfügbar: ${
        err instanceof Error ? err.message : String(err)
      }. Versuche ICS-Export.`,
    );
  }

  // Fallback: ICS
  try {
    const ics = new PccaddieIcsProvider();
    const res = await ics.getEventsForWeek(year, week);
    return {
      ...res,
      warnings: [...warnings, ...res.warnings],
      usedFallback: true,
    };
  } catch (err) {
    warnings.push(
      `ICS-Export ebenfalls nicht verfügbar: ${
        err instanceof Error ? err.message : String(err)
      }.`,
    );
    return {
      providerKey: "none",
      events: [],
      warnings,
      fetchedAt: new Date(),
      usedFallback: true,
    };
  }
}
