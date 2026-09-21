import type { PlanEvent } from "@prisma/client";
import { WEEKDAY_LABELS_DE } from "@/lib/week/isoWeek";
import { PLAY_TYPE_SHORT, PLAY_TYPE_LEGEND } from "@/lib/plan/labels";

const DASH = "–";

function group(events: PlanEvent[]) {
  return WEEKDAY_LABELS_DE.map((label, weekday) => ({
    label,
    weekday,
    events: events
      .filter((e) => e.weekday === weekday)
      .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? "")),
  }));
}

function val(v: string | number | null | undefined): string {
  return v === null || v === undefined || v === "" ? DASH : String(v);
}

function playType(e: PlanEvent): string {
  return e.playType ? PLAY_TYPE_SHORT[e.playType] : "";
}

export function WochenplanTable({ events }: { events: PlanEvent[] }) {
  const days = group(events);

  return (
    <div>
      {/* Desktop / Tablet: Tabelle */}
      <div className="hidden overflow-hidden rounded-card border border-brand-100 bg-white md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-brand-700 text-left text-white">
              <th className="px-3 py-3 font-semibold">Wochentag</th>
              <th className="px-3 py-3 font-semibold">Turnier / Event</th>
              <th className="px-3 py-3 font-semibold">Platz</th>
              <th className="px-3 py-3 text-center font-semibold">Startzeit</th>
              <th className="px-3 py-3 text-center font-semibold">Löcher</th>
              <th className="px-3 py-3 text-center font-semibold">Tee</th>
              <th className="px-3 py-3 text-center font-semibold">TN</th>
              <th className="px-3 py-3 font-semibold">Spielart</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) =>
              day.events.length === 0 ? (
                <tr key={day.weekday} className="border-t border-brand-50">
                  <td className="px-3 py-3 font-semibold text-brand-800">
                    {day.label}
                  </td>
                  <td className="px-3 py-3 italic text-ink-soft" colSpan={7}>
                    keine Veranstaltung
                  </td>
                </tr>
              ) : (
                day.events.map((e, i) => (
                  <tr
                    key={e.id}
                    className="border-t border-brand-50 align-top even:bg-brand-50/40"
                  >
                    <td className="px-3 py-3 font-semibold text-brand-800">
                      {i === 0 ? day.label : ""}
                    </td>
                    <td className="px-3 py-3 font-semibold text-ink">{e.title}</td>
                    <td className="px-3 py-3">{val(e.course)}</td>
                    <td className="px-3 py-3 text-center">{val(e.startTime)}</td>
                    <td className="px-3 py-3 text-center">{val(e.holes)}</td>
                    <td className="px-3 py-3 text-center">{val(e.tee)}</td>
                    <td className="px-3 py-3 text-center">{val(e.participantsEstimate)}</td>
                    <td className="px-3 py-3">{playType(e)}</td>
                  </tr>
                ))
              ),
            )}
          </tbody>
        </table>
      </div>

      {/* Mobil: Karten je Tag */}
      <div className="space-y-3 md:hidden">
        {days.map((day) => (
          <div
            key={day.weekday}
            className="overflow-hidden rounded-card border border-brand-100 bg-white"
          >
            <div className="bg-brand-700 px-4 py-2 font-semibold text-white">
              {day.label}
            </div>
            {day.events.length === 0 ? (
              <p className="px-4 py-3 text-sm italic text-ink-soft">
                keine Veranstaltung
              </p>
            ) : (
              <ul className="divide-y divide-brand-50">
                {day.events.map((e) => (
                  <li key={e.id} className="px-4 py-3">
                    <p className="font-semibold text-ink">{e.title}</p>
                    <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-ink-muted">
                      <div>
                        <dt className="inline text-ink-soft">Platz: </dt>
                        <dd className="inline">{val(e.course)}</dd>
                      </div>
                      <div>
                        <dt className="inline text-ink-soft">Startzeit: </dt>
                        <dd className="inline">{val(e.startTime)}</dd>
                      </div>
                      <div>
                        <dt className="inline text-ink-soft">Löcher: </dt>
                        <dd className="inline">{val(e.holes)}</dd>
                      </div>
                      <div>
                        <dt className="inline text-ink-soft">Tee: </dt>
                        <dd className="inline">{val(e.tee)}</dd>
                      </div>
                      <div>
                        <dt className="inline text-ink-soft">TN: </dt>
                        <dd className="inline">{val(e.participantsEstimate)}</dd>
                      </div>
                      <div>
                        <dt className="inline text-ink-soft">Spielart: </dt>
                        <dd className="inline">{playType(e) || DASH}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-white/60 md:text-ink-soft">
        {PLAY_TYPE_LEGEND} · Änderungen vorbehalten!
      </p>
    </div>
  );
}
