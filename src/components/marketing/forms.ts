import { z } from "zod";

// Shared plumbing for the marketing site's forms (contact, starter kit): read the posted fields,
// validate them, and hand back errors plus what the visitor typed so nothing is lost on a mistake.

export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };

/** Hidden field that people never see but spam bots fill in. */
export const HONEYPOT = "website";

export function readFields(formData: FormData, names: readonly string[]): Record<string, string> {
  return Object.fromEntries(names.map((n) => [n, String(formData.get(n) ?? "").replace(/\r\n/g, "\n").trim()]));
}

export function isBot(formData: FormData) {
  return String(formData.get(HONEYPOT) ?? "") !== "";
}

export function validationFailed(error: z.ZodError, values: Record<string, string>): FormState {
  return {
    status: "error",
    message: "Please check the highlighted fields.",
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[] | undefined>,
    values,
  };
}

export const requiredText = (label: string, max = 200) =>
  z.string().min(1, `Please enter ${label}.`).max(max, `Please keep this under ${max} characters.`);

export const optionalText = (max = 200) =>
  z
    .string()
    .max(max, `Please keep this under ${max} characters.`)
    .transform((v) => v || null);

export const email = z.email("Please enter a valid email address.").max(200);
