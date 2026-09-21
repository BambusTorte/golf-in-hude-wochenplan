/**
 * Manuelle Generierung eines Wochenplans (Entwurf) aus der PC-CADDIE-Quelle.
 *
 * Nutzung:
 *   npm run generate:week -- <jahr> <kw>
 *   npm run generate:week           (aktuelle Kalenderwoche)
 */
import { generateWeeklyPlan } from "../src/lib/plan/generate";
import { getCurrentWeek } from "../src/lib/week/isoWeek";

async function main() {
  const [yearArg, weekArg] = process.argv.slice(2);
  const current = getCurrentWeek();
  const year = yearArg ? Number(yearArg) : current.year;
  const week = weekArg ? Number(weekArg) : current.week;

  console.log(`Generiere KW ${week}/${year} …`);
  const res = await generateWeeklyPlan({ year, week });
  console.log(
    `Fertig: Status ${res.status}, ${res.eventsImported} Termine importiert.`,
  );
  if (res.warnings.length) {
    console.log("Warnungen:");
    for (const w of res.warnings) console.log(" -", w);
  }
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
