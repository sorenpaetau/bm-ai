import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthShell } from "../login/_components/auth-shell";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/portal");
  return (
    <AuthShell
      title="Create your account"
      subtitle="Build your first product page in a few minutes. Pages go live once we've confirmed your brand."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand underline">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
