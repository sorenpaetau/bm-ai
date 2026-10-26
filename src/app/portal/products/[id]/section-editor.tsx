"use client";

import type { Section, SectionType } from "@/lib/landing";
import { ItemList, TextArea, TextField } from "./fields";

export const SECTION_TYPES: Record<SectionType, { label: string; hint: string }> = {
  facts: { label: "Quick facts", hint: "Short label and value pairs, e.g. Alcohol: 14.5%" },
  story: { label: "Text", hint: "A heading and a few sentences: your story, tasting notes, how to use" },
  products: { label: "More products", hint: "Other products to show, with optional price and link" },
  offers: { label: "Offers & clubs", hint: "Memberships, discounts and bundles" },
  events: { label: "Events", hint: "Dated events. Each one hides itself after its date" },
  visit: { label: "Visit us", hint: "Address, opening hours and directions" },
};

export function blankSection(type: SectionType): Section {
  const base = {
    id: `${type}-${Math.random().toString(36).slice(2, 8)}`,
    title: SECTION_TYPES[type].label,
    visible: true,
    aiGenerated: false,
    reviewed: true,
    sources: [],
  };
  switch (type) {
    case "facts":
      return { ...base, type, items: [{ label: "", value: "" }] };
    case "story":
      return { ...base, type, body: "", images: [] };
    case "products":
      return { ...base, type, items: [{ name: "" }] };
    case "offers":
      return { ...base, type, items: [{ title: "" }] };
    case "events":
      return { ...base, type, items: [{ title: "", date: "" }] };
    case "visit":
      return { ...base, type, address: "", links: [] };
  }
}

type Props = {
  section: Section;
  onChange: (section: Section) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
  first: boolean;
  last: boolean;
};

