/**
 * Netlify Scheduled Function: ruft täglich den geschützten Generierungs-Endpoint
 * auf. Die Pläne werden als ENTWURF erzeugt und nie automatisch veröffentlicht.
 *
 * Der Zeitplan ist in `netlify.toml` gesetzt (05:00 UTC). Netlify-Cron läuft in
 * UTC; die fachliche KW-Logik selbst rechnet in Europe/Berlin.
 */
export default async function handler() {
  const base = process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const secret = process.env.CRON_SECRET ?? "";
  if (!base) {
    console.error("Scheduled generate: keine Basis-URL (URL) gesetzt.");
    return;
  }
  try {
    const res = await fetch(`${base}/api/cron/generate`, {
      method: "POST",
      headers: { "x-cron-secret": secret },
    });
    const body = await res.text();
    console.log("Scheduled generate:", res.status, body.slice(0, 500));
  } catch (err) {
    console.error("Scheduled generate fehlgeschlagen:", err);
  }
}

// Zeitplan zusätzlich hier deklariert (identisch zu netlify.toml).
export const config = {
  schedule: "0 5 * * *",
};
