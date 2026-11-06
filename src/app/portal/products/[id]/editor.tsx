"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { LandingContent, Section, SectionType } from "@/lib/landing";
import { Button, inputClass } from "@/components/ui";
import { otherButtonIndexes, quickLinkUrl, setQuickLink, type TopicExample } from "../../_lib/builder";
import { publishBlockers } from "../../_lib/publish";
import { publish, saveDraft } from "../actions";
import { ItemList, Panel, TextArea, TextField, Toggle } from "./fields";
import { PhotoField, PhotoProductContext } from "./photos";
import { blankSection, SECTION_TYPES, SectionEditor } from "./section-editor";

type SaveState = "saved" | "dirty" | "saving" | "error";

type Props = {
  productId: string;
  slug: string;
  initial: LandingContent;
  live: boolean;
  liveIsCurrent: boolean;
  verified: boolean;
  /** Example answers for topic boxes, keyed by topic id (from the demo page for this market). */
  examples?: Record<string, TopicExample>;
};

const AUTOSAVE_MS = 1200;

export function Editor({ productId, slug, initial, live, liveIsCurrent, verified, examples = {} }: Props) {
  const [content, setContent] = useState(initial);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [isLive, setIsLive] = useState(live);
  const [changedSincePublish, setChangedSincePublish] = useState(live && !liveIsCurrent);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [publishing, startPublish] = useTransition();
  const latest = useRef(content);
  latest.current = content;

  const blockers = publishBlockers(content, verified);

  // Follow the server when the page is published or taken offline outside the editor.
  useEffect(() => {
    setIsLive(live);
    if (!live) setChangedSincePublish(false);
  }, [live]);

  const update = useCallback((fn: (draft: LandingContent) => void) => {
    setContent((c) => {
      const next = structuredClone(c);
      fn(next);
      return next;
    });
    setSaveState("dirty");
    setChangedSincePublish(true);
    setMessage(null);
  }, []);

  // Autosave the draft shortly after the last change. The live page only changes on Publish.
  useEffect(() => {
    if (saveState !== "dirty") return;
    const timer = setTimeout(async () => {
      setSaveState("saving");
      const snapshot = latest.current;
      const res = await saveDraft(productId, snapshot).catch(() => ({ error: "Couldn't reach the server." }));
      if ("error" in res && res.error) {
        setSaveState("error");
        setMessage({ kind: "error", text: res.error });
        return;
      }
      setSaveState(latest.current === snapshot ? "saved" : "dirty");
      setPreviewVersion((v) => v + 1);
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [saveState, content, productId]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (saveState === "saved") return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);

  function onPublish() {
    startPublish(async () => {
      const res = await publish(productId, latest.current);
      if (res.error) {
        setMessage({ kind: "error", text: res.error });
        return;
      }
      setSaveState("saved");
      setIsLive(true);
      setChangedSincePublish(false);
      setPreviewVersion((v) => v + 1);
      setMessage({ kind: "ok", text: res.ok ?? "Published." });
    });
  }

  const setSection = (i: number) => (section: Section) => update((d) => void (d.sections[i] = section));
  // Photo uploads finish a moment later, so find the section by id in the newest version.
  const updateSection = (id: string) => (fn: (section: Section) => Section) =>
    update((d) => {
      const k = d.sections.findIndex((s) => s.id === id);
      if (k >= 0) d.sections[k] = fn(d.sections[k]);
    });
  const [newType, setNewType] = useState<SectionType>("story");
  const others = otherButtonIndexes(content.buttons);

  return (
    <PhotoProductContext.Provider value={productId}>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        {/* Status and publish bar */}
        <div className="sticky top-0 z-10 -mx-4 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm">
              <span className={`font-semibold ${isLive ? "text-emerald-800" : "text-stone-700"}`}>
                {isLive ? (changedSincePublish ? "Live · you have unpublished changes" : "Live") : "Draft · not live yet"}
              </span>
              <span className="ml-2 text-xs text-muted">
                {saveState === "saving" ? "Saving…" : saveState === "dirty" ? "Unsaved changes" : saveState === "error" ? "Not saved" : "All changes saved"}
              </span>
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              <a
                href={`/portal-preview/${productId}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold hover:bg-paper lg:hidden"
              >
                Preview
              </a>
              {isLive && (
                <a href={`/p/${slug}`} target="_blank" rel="noreferrer" className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold hover:bg-paper">
                  View live page
                </a>
              )}
              <Button type="button" onClick={onPublish} disabled={publishing || blockers.length > 0 || (isLive && !changedSincePublish)}>
                {publishing ? "Publishing…" : isLive ? "Publish changes" : "Publish page"}
              </Button>
            </div>
          </div>
          {message && (
            <p role="status" className={`mt-2 text-sm ${message.kind === "ok" ? "text-emerald-800" : "text-red-700"}`}>
              {message.text}
            </p>
          )}
          {blockers.length > 0 && (
            <details className="mt-2 text-sm text-amber-900">
              <summary className="cursor-pointer font-medium">
                {blockers.length} thing{blockers.length === 1 ? "" : "s"} to do before you can publish
              </summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </details>
          )}
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
          <p className="font-semibold">Fill in the blanks, top to bottom</p>
          <p className="mt-1">
            This form follows your page from top to bottom: your main photo, the webstore and website buttons, then one box for each topic
            button. Add pictures anywhere you see the camera. Anything you leave empty simply stays off your page.
          </p>
        </div>

        <Panel title="Step 1 · Main photo and name" description="The first thing shoppers see after they tap the sticker.">
          <PhotoField
            size="hero"
            label="Main photo"
            value={content.hero.imageUrl}
            onChange={(url) => update((d) => void (d.hero.imageUrl = url))}
            hint="A clear photo of the product itself. A plain or see-through background looks best. Only use photos your company owns."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Brand name" value={content.hero.brand} onChange={(v) => update((d) => void (d.hero.brand = v))} />
            <TextField label="Product name" value={content.hero.title} onChange={(v) => update((d) => void (d.hero.title = v))} />
          </div>
          <TextField
            label="Short line under the name"
            value={content.hero.subtitle}
            onChange={(v) => update((d) => void (d.hero.subtitle = v || undefined))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Suggested retail price (optional)"
              value={content.hero.price}
              onChange={(v) => update((d) => void (d.hero.price = v || undefined))}
              placeholder="$280"
            />
            <TextField
              label="Small print under the price (optional)"
              value={content.hero.priceNote}
              onChange={(v) => update((d) => void (d.hero.priceNote = v || undefined))}
              placeholder="Suggested retail price"
            />
          </div>
        </Panel>

        <Panel
          title="Step 2 · Webstore and website buttons"
          description="The two big buttons right under the photo. Leave one empty and that button won't show."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Your webstore link"
              type="url"
              value={quickLinkUrl(content, "webstore")}
              onChange={(v) => update((d) => void (d.buttons = setQuickLink(d.buttons, "webstore", v)))}
              placeholder="https://yourbrand.com/shop"
              hint="Shows as “Go to webstore”."
            />
            <TextField
              label="Your website link"
              type="url"
              value={quickLinkUrl(content, "website")}
              onChange={(v) => update((d) => void (d.buttons = setQuickLink(d.buttons, "website", v)))}
              placeholder="https://yourbrand.com"
              hint="Shows as “Go to website”."
            />
          </div>
          <details className="rounded-lg border border-line p-3" open={others.length > 0}>
            <summary className="cursor-pointer text-sm font-medium">More buttons (optional)</summary>
            <p className="mt-1 mb-3 text-xs text-muted">For example “Book a tasting” or “Call us”.</p>
            <ItemList
              items={others.map((i) => content.buttons[i])}
              onChange={(next) =>
                update((d) => void (d.buttons = [...d.buttons.filter((_, i) => !otherButtonIndexes(d.buttons).includes(i)), ...next]))
              }
              blank={() => ({ label: "", url: "", style: "secondary" as const, kind: "link" as const })}
              addLabel="Add a button"
              render={(b, set) => (
                <div className="grid gap-2 sm:grid-cols-2">
                  <TextField label="Button text" value={b.label} onChange={(label) => set({ label })} placeholder="Book a tasting" />
                  <TextField label="Link" type="url" value={b.url} onChange={(url) => set({ url })} placeholder="https://" />
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted">What it links to</span>
                    <select value={b.kind} onChange={(e) => set({ kind: e.target.value as typeof b.kind })} className={inputClass}>
                      <option value="link">A web page</option>
                      <option value="shopify">My online shop (Shopify)</option>
                      <option value="phone">A phone number (tel:)</option>
                      <option value="email">An email address (mailto:)</option>
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted">Style</span>
                    <select value={b.style} onChange={(e) => set({ style: e.target.value as typeof b.style })} className={inputClass}>
                      <option value="primary">Solid (main action)</option>
                      <option value="secondary">Outline</option>
                    </select>
                  </label>
                </div>
              )}
            />
          </details>
        </Panel>

        <div className="space-y-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h2 className="font-semibold">Step 3 · Your topics</h2>
              <p className="text-sm text-muted">
                Each box below gets its own jump button under the photo, in this order. Give a short answer, a few details and pictures. Empty
                boxes stay off the page, and hidden ones stay saved but shoppers don&apos;t see them.
              </p>
            </div>
          </div>
          {content.sections.map((section, i) => (
            <SectionEditor
              key={section.id}
              section={section}
              number={i + 1}
              example={examples[section.id]}
              onChange={setSection(i)}
              onUpdate={updateSection(section.id)}
              first={i === 0}
              last={i === content.sections.length - 1}
              onMove={(delta) =>
                update((d) => {
                  const [s] = d.sections.splice(i, 1);
                  d.sections.splice(i + delta, 0, s);
                })
              }
              onRemove={() => update((d) => void d.sections.splice(i, 1))}
            />
          ))}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-line p-4">
            <Button type="button" onClick={() => update((d) => void d.sections.push({ ...blankSection("topic"), title: "" }))}>
              + Add a topic
            </Button>
            <span className="text-xs text-muted">or add a different kind of box:</span>
            <select value={newType} onChange={(e) => setNewType(e.target.value as SectionType)} className={`${inputClass} w-auto`}>
              {Object.entries(SECTION_TYPES).map(([type, { label }]) => (
                <option key={type} value={type}>
                  {label}
                </option>
              ))}
            </select>
            <Button type="button" variant="ghost" onClick={() => update((d) => void d.sections.push(blankSection(newType)))}>
              + Add section
            </Button>
            <span className="text-xs text-muted">{SECTION_TYPES[newType].hint}</span>
          </div>
        </div>

        <Panel title="Step 4 · Sign-up box" description="Lets shoppers register the product and join your list. This is how you stay in touch with them.">
          <Toggle label="Show the sign-up box" checked={content.optin.enabled} onChange={(v) => update((d) => void (d.optin.enabled = v))} />
          {content.optin.enabled && (
            <>
              <TextField label="Headline" value={content.optin.headline} onChange={(v) => update((d) => void (d.optin.headline = v))} />
              <TextField label="Why sign up" value={content.optin.prompt} onChange={(v) => update((d) => void (d.optin.prompt = v))} />
              <TextArea
                label="Consent wording"
                rows={2}
                value={content.optin.consentText}
                onChange={(v) => update((d) => void (d.optin.consentText = v))}
                hint="Customers tick a box next to this exact text. We store it with each sign-up."
              />
              <div className="flex flex-wrap gap-4">
                {(["first_name", "email", "phone"] as const).map((f) => (
                  <Toggle
                    key={f}
                    label={{ first_name: "Ask for first name", email: "Ask for email", phone: "Ask for phone" }[f]}
                    checked={content.optin.fields.includes(f)}
                    onChange={(on) =>
                      update((d) => void (d.optin.fields = on ? [...d.optin.fields, f] : d.optin.fields.filter((x) => x !== f)))
                    }
                  />
                ))}
              </div>
            </>
          )}
        </Panel>

        <Panel title="Step 5 · Logo, colours and rules">
          <div className="grid gap-3 sm:grid-cols-3">
            <ColorField label="Main colour" value={content.theme.primary} onChange={(v) => update((d) => void (d.theme.primary = v))} />
            <ColorField label="Accent colour" value={content.theme.accent} onChange={(v) => update((d) => void (d.theme.accent = v))} />
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted">Heading style</span>
              <select
                value={content.theme.font}
                onChange={(e) => update((d) => void (d.theme.font = e.target.value as "serif" | "sans"))}
                className={inputClass}
              >
                <option value="serif">Classic (serif)</option>
                <option value="sans">Modern (sans-serif)</option>
              </select>
            </label>
          </div>
          <PhotoField
            label="Logo (optional)"
            value={content.theme.logoUrl}
            onChange={(url) => update((d) => void (d.theme.logoUrl = url))}
            hint="Shown at the top of the page instead of your name in capitals. A logo on a see-through background works best."
          />
          <div className="flex flex-wrap items-center gap-4">
            <Toggle label="Ask customers to confirm their age" checked={content.ageGate.enabled} onChange={(v) => update((d) => void (d.ageGate.enabled = v))} />
            {content.ageGate.enabled && (
              <label className="flex items-center gap-2 text-sm">
                Minimum age
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={content.ageGate.minimumAge}
                  onChange={(e) => update((d) => void (d.ageGate.minimumAge = Number(e.target.value) || 21))}
                  className={`${inputClass} w-20`}
                />
              </label>
            )}
          </div>
          <TextArea label="Small print at the bottom (optional)" rows={2} value={content.disclaimer} onChange={(v) => update((d) => void (d.disclaimer = v || undefined))} />
        </Panel>
      </div>

      <Preview productId={productId} version={previewVersion} />
    </div>
    </PhotoProductContext.Provider>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted">{label}</span>
      <span className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-line" />
        <span className="font-mono text-xs text-muted">{value}</span>
      </span>
    </label>
  );
}

/** Phone-sized preview of the saved draft. Reloads after each save and keeps its scroll position. */
function Preview({ productId, version }: { productId: string; version: number }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const scroll = useRef(0);
  const src = `/portal-preview/${productId}`;

  useEffect(() => {
    if (version === 0) return;
    const win = frame.current?.contentWindow;
    if (!win) return;
    scroll.current = win.scrollY;
    win.location.reload();
  }, [version]);

  return (
    <aside className="lg:sticky lg:top-4 lg:self-start">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold">Preview</span>
        <a href={src} target="_blank" rel="noreferrer" className="text-muted underline hover:text-ink">
          Open full screen
        </a>
      </div>
      <div className="mx-auto w-full max-w-[380px] rounded-[2.2rem] border-[10px] border-stone-800 bg-stone-800 shadow-xl">
        <iframe
          ref={frame}
          src={src}
          title="Page preview"
          onLoad={() => frame.current?.contentWindow?.scrollTo(0, scroll.current)}
          className="h-[680px] w-full rounded-[1.6rem] bg-white"
        />
      </div>
      <p className="mt-2 text-center text-xs text-muted">This is how it looks on a phone. Changes appear here once saved.</p>
    </aside>
  );
}
