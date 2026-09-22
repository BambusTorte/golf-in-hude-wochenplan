"use client";

import { useActionState, useState } from "react";
import {
  saveSeriesAction,
  deleteSeriesAction,
  toggleSeriesAction,
  type ActionState,
} from "@/app/admin/actions";
import { PLAY_TYPE_OPTIONS, PLAY_TYPE_SHORT } from "@/lib/plan/labels";
import { WEEKDAY_LABELS_DE } from "@/lib/week/isoWeek";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FieldError } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

export interface EditableSeries {
  id: string;
  title: string;
  weekday: number;
  startTime: string;
  course: string;
  holes: string;
  tee: string;
  participantsEstimate: string;
  playType: string;
  active: boolean;
  eventCount: number;
}

function SeriesForm({
  series,
  onDone,
}: {
  series?: EditableSeries;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveSeriesAction,
    {},
  );

  return (
    <form action={action} className="grid gap-3 rounded-xl bg-brand-50/60 p-4 sm:grid-cols-2">
      {series ? <input type="hidden" name="seriesId" value={series.id} /> : null}
      <div className="sm:col-span-2">
        <Label htmlFor="title">Titel</Label>
        <Input id="title" name="title" defaultValue={series?.title} required placeholder="z. B. Mogos" />
      </div>
      <div>
        <Label htmlFor="weekday">Wochentag</Label>
        <Select id="weekday" name="weekday" defaultValue={series ? String(series.weekday) : "0"}>
          {WEEKDAY_LABELS_DE.map((label, i) => (
            <option key={i} value={i}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="startTime">Startzeit</Label>
        <Input id="startTime" name="startTime" type="time" defaultValue={series?.startTime} />
      </div>
      <div>
        <Label htmlFor="course">Platz</Label>
        <Input id="course" name="course" list="series-course" defaultValue={series?.course} placeholder="Nordseeplatz" />
        <datalist id="series-course">
          <option value="Nordseeplatz" />
          <option value="Weserplatz" />
        </datalist>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="holes">Löcher</Label>
          <Input id="holes" name="holes" type="number" min={0} max={72} defaultValue={series?.holes} />
        </div>
        <div>
          <Label htmlFor="tee">Tee</Label>
          <Input id="tee" name="tee" defaultValue={series?.tee} placeholder="1 / Kanonenstart" />
        </div>
      </div>
      <div>
        <Label htmlFor="participantsEstimate">TN (Schätzung)</Label>
        <Input id="participantsEstimate" name="participantsEstimate" defaultValue={series?.participantsEstimate} placeholder="ca. 15" />
      </div>
      <div>
        <Label htmlFor="playType">Spielart</Label>
        <Select id="playType" name="playType" defaultValue={series?.playType ?? ""}>
          <option value="">– keine –</option>
          {PLAY_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {PLAY_TYPE_SHORT[o.value]} — {o.label}
            </option>
          ))}
        </Select>
      </div>
      <label className="flex items-center gap-2 sm:col-span-2">
        <input type="checkbox" name="active" defaultChecked={series ? series.active : true} className="h-4 w-4" />
        <span className="text-sm text-ink">Aktiv (wird bei der Wochenplan-Erstellung eingetragen)</span>
      </label>

      {state.error ? (
        <div className="sm:col-span-2">
          <FieldError>{state.error}</FieldError>
        </div>
      ) : null}

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Speichern …" : "Speichern"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}

export function SeriesManager({ series }: { series: EditableSeries[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">Turnierserien</h2>
        {!adding ? (
          <Button size="sm" onClick={() => { setAdding(true); setEditing(null); }}>
            + Serie hinzufügen
          </Button>
        ) : null}
      </div>
      <p className="text-sm text-ink-muted">
        Wiederkehrende Termine (z. B. „Montags Mogos"). Aktive Serien werden bei
        jeder Wochenplan-Erstellung automatisch eingetragen. Einzelne Wochen kannst
        du danach im jeweiligen Wochenplan bearbeiten – deine Änderung bleibt erhalten.
      </p>

      {adding ? <SeriesForm onDone={() => setAdding(false)} /> : null}

      {series.length === 0 && !adding ? (
        <p className="text-sm text-ink-muted">Noch keine Serien angelegt.</p>
      ) : null}

      <ul className="divide-y divide-brand-50">
        {series.map((s) => (
          <li key={s.id} className="py-3">
            {editing === s.id ? (
              <SeriesForm series={s} onDone={() => setEditing(null)} />
            ) : (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="w-24 shrink-0 text-sm font-semibold text-brand-800">
                  {WEEKDAY_LABELS_DE[s.weekday]}
                </span>
                <span className="w-14 shrink-0 text-sm text-ink-muted">{s.startTime || "–"}</span>
                <span className="flex-1 font-semibold text-ink">{s.title}</span>
                <span className="text-sm text-ink-muted">
                  {s.course || "–"}
                  {s.playType ? ` · ${PLAY_TYPE_SHORT[s.playType as keyof typeof PLAY_TYPE_SHORT]}` : ""}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    s.active ? "bg-accent-300/40 text-brand-800" : "bg-slate-200 text-slate-600",
                  )}
                >
                  {s.active ? "aktiv" : "inaktiv"}
                </span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(s.id); setAdding(false); }}>
                    Bearbeiten
                  </Button>
                  <form action={toggleSeriesAction}>
                    <input type="hidden" name="seriesId" value={s.id} />
                    <input type="hidden" name="active" value={s.active ? "0" : "1"} />
                    <button type="submit" className="rounded-full px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                      {s.active ? "Deaktivieren" : "Aktivieren"}
                    </button>
                  </form>
                  <form
                    action={deleteSeriesAction}
                    onSubmit={(ev) => {
                      if (!confirm(`Serie „${s.title}" löschen? Bereits erstellte Termine bleiben erhalten.`)) ev.preventDefault();
                    }}
                  >
                    <input type="hidden" name="seriesId" value={s.id} />
                    <button type="submit" className="rounded-full px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50">
                      Löschen
                    </button>
                  </form>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
