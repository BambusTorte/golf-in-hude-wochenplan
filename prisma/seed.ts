/**
 * Seed: legt einen realistischen ENTWURF-Wochenplan (KW40/2026) an – die Daten
 * entsprechen der realen Vorlage. Es wird KEIN Admin angelegt (das übernimmt die
 * Ersteinrichtung unter /admin/setup). Idempotent dank Upsert auf (Jahr, KW).
 */
import { generateWeeklyPlan } from "../src/lib/plan/generate";
import { berlinDayInstant } from "../src/lib/week/isoWeek";
import type { RawGolfEvent } from "../src/lib/providers/types";

const events: RawGolfEvent[] = [
  { externalId: "seed-1", date: berlinDayInstant(2026, 9, 28), startTime: "09:50", title: "Mogos", courseRaw: "1-18 Nordsee", holes: 18, source: "MANUAL" },
  { externalId: "seed-2", date: berlinDayInstant(2026, 9, 29), startTime: "11:00", title: "Damengolf", courseRaw: "1-18 Nordsee", holes: 18, handicapRelevant: true, maxParticipants: 36, freeOnline: 6, source: "MANUAL" },
  { externalId: "seed-3", date: berlinDayInstant(2026, 9, 30), startTime: "15:00", title: "Herrengolf", courseRaw: "1-18 Nordsee", holes: 18, handicapRelevant: true, maxParticipants: 48, freeOnline: 18, source: "MANUAL" },
  { externalId: "seed-4", date: berlinDayInstant(2026, 9, 30), startTime: "17:00", title: "Afterwork", courseRaw: "1-9 Nordsee", holes: 9, handicapRelevant: true, maxParticipants: 45, freeOnline: 15, source: "MANUAL" },
  { externalId: "seed-5", date: berlinDayInstant(2026, 10, 1), startTime: "10:00", title: "Happy Oldies", courseRaw: "1-9 Nordsee", holes: 9, handicapRelevant: false, maxParticipants: 40, freeOnline: 16, source: "MANUAL" },
  { externalId: "seed-6", date: berlinDayInstant(2026, 10, 2), startTime: "10:00", title: "Afterwork Finale", courseRaw: "1-18 Weserplatz", holes: 18, handicapRelevant: true, maxParticipants: 40, freeOnline: 10, source: "MANUAL" },
  { externalId: "seed-7", date: berlinDayInstant(2026, 10, 3), startTime: "10:00", title: "Monatscup + Matchplay Finale", courseRaw: "1-18 Nordsee", holes: 18, tee: "Kanonenstart", handicapRelevant: true, maxParticipants: 80, freeOnline: 44, source: "MANUAL" },
];

async function main() {
  const res = await generateWeeklyPlan({ year: 2026, week: 40, manualEvents: events });
  console.log(`Seed fertig: KW40/2026 als ENTWURF mit ${res.eventsImported} Terminen.`);
  console.log("Nächster Schritt: /admin/setup öffnen und Admin einrichten.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/db");
    await prisma.$disconnect();
  });
