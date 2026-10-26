"use client";

import { useActionState } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { signup, type FormState } from "../login/actions";
import { FormError } from "../login/_components/auth-shell";

export function SignupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signup, {});
  const v = state.values ?? {};
  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      <Field label="Company name">
        <input name="companyName" required defaultValue={v.companyName} className={inputClass} />
      </Field>
      <Field label="What do you make?">
        <select name="vertical" required defaultValue={v.vertical ?? "wine_spirits"} className={inputClass}>
          <option value="wine_spirits">Wine &amp; Spirits</option>
          <option value="cosmetics">Cosmetics</option>
          <option value="retail">Retail products</option>
        </select>
      </Field>
      <Field label="Company website" hint="Helps us confirm the account belongs to your brand.">
        <input name="website" inputMode="url" placeholder="yourbrand.com" defaultValue={v.website} className={inputClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <input name="firstName" autoComplete="given-name" required defaultValue={v.firstName} className={inputClass} />
        </Field>
        <Field label="Last name">
          <input name="lastName" autoComplete="family-name" required defaultValue={v.lastName} className={inputClass} />
        </Field>
      </div>
      <Field label="Your title (optional)">
        <input name="title" defaultValue={v.title} className={inputClass} />
      </Field>
      <Field label="Work email" hint="Use your company email address if you can.">
        <input name="email" type="email" autoComplete="email" required defaultValue={v.email} className={inputClass} />
      </Field>
      <Field label="Password" hint="At least 8 characters.">
        <input name="password" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Creating your account…" : "Create account"}
      </Button>
    </form>
  );
}
