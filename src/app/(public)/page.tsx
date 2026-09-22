import Link from "next/link";
import { listPublishedPlans } from "@/lib/plan/service";
import { formatWeekRange, getWeekRange } from "@/lib/week/isoWeek";
import { Card, CardBody } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const plans = await listPublishedPlans();

  return (
    <div className="py-8">
      <p className="label-eyebrow !text-accent-400">Übersicht</p>
      <h1 className="mt-1 text-3xl font-extrabold text-white">
        Veröffentlichte Wochenpläne
      </h1>
      <p className="mt-1 text-white/70">
        Wähle eine Kalenderwoche, um den Wochenplan anzusehen oder als PDF zu öffnen.
      </p>

      {plans.length === 0 ? (
        <Card className="mt-6 max-w-xl">
          <CardBody>
            <p className="text-ink-muted">
              Es wurde noch kein Wochenplan veröffentlicht. Schau bald wieder vorbei.
            </p>
          </CardBody>
        </Card>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <li key={plan.id}>
              <Link
                href={`/plan/${plan.year}/${plan.isoWeek}`}
                className="block focus-ring rounded-card"
              >
                <Card className="transition hover:shadow-card-lg">
                  <CardBody className="flex items-center gap-4">
                    <span className="badge-tile min-w-[3.5rem] flex-col !py-2 text-center leading-tight">
                      <span className="text-[0.6rem] font-semibold opacity-80">KW</span>
                      <span className="text-lg">{plan.isoWeek}</span>
                    </span>
                    <span>
                      <span className="block font-bold text-ink">
                        {formatWeekRange(getWeekRange(plan.year, plan.isoWeek))}
                      </span>
                      <span className="block text-sm text-ink-muted">
                        {plan.year}
                        {plan.subtitle ? ` · ${plan.subtitle}` : ""}
                      </span>
                    </span>
                  </CardBody>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
