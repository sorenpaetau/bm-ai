import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthShell } from "./_components/auth-shell";
import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "bm_admin" ? "/admin" : "/portal");
  return (
    <AuthShell
      title="Log in to your portal"
      subtitle="Manage your product pages, tags and sign-ups."
      footer={
        <>
          New to B&amp;M.ai?{" "}
          <Link href="/signup" className="font-medium text-brand underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
