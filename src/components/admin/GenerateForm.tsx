"use client";

import { useActionState } from "react";
import { generateAction, type ActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Field";

export function GenerateForm({
  defaultYear,
  defaultWeek,
}: {
  defaultYear: number;
  defaultWeek: number;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    generateAction,
    {},
  );

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="w-24">
        <Label htmlFor="year">Jahr</Label>
        <Input
          id="year"
          name="year"
          type="number"
          min={2000}
          max={2100}
          defaultValue={defaultYear}
          required
        />
      </div>
      <div className="w-24">
        <Label htmlFor="week">KW</Label>
        <Input
          id="week"
          name="week"
          type="number"
          min={1}
          max={53}
          defaultValue={defaultWeek}
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Wird erstellt …" : "Wochenplan jetzt erstellen"}
      </Button>
      {state.error ? (
        <div className="w-full">
          <FieldError>{state.error}</FieldError>
        </div>
      ) : null}
    </form>
  );
}
