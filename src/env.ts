import { z } from "zod";

/**
 * Zentrale, Zod-validierte Umgebungsvariablen.
 * Server-Variablen werden nur serverseitig gelesen. Ein fehlender Pflichtwert
 * führt beim ersten Zugriff zu einem klaren Fehler statt zu stillem Fehlverhalten.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL fehlt"),
  ADMIN_SETUP_KEY: z.string().min(8, "ADMIN_SETUP_KEY muss mind. 8 Zeichen haben"),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET muss mind. 16 Zeichen haben"),
  APP_TIMEZONE: z.string().default("Europe/Berlin"),
  STORAGE_DRIVER: z.enum(["local", "netlify-blobs"]).default("local"),
  LOCAL_STORAGE_DIR: z.string().default("./storage"),
  PCCADDIE_CALENDAR_URL: z
    .string()
    .url()
    .default("https://www.pccaddie.net/clubs/0493369/app.php?cat=ts_calendar"),
  PCCADDIE_ICS_URL: z
    .string()
    .url()
    .default(
      "https://www.golfcloud.com/clubs/0493369/app.php?cat=ts_calendar&sub=ics&openext=yes",
    ),
  CRON_SECRET: z.string().min(8).default("dev-cron-secret-change-me"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Ungültige Umgebungsvariablen:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Öffentliche (clientseitig verfügbare) Konfiguration – niemals Secrets. */
export const publicConfig = {
  // "||" statt "??": auch ein leerer String fällt auf den Standard zurück
  // (verhindert `new URL("")`-Fehler im Build, wenn die Variable leer ist).
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL || "https://golf-in-hude-wochenplan.vercel.app",
  clubName: "Golf in Hude e. V.",
  claim: "Golf. In Hude!",
  website: "www.golfinhude.de",
};
