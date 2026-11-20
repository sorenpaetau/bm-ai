"use client";

import { useActionState } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { FormError } from "@/app/login/_components/auth-shell";
import { acceptHandover, type WelcomeState } from "./actions";

export function WelcomeForm({ token, email, firstName, lastName }: { token: string; email: string; firstName: string; lastName: string }) {
  const [state, action, pending] = useActionState<WelcomeState, FormData>(acceptHandover.bind(null, token), {});
  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      <Field label="Your email" hint="You'll log in with this.">
        <input value={email} readOnly className={`${inputClass} bg-paper text-muted`} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <input name="firstName" autoComplete="given-name" required defaultValue={firstName} className={inputClass} />
        </Field>
        <Field label="Last name">
          <input name="lastName" autoComplete="family-name" required defaultValue={lastName} className={inputClass} />
        </Field>
      </div>
      <Field label="Choose a password" hint="At least 8 characters.">
        <input name="password" type="password" autoComplete="new-password" required minLength={8} className={inputClass} />
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Opening your pages…" : "Take over my pages"}
      </Button>
    </form>
  );
}
