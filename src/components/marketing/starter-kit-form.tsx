"use client";

import { useActionState } from "react";
import { submitStarterKit } from "@/app/(marketing)/starter-kit/actions";
import { FormMessage, Honeypot, SubmitButton, SuccessPanel, TextArea, TextField } from "./form-fields";
import { initialFormState } from "./forms";

export function StarterKitForm() {
  const [state, action] = useActionState(submitStarterKit, initialFormState);

  if (state.status === "success") {
    return (
      <SuccessPanel title="Request received!">
        <p>
          Thanks{state.values?.contactName ? `, ${state.values.contactName.split(" ")[0]}` : ""}. We will review your request
          and email {state.values?.email ?? "you"} when your tags are on the way.
        </p>
      </SuccessPanel>
    );
  }

  return (
    <form action={action} className="relative space-y-5" noValidate>
      <Honeypot />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="companyName" label="Company name" state={state} required autoComplete="organization" />
        <TextField name="contactName" label="Your name" state={state} required autoComplete="name" />
        <TextField name="email" label="Email" type="email" state={state} required autoComplete="email" />
        <TextField name="phone" label="Phone" type="tel" state={state} autoComplete="tel" />
      </div>
      <TextArea
        name="productDescription"
        label="Which product would you like to try?"
        state={state}
        required
        rows={3}
        placeholder="For example: Ridgeline Cellars Cabernet Sauvignon 2023, Napa Valley"
        hint="The name and a short description is plenty. We use it to draft your sample page."
      />
      <TextArea
        name="shippingAddress"
        label="Shipping address"
        state={state}
        required
        rows={3}
        placeholder={"Street\nCity, State ZIP"}
      />
      <FormMessage state={state} />
      <SubmitButton>Request my free tags</SubmitButton>
    </form>
  );
}
