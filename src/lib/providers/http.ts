/**
 * Behutsames HTTP-Fetch für externe Datenquellen:
 * - Timeout via AbortController
 * - begrenzte Retries mit exponentiellem Backoff
 * - fester, ehrlicher User-Agent
 * - keine aggressiven Parallelabrufe
 */
const USER_AGENT =
  "GolfInHudeWochenplan/1.0 (+https://www.golfinhude.de; Kontakt über Golfclub Hude)";

export interface FetchTextOptions {
  timeoutMs?: number;
  retries?: number;
  accept?: string;
}

export async function fetchText(
  url: string,
  { timeoutMs = 15000, retries = 2, accept = "text/html" }: FetchTextOptions = {},
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT, Accept: accept },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText} für ${url}`);
      }
      return await res.text();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const backoff = 500 * 2 ** attempt;
        await new Promise((r) => setTimeout(r, backoff));
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(
    `Datenquelle nicht erreichbar (${url}): ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}