export function SectionEditor({ section, onChange, onMove, onRemove, first, last }: Props) {
  const needsReview = section.aiGenerated && !section.reviewed;
  // `patch` keeps the section's own type; casting is safe because each editor only patches its own fields.
  const patch = (p: Partial<Section>) => onChange({ ...section, ...p } as Section);

  return (
    <section
      className={`rounded-2xl border bg-surface p-4 sm:p-5 ${needsReview ? "border-amber-300 ring-1 ring-amber-200" : "border-line"} ${
        section.visible ? "" : "opacity-60"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-stone-100 px-2 py-0.5 font-medium text-stone-700">{SECTION_TYPES[section.type].label}</span>
        {needsReview && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900">AI draft · Needs review</span>}
        {section.aiGenerated && section.reviewed && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-900">AI draft · Reviewed</span>
        )}
        {!section.visible && <span className="rounded-full bg-stone-200 px-2 py-0.5 font-medium text-stone-700">Hidden</span>}
        <div className="ml-auto flex gap-1">
          <IconButton label="Move up" disabled={first} onClick={() => onMove(-1)}>
            ↑
          </IconButton>
          <IconButton label="Move down" disabled={last} onClick={() => onMove(1)}>
            ↓
          </IconButton>
          <IconButton label={section.visible ? "Hide section" : "Show section"} onClick={() => patch({ visible: !section.visible })}>
            {section.visible ? "Hide" : "Show"}
          </IconButton>
          <IconButton
            label="Delete section"
            onClick={() => {
              if (confirm(`Delete the section "${section.title}"?`)) onRemove();
            }}
          >
            Delete
          </IconButton>
        </div>
      </div>

      <div className="space-y-4">
        <TextField label="Section heading" value={section.title} onChange={(title) => patch({ title })} />
        <SectionFields section={section} patch={patch} />
      </div>

      {section.aiGenerated && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-paper p-3 text-xs text-muted">
          <div>
            {section.sources.length > 0 && (
              <>
                Where this came from: <span className="text-ink">{section.sources.join(" · ")}</span>.{" "}
              </>
            )}
            Customers never see this note.
          </div>
          {needsReview ? (
            <button
              type="button"
              onClick={() => patch({ reviewed: true })}
              className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
            >
              ✓ I&apos;ve checked this section
            </button>
          ) : (
            <button type="button" onClick={() => patch({ reviewed: false })} className="text-xs underline hover:text-ink">
              Mark as needing review again
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function SectionFields({ section, patch }: { section: Section; patch: (p: Partial<Section>) => void }) {
  switch (section.type) {
    case "facts":
      return (
        <ItemList
          items={section.items}
          onChange={(items) => patch({ items })}
          blank={() => ({ label: "", value: "" })}
          addLabel="Add a fact"
          render={(item, set) => (
            <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
              <TextField label="Label" value={item.label} onChange={(label) => set({ label })} placeholder="Alcohol" />
              <TextField label="Value" value={item.value} onChange={(value) => set({ value })} placeholder="14.5%" />
            </div>
          )}
        />
      );
    case "story":
      return <TextArea label="Text" rows={5} value={section.body} onChange={(body) => patch({ body })} />;
    case "products":
      return (
        <ItemList
          items={section.items}
          onChange={(items) => patch({ items })}
          blank={(): Item<typeof section> => ({ name: "" })}
          addLabel="Add a product"
          render={(item, set) => (
            <div className="grid gap-2 sm:grid-cols-3">
              <TextField label="Name" value={item.name} onChange={(name) => set({ name })} />
              <TextField label="Price (optional)" value={item.price} onChange={(price) => set({ price: price || undefined })} placeholder="$42" />
              <TextField label="Link (optional)" type="url" value={item.url} onChange={(url) => set({ url: url || undefined })} />
            </div>
          )}
        />
      );
    case "offers":
      return (
        <ItemList
          items={section.items}
          onChange={(items) => patch({ items })}
          blank={(): Item<typeof section> => ({ title: "" })}
          addLabel="Add an offer"
          render={(item, set) => (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <TextField label="Offer" value={item.title} onChange={(title) => set({ title })} />
                <TextField label="Price (optional)" value={item.price} onChange={(price) => set({ price: price || undefined })} />
              </div>
              <TextField label="Details (optional)" value={item.description} onChange={(d) => set({ description: d || undefined })} />
              <TextField label="Link (optional)" type="url" value={item.url} onChange={(url) => set({ url: url || undefined })} />
            </div>
          )}
        />
      );
    case "events":
      return (
        <ItemList
          items={section.items}
          onChange={(items) => patch({ items })}
          blank={(): Item<typeof section> => ({ title: "", date: "" })}
          addLabel="Add an event"
          render={(item, set) => (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr]">
                <TextField label="Event" value={item.title} onChange={(title) => set({ title })} />
                <TextField label="Date" type="date" value={item.date} onChange={(date) => set({ date })} />
                <TextField label="Price (optional)" value={item.price} onChange={(price) => set({ price: price || undefined })} />
              </div>
              <TextField label="Details (optional)" value={item.description} onChange={(d) => set({ description: d || undefined })} />
              <TextField label="Booking link (optional)" type="url" value={item.url} onChange={(url) => set({ url: url || undefined })} />
            </div>
          )}
        />
      );
    case "visit":
      return (
        <div className="space-y-3">
          <TextField label="Address" value={section.address} onChange={(address) => patch({ address })} />
          <TextField label="Opening hours (optional)" value={section.hours} onChange={(hours) => patch({ hours: hours || undefined })} />
          <TextArea label="More details (optional)" rows={3} value={section.body} onChange={(body) => patch({ body: body || undefined })} />
          <ItemList
            items={section.links}
            onChange={(links) => patch({ links })}
            blank={() => ({ label: "", url: "" })}
            addLabel="Add a link (e.g. directions, book a tasting)"
            render={(item, set) => (
              <div className="grid gap-2 sm:grid-cols-2">
                <TextField label="Label" value={item.label} onChange={(label) => set({ label })} />
                <TextField label="Link" type="url" value={item.url} onChange={(url) => set({ url })} />
              </div>
            )}
          />
        </div>
      );
  }
}

function IconButton({ label, children, ...props }: { label: string } & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="rounded-md border border-line px-2 py-1 text-muted hover:bg-paper hover:text-ink disabled:opacity-30"
      {...props}
    >
      {children}
    </button>
  );
}

type Item<S> = S extends { items: Array<infer I> } ? I : never;
