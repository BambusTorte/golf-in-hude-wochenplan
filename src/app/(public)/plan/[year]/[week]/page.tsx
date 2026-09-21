import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPlan } from "@/lib/plan/service";
import { WochenplanTable } from "@/components/plan/WochenplanTable";
import { PlanPdfActions } from "@/components/plan/PlanPdfActions";

export const dynamic = "force-dynamic";

export default async function PublicPlanDetail({
  params,
}: {
  params: Promise<{ year: string; week: string }>;
}) {
  const { year, week } = await params;
  const plan = await getPublishedPlan(Number(year), Number(week));
  if (!plan) notFound();

  return (
    <div className="py-8">
      <div className="mb-6 no-print">
        <Link href="/plan" className="text-sm font-semibold text-accent-400 hover:text-accent-300">
          ← Alle Wochenpläne
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label-eyebrow !text-accent-400">
            Kalenderwoche {plan.isoWeek} · {plan.year}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-white">{plan.title}</h1>
          {plan.subtitle ? <p className="mt-1 text-white/70">{plan.subtitle}</p> : null}
        </div>
        <PlanPdfActions planId={plan.id} />
      </div>

      <WochenplanTable events={plan.events} />
    </div>
  );
}
