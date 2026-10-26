"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { sql } from "@/lib/db";

export type FormState = { error?: string; values?: Record<string, string> };

function values(form: FormData) {
  return Object.fromEntries([...form.entries()].filter(([k, v]) => typeof v === "string" && k !== "password")) as Record<
    string,
    string
  >;
}

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const [user] = await sql<{ id: string; passwordHash: string; role: string }[]>`
    SELECT id, password_hash, role FROM users WHERE lower(email) = ${email}`;
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "That email and password don't match. Please try again.", values: values(form) };
  }
  await createSession(user.id);
  redirect(user.role === "bm_admin" ? "/admin" : "/portal");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

const Signup = z.object({
  companyName: z.string().trim().min(2, "Enter your company name."),
  // Pharma is out of scope for V1 (regulated content), so it is not offered at signup.
  vertical: z.enum(["wine_spirits", "cosmetics", "retail"], { message: "Choose what you make." }),
  website: z
    .string()
    .trim()
    .transform((s) => (s && !/^https?:\/\//i.test(s) ? `https://${s}` : s))
    .pipe(z.union([z.literal(""), z.url("Enter a valid website, e.g. ridgelinecellars.com")])),
  firstName: z.string().trim().min(1, "Enter your first name."),
  lastName: z.string().trim().min(1, "Enter your last name."),
  title: z.string().trim(),
  email: z.email("Enter a valid email address.").transform((s) => s.toLowerCase()),
  password: z.string().min(8, "Use at least 8 characters for your password."),
});

export async function signup(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = Signup.safeParse({
    companyName: form.get("companyName") ?? "",
    vertical: form.get("vertical") ?? "",
    website: form.get("website") ?? "",
    firstName: form.get("firstName") ?? "",
    lastName: form.get("lastName") ?? "",
    title: form.get("title") ?? "",
    email: String(form.get("email") ?? "").trim(),
    password: form.get("password") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message, values: values(form) };
  const d = parsed.data;

  const [taken] = await sql`SELECT 1 FROM users WHERE lower(email) = ${d.email}`;
  if (taken) return { error: "An account with this email already exists. Try logging in.", values: values(form) };

  const passwordHash = await hashPassword(d.password);
  // New companies start unverified: they can build pages but can't publish until B&M.ai verifies them.
  const userId = await sql.begin(async (tx) => {
    const [company] = await tx<{ id: string }[]>`
      INSERT INTO companies (name, vertical, website)
      VALUES (${d.companyName}, ${d.vertical}, ${d.website || null})
      RETURNING id`;
    const [user] = await tx<{ id: string }[]>`
      INSERT INTO users (company_id, email, password_hash, first_name, last_name, title, role)
      VALUES (${company.id}, ${d.email}, ${passwordHash}, ${d.firstName}, ${d.lastName}, ${d.title || null}, 'admin')
      RETURNING id`;
    return user.id;
  });
  await createSession(userId);
  redirect("/portal?welcome=1");
}
