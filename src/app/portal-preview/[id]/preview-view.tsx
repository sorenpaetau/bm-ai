import type { LandingContent, Section } from "@/lib/landing";

// Temporary stand-in for the consumer page renderer (built in the landing page workstream), so the
// editor preview works before that lands. Mirrors its rules: hidden sections and past events are
// skipped, unreviewed AI sections get a "Needs review" badge, and the sign-up form is inert.
export function PreviewView({ content }: { content: LandingContent }) {
  const { theme, hero } = content;
  const today = new Date().toISOString().slice(0, 10);
  const heading = theme.font === "serif" ? "font-serif" : "font-sans";

  return (
    <div className="min-h-screen bg-white text-stone-900">
      <div className="bg-amber-400 py-1 text-center text-xs font-semibold text-amber-950">Preview · not live</div>
      <header className="px-5 pt-10 pb-8 text-white" style={{ background: theme.primary }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- temporary preview, brand-supplied URL */}
        {theme.logoUrl && <img src={theme.logoUrl} alt="" className="mb-4 h-10 w-auto" />}
        <p className="text-xs tracking-widest uppercase opacity-80">{hero.brand}</p>
        <h1 className={`${heading} mt-1 text-3xl font-semibold`}>{hero.title || "Product name"}</h1>
        {hero.subtitle && <p className="mt-2 text-sm opacity-90">{hero.subtitle}</p>}
        {/* eslint-disable-next-line @next/next/no-img-element -- temporary preview, brand-supplied URL */}
        {hero.imageUrl && <img src={hero.imageUrl} alt="" className="mt-6 w-full rounded-xl object-cover" />}
      </header>

      {content.buttons.length > 0 && (
        <div className="flex flex-col gap-2 px-5 py-5">
          {content.buttons.map((b, i) => (
            <span
              key={i}
              className="rounded-full px-4 py-3 text-center text-sm font-semibold"
              style={b.style === "primary" ? { background: theme.accent, color: "#fff" } : { border: `2px solid ${theme.primary}`, color: theme.primary }}
            >
              {b.label || "Button"}
            </span>
          ))}
        </div>
      )}

      <main className="space-y-8 px-5 py-6">
        {content.sections
          .filter((s) => s.visible)
          .map((s) => (
            <section key={s.id}>
              <div className="mb-2 flex items-center gap-2">
                <h2 className={`${heading} text-xl font-semibold`} style={{ color: theme.primary }}>
                  {s.title}
                </h2>
                {s.aiGenerated && !s.reviewed && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">Needs review</span>
                )}
              </div>
              <SectionBody section={s} today={today} />
            </section>
          ))}

        {content.optin.enabled && (
          <section className="rounded-2xl p-5" style={{ background: `${theme.primary}0f` }}>
            <h2 className={`${heading} text-xl font-semibold`}>{content.optin.headline}</h2>
            <p className="mt-1 text-sm text-stone-600">{content.optin.prompt}</p>
            <div className="mt-4 space-y-2">
              {content.optin.fields.map((f) => (
                <input key={f} disabled placeholder={{ first_name: "First name", email: "Email", phone: "Phone" }[f]} className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm" />
              ))}
              <label className="flex gap-2 text-xs text-stone-600">
                <input type="checkbox" disabled /> {content.optin.consentText}
              </label>
              <span className="block rounded-full py-2.5 text-center text-sm font-semibold text-white" style={{ background: theme.accent }}>
                Sign up
              </span>
            </div>
          </section>
        )}
      </main>
      {content.disclaimer && <footer className="px-5 pb-10 text-center text-xs text-stone-500">{content.disclaimer}</footer>}
    </div>
  );
}

function SectionBody({ section: s, today }: { section: Section; today: string }) {
  switch (s.type) {
    case "facts":
      return (
        <dl className="divide-y divide-stone-200 text-sm">
          {s.items.map((f, i) => (
            <div key={i} className="flex justify-between gap-4 py-2">
              <dt className="text-stone-500">{f.label}</dt>
              <dd className="text-right font-medium">{f.value || "—"}</dd>
            </div>
          ))}
        </dl>
      );
    case "story":
      return <p className="text-sm leading-relaxed whitespace-pre-line text-stone-700">{s.body}</p>;
    case "products":
    case "offers":
      return (
        <ul className="space-y-2 text-sm">
          {s.items.map((it, i) => (
            <li key={i} className="rounded-xl border border-stone-200 p-3">
              <div className="flex justify-between gap-2 font-medium">
                <span>{"name" in it ? it.name : it.title}</span>
                {it.price && <span>{it.price}</span>}
              </div>
              {"description" in it && it.description && <p className="mt-1 text-stone-600">{it.description}</p>}
            </li>
          ))}
        </ul>
      );
    case "events":
      return (
        <ul className="space-y-2 text-sm">
          {s.items
            .filter((e) => !e.date || e.date >= today)
            .map((e, i) => (
              <li key={i} className="rounded-xl border border-stone-200 p-3">
                <div className="font-medium">{e.title}</div>
                <div className="text-stone-600">
                  {e.date}
                  {e.price && ` · ${e.price}`}
                </div>
              </li>
            ))}
        </ul>
      );
    case "visit":
      return (
        <div className="space-y-1 text-sm text-stone-700">
          <p className="font-medium">{s.address}</p>
          {s.hours && <p>{s.hours}</p>}
          {s.body && <p>{s.body}</p>}
        </div>
      );
  }
}
