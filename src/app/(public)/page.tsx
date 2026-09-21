import Link from "next/link";
import { getCurrentPublishedPlan } from "@/lib/plan/service";
import { WochenplanTable } from "@/components/plan/WochenplanTable";
import { PlanPdfActions } from "@/components/plan/PlanPdfActions";
import { Card, CardBody } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const plan = await getCurrentPublishedPlan();

  if (!plan) {
    return (
      <div className="py-16">
        <Card className="mx-auto max-w-xl text-center">
          <CardBody>
            <p className="label-eyebrow">Wochenplan</p>
            <h1 className="mt-2 text-2xl font-extrabold text-ink">
              Zurzeit ist kein Wochenplan veröffentlicht
            </h1>
            <p className="mt-3 text-ink-muted">
              Sobald der aktuelle Wochenplan freigegeben wurde, erscheint er hier –
              mit allen Turnieren und Veranstaltungen der Woche sowie als PDF zum
              Download.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label-eyebrow !text-accent-400">
            Kalenderwoche {plan.isoWeek} · {plan.year}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-white">{plan.title}</h1>
          {plan.subtitle ? (
            <p className="mt-1 text-white/70">{plan.subtitle}</p>
          ) : null}
        </div>
        <PlanPdfActions planId={plan.id} />
      </div>

      <WochenplanTable events={plan.events} />

      <div className="mt-6 no-print">
        <ButtonLink href="/plan" variant="secondary" size="sm">
          Alle veröffentlichten Wochen ansehen
        </ButtonLink>
      </div>
    </div>
  );
}
