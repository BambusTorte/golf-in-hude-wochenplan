import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlanWithEvents, getCurrentPdf } from "@/lib/plan/service";
import {
  getWeekRange,
  formatWeekRange,
  berlinYmdStr,
} from "@/lib/week/isoWeek";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PlanPdfActions } from "@/components/plan/PlanPdfActions";
import { WochenplanTable } from "@/components/plan/WochenplanTable";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { EventsManager, type EditableEvent } from "@/components/admin/EventsManager";
import {
  publishAction,
  unpublishAction,
  setStatusAction,
  deletePlanAction,
  regenerateAction,
  renderPdfAction,
  applySeriesAction,
} from "@/app/admin/actions";

export const dynamic = "force-dynamic";

function InlineForm({
  action,
  fields,
  label,
  variant = "secondary",
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  label: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <form action={action}>
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <Button type="submit" size="sm" variant={variant}>
        {label}
      </Button>
    </form>
  );
}

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plan = await getPlanWithEvents(id);
  if (!plan) notFound();

  const range = getWeekRange(plan.year, plan.isoWeek);
  const weekStart = berlinYmdStr(range.start);
  const weekEnd = berlinYmdStr(range.end);
  const pdf = await getCurrentPdf(plan.id);
  const warnings = Array.isArray(plan.warnings) ? (plan.warnings as string[]) : [];
  const sourceInfo = (plan.sourceInfo ?? {}) as Record<string, unknown>;

  const editable: EditableEvent[] = plan.events.map((e) => ({
    id: e.id,
    weekday: e.weekday,
    title: e.title,
    date: berlinYmdStr(e.date),
    startTime: e.startTime ?? "",
    course: e.course ?? "",
    holes: e.holes != null ? String(e.holes) : "",
    tee: e.tee ?? "",
    participantsEstimate: e.participantsEstimate ?? "",
    playType: e.playType ?? "",
    format: e.format ?? "",
    origin: e.origin,
    source: e.source,
    fromSeries: e.seriesId != null,
  }));

  const pid = { planId: plan.id };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/plans"
          className="text-sm font-semibold text-accent-400 hover:text-accent-300"
        >
          ← Alle Wochenpläne
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white">
              KW {plan.isoWeek}/{plan.year}
            </h1>
            <StatusBadge status={plan.status} />
          </div>
          <p className="mt-1 text-white/70">
            {formatWeekRange(range)}
            {plan.subtitle ? ` · ${plan.subtitle}` : ""}
          </p>
        </div>
        {pdf ? <PlanPdfActions planId={plan.id} /> : null}
      </div>

      {/* Aktionen */}
      <Card>
        <CardBody className="flex flex-wrap items-center gap-2">
          <InlineForm action={regenerateAction} fields={pid} label="Neu generieren" />
          <InlineForm action={applySeriesAction} fields={pid} label="Serien anwenden" />
          <InlineForm action={renderPdfAction} fields={pid} label="PDF neu erzeugen" />

          {plan.status === "DRAFT" ? (
            <InlineForm
              action={setStatusAction}
              fields={{ ...pid, status: "REVIEW" }}
              label="Zur Prüfung geben"
            />
          ) : null}
          {plan.status === "REVIEW" ? (
            <InlineForm
              action={setStatusAction}
              fields={{ ...pid, status: "DRAFT" }}
              label="Zurück zu Entwurf"
              variant="ghost"
            />
          ) : null}

          {plan.status === "DRAFT" || plan.status === "REVIEW" ? (
            <ConfirmSubmit
              action={publishAction}
              fields={pid}
              label="Veröffentlichen"
              title={`KW ${plan.isoWeek}/${plan.year} veröffentlichen?`}
              confirmLabel="Jetzt veröffentlichen"
            >
              <p className="mb-2">
                Zeitraum: <strong>{formatWeekRange(range)}</strong> · {plan.events.length}{" "}
                Termine. Nach der Veröffentlichung ist der Plan öffentlich sichtbar und die
                PDF wird neu erzeugt.
              </p>
              {warnings.length > 0 ? (
                <div className="rounded-lg bg-amber-50 p-3 text-amber-800">
                  <p className="font-semibold">Hinweise ({warnings.length}):</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {warnings.slice(0, 8).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-brand-600">Keine offenen Warnungen.</p>
              )}
            </ConfirmSubmit>
          ) : null}

          {plan.status === "PUBLISHED" ? (
            <ConfirmSubmit
              action={unpublishAction}
              fields={pid}
              label="Veröffentlichung zurücknehmen"
              title="Veröffentlichung zurücknehmen?"
              confirmLabel="Zurücknehmen"
            >
              <p>
                Der Plan ist danach öffentlich nicht mehr sichtbar und wechselt zurück in
                den Status „Zur Prüfung“.
              </p>
            </ConfirmSubmit>
          ) : null}

          {plan.status !== "ARCHIVED" ? (
            <InlineForm
              action={setStatusAction}
              fields={{ ...pid, status: "ARCHIVED" }}
              label="Archivieren"
              variant="ghost"
            />
          ) : (
            <InlineForm
              action={setStatusAction}
              fields={{ ...pid, status: "DRAFT" }}
              label="Reaktivieren"
              variant="ghost"
            />
          )}

          <ConfirmSubmit
            action={deletePlanAction}
            fields={pid}
            label="Löschen"
            title="Wochenplan löschen?"
            confirmLabel="Endgültig löschen"
            variant="danger"
          >
            <p>Der Wochenplan und alle zugehörigen Termine werden unwiderruflich gelöscht.</p>
          </ConfirmSubmit>
        </CardBody>
      </Card>

      {/* Warnungen */}
      {warnings.length > 0 ? (
        <Card>
          <CardBody>
            <h2 className="text-lg font-bold text-ink">
              Warnungen &amp; Hinweise ({warnings.length})
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}

      {/* Termine bearbeiten */}
      <Card>
        <CardBody>
          <EventsManager
            planId={plan.id}
            events={editable}
            weekStart={weekStart}
            weekEnd={weekEnd}
          />
        </CardBody>
      </Card>

      {/* Vorschau */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-white">Vorschau</h2>
        <WochenplanTable events={plan.events} />
      </div>

      {sourceInfo.provider ? (
        <p className="text-xs text-white/50">
          Datenquelle: {String(sourceInfo.provider)}
          {sourceInfo.usedFallback ? " (ICS-Fallback)" : ""}
          {sourceInfo.fetchedAt
            ? ` · Stand: ${new Date(String(sourceInfo.fetchedAt)).toLocaleString("de-DE")}`
            : ""}
        </p>
      ) : null}
    </div>
  );
}
