import "server-only";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "./db";

// Minimal session auth: a random token in an httpOnly cookie, looked up in the sessions table.
// Swap for a hosted auth provider later if needed; callers only use the functions below.

const COOKIE = "bm_session";
/** For B&M.ai staff: the company whose pages they are building (see requireUser). */
const STAFF_COMPANY_COOKIE = "bm_staff_company";
const SESSION_DAYS = 30;

export type CurrentUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "admin" | "editor" | "bm_admin";
  companyId: string | null;
  companyName: string | null;
  /** True when B&M.ai staff are building this company's pages for it (before handing them over). */
  staff?: boolean;
};

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const id = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sql`INSERT INTO sessions (id, user_id, expires_at) VALUES (${id}, ${userId}, ${expires})`;
  (await cookies()).set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (id) await sql`DELETE FROM sessions WHERE id = ${id}`;
  jar.delete(COOKIE);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  const [user] = await sql<CurrentUser[]>`
    SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.company_id, c.name AS company_name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN companies c ON c.id = u.company_id
    WHERE s.id = ${id} AND s.expires_at > now()`;
  return user ?? null;
}

/**
 * For portal pages: a signed-in manufacturer user, or redirect to /login. B&M.ai staff who chose a
 * company on the admin page ("Build pages for this winery") get the portal as that company, marked
 * `staff`, so they can build its first pages before handing them over (Jens, Nov 18 2026). Staff can't
 * publish: the company approves and publishes its own pages.
 */
export async function requireUser(): Promise<CurrentUser & { companyId: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.companyId) {
    const company = user.role === "bm_admin" ? await staffCompany() : null;
    if (!company) redirect("/admin");
    return { ...user, companyId: company.id, companyName: company.name, staff: true };
  }
  return user as CurrentUser & { companyId: string };
}

async function staffCompany(): Promise<{ id: string; name: string } | null> {
  const id = (await cookies()).get(STAFF_COMPANY_COOKIE)?.value ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [company] = await sql<{ id: string; name: string }[]>`SELECT id, name FROM companies WHERE id = ${id}`;
  return company ?? null;
}

/** B&M.ai staff: start (or stop, with null) building a company's pages in the portal. */
export async function setStaffCompany(companyId: string | null) {
  const jar = await cookies();
  if (!companyId) {
    jar.delete(STAFF_COMPANY_COOKIE);
    return;
  }
  jar.set(STAFF_COMPANY_COOKIE, companyId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
}

/** For /admin pages: B&M.ai staff only. */
export async function requireBmAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "bm_admin") redirect("/portal");
  return user;
}
