"use client";

import { useActionState } from "react";
import { setupAction, type ActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Field";

export function SetupForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    setupAction,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="email">E-Mail-Adresse</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required />
      </div>
      <div>
        <Label htmlFor="password">Passwort (mind. 8 Zeichen)</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div>
        <Label htmlFor="passwordConfirm">Passwort wiederholen</Label>
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>
      <div>
        <Label htmlFor="setupKey">Einrichtungsschlüssel</Label>
        <Input id="setupKey" name="setupKey" type="password" required />
        <p className="mt-1 text-xs text-ink-soft">
          Aus der Umgebungsvariable <code>ADMIN_SETUP_KEY</code>.
        </p>
      </div>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Wird eingerichtet …" : "Administrator einrichten"}
      </Button>
    </form>
  );
}
