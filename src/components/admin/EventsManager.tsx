"use client";

import { useActionState, useState } from "react";
import {
  saveEventAction,
  deleteEventAction,
  type ActionState,
} from "@/app/admin/actions";
import { PLAY_TYPE_OPTIONS, PLAY_TYPE_SHORT } from "@/lib/plan/labels";
import { WEEKDAY_LABELS_DE } from "@/lib/week/isoWeek";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FieldError } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

export interface EditableEvent {
  id: string;
  weekday: number;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  course: string;
  holes: string;
  tee: string;
  participantsEstimate: string;
  playType: string;
  format: string;
  origin: string;
  source: string;
  fromSeries?: boolean;
}

function EventForm({
  planId,
  weekStart,
  weekEnd,
  event,
  onDone,
}: {
  planId: string;
  weekStart: string;
  weekEnd: string;
  event?: EditableEvent;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveEventAction,
    {},
  );

  return (
    <form action={action} className="grid gap-3 rounded-xl bg-brand-50/60 p-4 sm:grid-cols-2">
      <input type="hidden" name="planId" value={planId} />
      {event ? <input type="hidden" name="eventId" value={event.id} /> : null}

      <div className="sm:col-span-2">
        <Label htmlFor="title">Turnier / Event</Label>
        <Input id="title" name="title" defaultValue={event?.title} required />
      </div>
      <div>
        <Label htmlFor="date">Datum</Label>
        <Input
          id="date"
          name="date"
          type="date"
          min={weekStart}
          max={weekEnd}
          defaultValue={event?.date ?? weekStart}
          required
        />
      </div>
      <div>
        <Label htmlFor="startTime">Startzeit</Label>
        <Input id="startTime" name="startTime" type="time" defaultValue={event?.startTime} />
      </div>
      <div>
        <Label htmlFor="course">Platz</Label>
        <Input
          id="course"
          name="course"
          list="course-options"
          defaultValue={event?.course}
          placeholder="Nordseeplatz"
        />
        <datalist id="course-options">
          <option value="Nordseeplatz" />
          <option value="Weserplatz" />
        </datalist>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="holes">Löcher</Label>
          <Input id="holes" name="holes" type="number" min={0} max={72} defaultValue={event?.holes} />
        </div>
        <div>
          <Label htmlFor="tee">Tee</Label>
          <Input id="tee" name="tee" defaultValue={event?.tee} placeholder="1 / Kanonenstart" />
        </div>
      </div>
      <div>
        <Label htmlFor="participantsEstimate">TN (Schätzung)</Label>
        <Input
          id="participantsEstimate"
          name="participantsEstimate"
          defaultValue={event?.participantsEstimate}
          placeholder="ca. 30"
        />
      </div>
      <div>
        <Label htmlFor="playType">Spielart</Label>
        <Select id="playType" name="playType" defaultValue={event?.playType ?? ""}>
          <option value="">– keine –</option>
          {PLAY_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {PLAY_TYPE_SHORT[o.value]} — {o.label}
            </option>
          ))}
        </Select>
      </div>

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

export function EventsManager({
  planId,
  events,
  weekStart,
  weekEnd,
}: {
  planId: string;
  events: EditableEvent[];
  weekStart: string;
  weekEnd: string;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">Termine bearbeiten</h2>
        {!adding ? (
          <Button size="sm" onClick={() => { setAdding(true); setEditing(null); }}>
            + Termin hinzufügen
          </Button>
        ) : null}
      </div>

      {adding ? (
        <EventForm
          planId={planId}
          weekStart={weekStart}
          weekEnd={weekEnd}
          onDone={() => setAdding(false)}
        />
      ) : null}

      {events.length === 0 && !adding ? (
        <p className="text-sm text-ink-muted">
          Noch keine Termine. Füge welche hinzu oder generiere den Plan aus der Datenquelle neu.
        </p>
      ) : null}

      <ul className="divide-y divide-brand-50">
        {events.map((e) => (
          <li key={e.id} className="py-3">
            {editing === e.id ? (
              <EventForm
                planId={planId}
                weekStart={weekStart}
                weekEnd={weekEnd}
                event={e}
                onDone={() => setEditing(null)}
              />
            ) : (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="w-24 shrink-0 text-sm font-semibold text-brand-800">
                  {WEEKDAY_LABELS_DE[e.weekday]}
                </span>
                <span className="w-14 shrink-0 text-sm text-ink-muted">
                  {e.startTime || "–"}
                </span>
                <span className="flex-1 font-semibold text-ink">{e.title}</span>
                <span className="text-sm text-ink-muted">
                  {e.course || "–"}
                  {e.playType ? ` · ${PLAY_TYPE_SHORT[e.playType as keyof typeof PLAY_TYPE_SHORT]}` : ""}
                </span>
                {e.fromSeries ? (
                  <span className="rounded-full bg-accent-300/40 px-2 py-0.5 text-xs font-medium text-brand-800">
                    Serie
                  </span>
                ) : null}
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    e.origin === "EDITED"
                      ? "bg-sky-100 text-sky-700"
                      : "bg-brand-50 text-ink-soft",
                  )}
                >
                  {e.origin === "EDITED" ? "bearbeitet" : "importiert"}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setEditing(e.id); setAdding(false); }}
                  >
                    Bearbeiten
                  </Button>
                  <form
                    action={deleteEventAction}
                    onSubmit={(ev) => {
                      if (!confirm(`Termin „${e.title}" wirklich löschen?`)) ev.preventDefault();
                    }}
                  >
                    <input type="hidden" name="eventId" value={e.id} />
                    <input type="hidden" name="planId" value={planId} />
                    <button
                      type="submit"
                      className="rounded-full px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
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
