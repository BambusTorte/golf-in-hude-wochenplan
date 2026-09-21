import Link from "next/link";
import type { PlanStatus } from "@prisma/client";
import { listPlans } from "@/lib/plan/service";
import { formatWeekRange, getWeekRange } from "@/lib/week/isoWeek";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wochenpläne" };

const STATUS_FILTERS: { label: string; value?: PlanStatus }[] = [
  { label: "Alle" },
  { label: "Entwürfe", value: "DRAFT" },
  { label: "Zur Prüfung", value: "REVIEW" },
  { label: "Veröffentlicht", value: "PUBLISHED" },
  { label: "Archiviert", value: "ARCHIVED" },
];

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const status = (
    ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"].includes(sp.status ?? "")
      ? sp.status
      : undefined
  ) as PlanStatus | undefined;
  const year = sp.year ? Number(sp.year) : undefined;

  const plans = await listPlans({ status, year });

  return (
    <div className="space-y-6">
      <div>
        <p className="label-eyebrow !text-accent-400">Verwaltung</p>
        <h1 className="text-3xl font-extrabold text-white">Wochenpläne</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = status === f.value || (!status && !f.value);
          const href = f.value ? `/admin/plans?status=${f.value}` : "/admin/plans";
          return (
            <Link
              key={f.label}
              href={href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                active
                  ? "bg-accent-500 text-brand-900"
                  : "bg-white/10 text-white/80 hover:bg-white/20",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-ink-muted">
              Keine Wochenpläne gefunden. Erstelle einen über das{" "}
              <Link href="/admin/dashboard" className="font-semibold text-brand-600">
                Dashboard
              </Link>
              .
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-brand-50">
            {plans.map((plan) => (
              <li key={plan.id}>
                <Link
                  href={`/admin/plans/${plan.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition hover:bg-brand-50/50"
                >
                  <span className="badge-tile min-w-[3.5rem] flex-col !py-1.5 text-center leading-tight">
                    <span className="text-[0.6rem] opacity-80">KW</span>
                    <span className="text-lg">{plan.isoWeek}</span>
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold text-ink">
                      {formatWeekRange(getWeekRange(plan.year, plan.isoWeek))}
                    </span>
                    <span className="block text-sm text-ink-muted">
                      {plan.year} · {plan._count.events} Termine
                    </span>
                  </span>
                  <StatusBadge status={plan.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
