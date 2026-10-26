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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--lp-primary)] px-6 text-center text-[var(--lp-on-primary)]"
        >
          <div className="w-full max-w-sm">
            <p className="text-sm uppercase tracking-[0.2em] opacity-80">{brand}</p>
            {answer === "no" ? (
              <>
                <h1 id="age-gate-title" className="mt-4 font-[family-name:var(--lp-heading-font)] text-3xl">
                  Sorry, not yet
                </h1>
                <p className="mt-3 opacity-90">You need to be {minimumAge} or older to view this page.</p>
              </>
            ) : (
              <>
                <h1 id="age-gate-title" className="mt-4 font-[family-name:var(--lp-heading-font)] text-3xl">
                  Are you {minimumAge} or older?
                </h1>
                <p className="mt-3 opacity-90">You must be of legal drinking age to view this page.</p>
                <div className="mt-8 space-y-3">
                  <button
                    type="button"
                    onClick={confirm}
                    autoFocus
                    className="w-full rounded-full bg-[var(--lp-on-primary)] px-6 py-3.5 text-base font-semibold text-[var(--lp-primary)]"
                  >
                    Yes, I&apos;m {minimumAge} or older
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswer("no")}
                    className="w-full rounded-full border border-current px-6 py-3.5 text-base font-semibold"
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
