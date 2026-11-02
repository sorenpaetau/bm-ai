import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { recordPlanCheckout } from "@/lib/orders";
import { formatCents, HOSTING_PLANS, type PlanId } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { Button, Card } from "@/components/ui";
import { CheckIcon } from "@/components/icons";
import { choosePlan, manageBilling } from "./actions";

export const metadata: Metadata = { title: "Plan & billing" };

type Company = { plan: string; planInterval: "month" | "year" | null; planStatus: string | null; stripeCustomerId: string | null; products: number };

const STATUS: Record<string, string> = { active: "Active", trialing: "Active", past_due: "Payment overdue: please update your card" };

/** Back from Stripe Checkout: apply the new plan straight away (in case the webhook is slow). */
async function confirmPlan(sessionId: string, companyId: string) {
  const stripe = getStripe();
  if (!stripe || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.company_id === companyId) await recordPlanCheckout(session);
  } catch (err) {
    console.error("Could not confirm Stripe subscription", err);
  }
}

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ subscribed?: string; cancelled?: string; error?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  if (params.subscribed) await confirmPlan(params.subscribed, user.companyId);

  const [company] = await sql<Company[]>`
    SELECT plan, plan_interval, plan_status, stripe_customer_id,
           (SELECT count(*)::int FROM products p WHERE p.company_id = c.id AND p.status <> 'archived') AS products
    FROM companies c WHERE id = ${user.companyId}`;
  const current = company.plan in HOSTING_PLANS ? HOSTING_PLANS[company.plan as PlanId] : null;
  const live = Boolean(current && company.planStatus && company.planStatus in STATUS);
  const canPay = stripeEnabled();
  const plans = Object.entries(HOSTING_PLANS) as [PlanId, (typeof HOSTING_PLANS)[PlanId]][];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-[-0.01em] sm:text-4xl">Plan &amp; billing</h1>
        <p className="text-sm text-muted">
          Your hosting plan keeps your product pages online. It is billed on its own, separately from tag orders.
        </p>
      </div>

      {params.subscribed && live && (
        <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <p className="font-semibold">Thank you! Your {current!.label} plan is active.</p>
          <p className="mt-1 text-sm">Stripe has emailed you a receipt.</p>
        </div>
      )}
      {params.cancelled && (
        <div role="status" className="rounded-2xl border border-line bg-paper p-5 text-sm">Checkout cancelled. Nothing was charged.</div>
      )}
      {params.error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          We couldn&apos;t open the payment page. Please try again, or email us at {SITE.contactEmail}.
        </div>
      )}

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">Your plan</p>
          {live && current ? (
            <>
              <p className="mt-1 font-serif text-2xl font-semibold">
                {current.label}{" "}
                <span className="font-sans text-base font-normal text-muted">
                  {formatCents(company.planInterval === "month" ? current.monthlyCents : current.yearlyCents)} /{" "}
                  {company.planInterval === "month" ? "month" : "year"}
                </span>
              </p>
              <p className="text-sm text-muted">
                {STATUS[company.planStatus!]} · {company.products} of {current.skus.toLocaleString("en-US")} product pages used
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 font-serif text-2xl font-semibold">Starter</p>
              <p className="text-sm text-muted">No paid plan yet. Pick one below when you&apos;re ready to go live.</p>
            </>
          )}
        </div>
        {live && company.stripeCustomerId && canPay && (
          <form action={manageBilling}>
            <Button type="submit" variant="ghost">
              Manage billing
            </Button>
          </form>
        )}
      </Card>

      {!live && (
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map(([id, plan]) => (
            <Card key={id} className="flex flex-col">
              <h2 className="font-serif text-xl font-semibold">{plan.label}</h2>
              <p className="mt-1 text-sm text-muted">Pages for up to {plan.skus.toLocaleString("en-US")} products</p>
              <p className="mt-4">
                <span className="font-serif text-3xl font-semibold">{formatCents(plan.yearlyCents)}</span>
                <span className="text-sm text-muted"> / year</span>
              </p>
              <p className="text-sm text-muted">or {formatCents(plan.monthlyCents)} / month</p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {["Tap and sign-up dashboard", "Change pages any time", "Technical support"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto space-y-2 pt-5">
                {canPay ? (
                  <>
                    <form action={choosePlan}>
                      <input type="hidden" name="plan" value={id} />
                      <input type="hidden" name="interval" value="year" />
                      <Button type="submit" className="w-full">
                        Pay yearly
                      </Button>
                    </form>
                    <form action={choosePlan}>
                      <input type="hidden" name="plan" value={id} />
                      <input type="hidden" name="interval" value="month" />
                      <Button type="submit" variant="ghost" className="w-full">
                        Pay monthly
                      </Button>
                    </form>
                  </>
                ) : (
                  <a
                    href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent(`${plan.label} plan for ${user.companyName ?? "our company"}`)}`}
                    className="block text-center text-sm font-medium text-brand underline"
                  >
                    Email us to start this plan
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      {canPay && (
        <p className="text-xs text-muted">
          Card payments are handled securely by Stripe. Plans renew automatically; you can cancel any time from Manage billing.
        </p>
      )}
    </div>
  );
}
