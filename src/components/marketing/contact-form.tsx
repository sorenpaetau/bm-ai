"use client";

import { useActionState } from "react";
import { submitContact } from "@/app/(marketing)/contact/actions";
import { FormMessage, Honeypot, SubmitButton, SuccessPanel, TextArea, TextField } from "./form-fields";
import { initialFormState } from "./forms";

export function ContactForm({ defaultMessage }: { defaultMessage?: string }) {
  const [state, action] = useActionState(submitContact, initialFormState);

  if (state.status === "success") {
    return (
      <SuccessPanel title={`Thanks${state.values?.firstName ? `, ${state.values.firstName}` : ""}!`}>
        <p>We have your message and will get back to you soon.</p>
      </SuccessPanel>
    );
  }

  return (
    <form action={action} className="relative space-y-5" noValidate>
      <Honeypot />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="firstName" label="First name" state={state} required autoComplete="given-name" />
        <TextField name="lastName" label="Last name" state={state} required autoComplete="family-name" />
        <TextField name="email" label="Email" type="email" state={state} required autoComplete="email" />
        <TextField name="phone" label="Phone" type="tel" state={state} autoComplete="tel" />
        <TextField name="company" label="Company" state={state} autoComplete="organization" />
        <TextField name="product" label="Product" state={state} hint="For example: Cabernet Sauvignon 2023" />
      </div>
      <TextArea
        name="message"
        label="How can we help?"
        state={state}
        required
        rows={defaultMessage ? 8 : 5}
        defaultValue={defaultMessage}
      />
      <FormMessage state={state} />
      <SubmitButton>Send message</SubmitButton>
    </form>
  );
}
