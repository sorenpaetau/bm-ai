"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, hashPassword } from "@/lib/auth";
import { sql } from "@/lib/db";
import { handoverTokenHash, isHandoverToken } from "@/lib/handover";

export type WelcomeState = { error?: string };

const Accept = z.object({
  firstName: z.string().trim().min(1, "Enter your first name.").max(60),
  lastName: z.string().trim().min(1, "Enter your last name.").max(60),
  password: z.string().min(8, "Use at least 8 characters for your password.").max(200),
});

/**
 * The winery takes over the account B&M.ai started for it: chooses a password, is signed in and lands
 * on its pages. The link works once.
 */
export async function acceptHandover(token: string, _prev: WelcomeState, form: FormData): Promise<WelcomeState> {
  if (!isHandoverToken(token)) return { error: "This link isn't valid. Ask B&M.ai for a new one." };
  const parsed = Accept.safeParse({ firstName: form.get("firstName") ?? "", lastName: form.get("lastName") ?? "", password: form.get("password") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { firstName, lastName, password } = parsed.data;
  const passwordHash = await hashPassword(password);

  const userId = await sql.begin(async (tx) => {
    const [handover] = await tx<{ id: string; userId: string; companyId: string }[]>`
      UPDATE handovers SET used_at = now()
      WHERE token_hash = ${handoverTokenHash(token)} AND used_at IS NULL AND expires_at > now()
      RETURNING id, user_id, company_id`;
    if (!handover) return null;
    await tx`UPDATE users SET password_hash = ${passwordHash}, first_name = ${firstName}, last_name = ${lastName} WHERE id = ${handover.userId}`;
    await tx`UPDATE companies SET started_by_bm = false WHERE id = ${handover.companyId}`;
    return handover.userId;
  });
  if (!userId) return { error: "This link has already been used or has run out. Ask B&M.ai for a new one, or log in." };
  await createSession(userId);
  redirect("/portal?welcome=handover");
}
