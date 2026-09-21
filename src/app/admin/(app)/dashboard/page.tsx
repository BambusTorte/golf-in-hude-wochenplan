import Link from "next/link";
import { getDashboardStats } from "@/lib/plan/service";
import { getCurrentWeek, formatWeekRange, getWeekRange } from "@/lib/week/isoWeek";
import { GenerateForm } from "@/components/admin/GenerateForm";
import { Card, CardBody } from "@/components/ui/Card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

const STATUS_TILES = [
  { key: "draft", label: "Entwürfe", href: "/admin/plans?status=DRAFT", tone: "bg-amber-100 text-amber-800" },
  { key: "review", label: "Zur Prüfung", href: "/admin/plans?status=REVIEW", tone: "bg-sky-100 text-sky-800" },
  { key: "published", label: "Veröffentlicht", href: "/admin/plans?status=PUBLISHED", tone: "bg-accent-300/40 text-brand-800" },
  { key: "archived", label: "Archiviert", href: "/admin/plans?status=ARCHIVED", tone: "bg-slate-200 text-slate-600" },
] as const;

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const current = getCurrentWeek();
  const range = getWeekRange(current.year, current.week);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <p className="label-eyebrow !text-accent-400">Übersicht</p>
        <h1 className="text-3xl font-extrabold text-white">Dashboard</h1>
        <p className="text-white/70">
          Aktuelle Kalenderwoche: <strong className="text-white">KW {current.week}/{current.year}</strong>{" "}
          ({formatWeekRange(range)})
        </p>
      </div>

      {/* Statuszähler */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUS_TILES.map((t) => (
          <Link key={t.key} href={t.href} className="focus-ring rounded-card">
            <Card className="transition hover:shadow-card-lg">
              <CardBody>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${t.tone}`}>
                  {t.label}
                </span>
                <p className="mt-3 text-3xl font-extrabold text-ink">
                  {stats[t.key]}
                </p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* Generierung */}
      <Card>
        <CardBody>
          <h2 className="text-lg font-bold text-ink">Wochenplan erstellen</h2>
          <p className="mb-4 mt-1 text-sm text-ink-muted">
            Erzeugt einen Entwurf aus der PC-CADDIE-Datenquelle. Automatisch
            erstellte Pläne werden <strong>niemals</strong> automatisch veröffentlicht.
          </p>
          <GenerateForm defaultYear={current.year} defaultWeek={current.week} />
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Importläufe */}
        <Card>
          <CardBody>
            <h2 className="mb-3 text-lg font-bold text-ink">Letzte Importläufe</h2>
            {stats.imports.length === 0 ? (
              <p className="text-sm text-ink-muted">Noch keine Importläufe.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {stats.imports.map((run) => (
                  <li
                    key={run.id}
                    className="flex items-center justify-between gap-3 border-b border-brand-50 pb-2 last:border-0"
                  >
                    <span className="text-ink">
                      KW {run.week}/{run.year} · {run.provider}
                    </span>
                    <span
                      className={
                        run.status === "SUCCESS"
                          ? "font-semibold text-brand-600"
                          : run.status === "FAILED"
                            ? "font-semibold text-red-600"
                            : "text-ink-muted"
                      }
                    >
                      {run.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Fehler */}
        <Card>
          <CardBody>
            <h2 className="mb-3 text-lg font-bold text-ink">Letzte Fehler</h2>
            {stats.errors.length === 0 ? (
              <p className="text-sm text-ink-muted">Keine Fehler protokolliert.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {stats.errors.map((e) => (
                  <li key={e.id} className="border-b border-brand-50 pb-2 last:border-0">
                    <span className="font-semibold text-red-600">{e.scope}</span>
                    <span className="ml-2 text-ink-muted">{e.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <p className="text-sm text-white/60">
        Datenquelle: PC CADDIE (HTML) mit ICS-Fallback · Zeitzone Europe/Berlin
      </p>
    </div>
  );
}
