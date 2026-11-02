import "server-only";

// Outgoing email for staff alerts (for example "a tag order was paid"). Uses Resend's HTTP API when
// RESEND_API_KEY is set; otherwise logs the message and returns false, so nothing breaks without it.
// Stripe also emails the account owner about every successful payment, so alerts are a convenience.

export async function sendEmail({ to, subject, text }: { to: string[]; subject: string; text: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || to.length === 0) {
    console.info(`[email skipped: ${key ? "no recipients" : "no RESEND_API_KEY"}] ${subject}\n${text}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "B&M.ai <onboarding@resend.dev>", to, subject, text }),
    });
    if (!res.ok) console.error(`[email failed] ${res.status} ${await res.text()}`);
    return res.ok;
  } catch (err) {
    console.error("[email failed]", err);
    return false;
  }
}

/** Who hears about new paid orders: ORDER_ALERT_EMAIL, comma-separated. */
export function staffAlertRecipients(): string[] {
  return (process.env.ORDER_ALERT_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
