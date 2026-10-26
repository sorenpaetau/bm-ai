"use client";

import { useActionState } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { login, type FormState } from "../actions";
import { FormError } from "./auth-shell";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      <Field label="Email">
        <input name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} className={inputClass} />
      </Field>
      <Field label="Password">
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
