import { randomBytes } from "node:crypto";
import { after, NextResponse, type NextRequest } from "next/server";
import { recordTap, VISITOR_COOKIE, VISITOR_COOKIE_MAX_AGE } from "@/lib/analytics";
import { coarseLocation, findTagForRedirect, isBot, normalizeCode, parseDevice, safeDestination, sourceFromQuery } from "@/lib/tags";

// The redirect layer (see CLAUDE.md). Every physical tag and QR code points here. We log the tap,
// then send the phone on to wherever the tag points today. The tap is written after the response
// goes out, so a slow database never slows the redirect down.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const url = new URL(req.url);
  const code = normalizeCode((await params).code);
  const tag = code ? await findTagForRedirect(code) : null;

  if (!tag) return redirect(req, "/t?status=unknown");
  if (!tag.active) return redirect(req, "/t?status=inactive");

  const override = safeDestination(tag.destinationUrl);
  const destination = override ?? (tag.slug && tag.isLive ? `/p/${tag.slug}?t=${tag.code}` : "/t?status=pending");
  const res = redirect(req, destination);

  const existing = req.cookies.get(VISITOR_COOKIE)?.value;
  let visitorId = existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing) ? existing : null;
  if (!visitorId) {
    visitorId = randomBytes(16).toString("base64url");
    res.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: VISITOR_COOKIE_MAX_AGE,
    });
  }

  const userAgent = req.headers.get("user-agent");
  if (req.method === "GET" && !isBot(userAgent)) {
    const tap = {
      tagCode: tag.code,
      productId: tag.productId,
      companyId: tag.companyId,
      source: sourceFromQuery(url.searchParams),
      visitorId,
      device: parseDevice(userAgent, {
        mobile: req.headers.get("sec-ch-ua-mobile"),
        platform: req.headers.get("sec-ch-ua-platform"),
      }),
      location: coarseLocation(req.headers),
    };
    after(() => recordTap(tap).catch((err) => console.error("Failed to record tap", err)));
  }

  return res;
}

function redirect(req: Request, to: string) {
  const res = NextResponse.redirect(new URL(to, req.url), 302);
  // A cached redirect would skip the tap log and could send people to an old page.
  res.headers.set("Cache-Control", "no-store");
  return res;
}
