"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { AGE_COOKIE } from "./helpers";

/**
 * Full-screen "Are you 21 or older?" check in front of the page. The page itself is rendered
 * underneath (but inert) so it appears instantly once the visitor confirms. The answer is remembered
 * for 30 days in a cookie, which the server reads so returning visitors never see the gate.
 */
export function AgeGate({
  minimumAge,
  brand,
  initiallyConfirmed,
  style,
  children,
}: {
  minimumAge: number;
  brand: string;
  initiallyConfirmed: boolean;
  /** The brand theme variables from landingThemeStyle(). */
  style: CSSProperties;
  children: React.ReactNode;
}) {
  const [answer, setAnswer] = useState<"yes" | "no" | null>(initiallyConfirmed ? "yes" : null);
  const open = answer !== "yes";

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function confirm() {
    const secure = location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${AGE_COOKIE}=${minimumAge}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax${secure}`;
    setAnswer("yes");
  }

  return (
    <>
      <div inert={open} aria-hidden={open || undefined}>
        {children}
      </div>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="age-gate-title"
          style={style}
          className="fixed inset-0 z-50 isolate flex items-center justify-center overflow-hidden bg-[image:var(--lp-hero)] px-6 text-center text-[var(--lp-on-primary)]"
        >
          <svg aria-hidden="true" viewBox="0 0 400 200" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 -z-10 h-1/3 w-full">
            <path d="M0 110 C70 60 140 100 210 80 S330 40 400 70 V200 H0Z" fill="#000" opacity="0.12" />
            <path d="M0 150 C80 120 160 150 240 130 S350 110 400 125 V200 H0Z" fill="#000" opacity="0.16" />
            <path d="M0 110 C70 60 140 100 210 80 S330 40 400 70" fill="none" stroke="var(--lp-accent)" strokeOpacity="0.4" strokeWidth="0.8" />
          </svg>
          <div className="w-full max-w-sm animate-rise">
            <span
              aria-hidden="true"
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full font-[family-name:var(--lp-heading-font)] text-4xl text-[var(--lp-accent)] ring-1 ring-[var(--lp-accent)]/60"
            >
              {brand.trim().charAt(0)}
            </span>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--lp-accent)]">{brand}</p>
            {answer === "no" ? (
              <>
                <h1 id="age-gate-title" className="mt-4 font-[family-name:var(--lp-heading-font)] text-4xl leading-tight">
                  Sorry, not yet
                </h1>
                <p className="mt-3 opacity-80">You need to be {minimumAge} or older to view this page.</p>
              </>
            ) : (
              <>
                <h1 id="age-gate-title" className="mt-4 font-[family-name:var(--lp-heading-font)] text-4xl leading-tight">
                  Are you {minimumAge} or older?
                </h1>
                <p className="mt-3 opacity-80">You must be of legal drinking age to view this page.</p>
                <div className="mt-10 space-y-3">
                  <button
                    type="button"
                    onClick={confirm}
                    autoFocus
                    className="w-full rounded-full bg-[var(--lp-on-primary)] px-6 py-4 text-base font-semibold text-[var(--lp-primary)] shadow-[0_12px_30px_-10px_rgb(0_0_0/0.5)] transition focus-visible:outline-[var(--lp-accent)] active:scale-[0.985]"
                  >
                    Yes, I&apos;m {minimumAge} or older
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswer("no")}
                    className="w-full rounded-full px-6 py-4 text-base font-semibold ring-1 ring-current/40 ring-inset transition active:scale-[0.985]"
                  >
                    No
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
