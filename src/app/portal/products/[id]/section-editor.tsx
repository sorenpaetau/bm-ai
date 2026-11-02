"use client";

import { useState } from "react";
import { tidySection } from "@/components/landing/helpers";
import { inputClass } from "@/components/ui";
import type { Section, SectionType } from "@/lib/landing";
import { ItemList, TextArea, TextField, Toggle } from "./fields";

export const SECTION_TYPES: Record<SectionType, { label: string; hint: string }> = {
  facts: { label: "Fact box", hint: "Short label and value pairs, e.g. Alcohol: 14.5%. Star the big ones to show them as tiles." },
  story: { label: "Text", hint: "A heading and a few sentences: your story, the region, how to use" },
  tasting: { label: "Tasting notes", hint: "Flavors, body and tannin, the blend and the vintage" },
  products: { label: "More products", hint: "Other products or gift sets, with photo, price and link" },
  offers: { label: "Specials", hint: "Discounts, bundles and limited offers" },
  memberships: { label: "Memberships", hint: "Club tiers such as Bronze, Silver and Gold, with perks" },
  events: { label: "Events", hint: "Dated events. Each one hides itself after its date" },
  maker: { label: "The maker", hint: "Your winemaker or founders, how you farm and make it, and key numbers" },
  visit: { label: "Visit us", hint: "Address and map, tastings and tours, nearby places to stay and eat" },
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
    case "tasting":
      return { ...base, type, body: "", flavors: [], structure: [], blend: [] };
    case "products":
      return { ...base, type, items: [{ name: "" }] };
    case "offers":
      return { ...base, type, items: [{ title: "" }] };
    case "memberships":
      return { ...base, type, tiers: [{ name: "", perks: [] }] };
    case "events":
      return { ...base, type, items: [{ title: "", date: "" }] };
    case "maker":
      return { ...base, type, people: [], items: [], stats: [], images: [] };
    case "visit":
      return { ...base, type, address: "", map: true, experiences: [], nearby: [], links: [] };
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
        {section.visible && !tidySection(section) && (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-900">Empty · not shown until you fill it in</span>
        )}
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
        <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
          <TextField label="Section heading" value={section.title} onChange={(title) => patch({ title })} />
          <TextField
            label="Jump button name (optional)"
            value={section.navLabel}
            onChange={(navLabel) => patch({ navLabel: navLabel || undefined })}
            placeholder="e.g. Taste"
          />
        </div>
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
          blank={(): Item<typeof section> => ({ label: "", value: "" })}
          addLabel="Add a fact"
          render={(item, set) => (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
                <TextField label="Label" value={item.label} onChange={(label) => set({ label })} placeholder="Alcohol" />
                <TextField label="Value" value={item.value} onChange={(value) => set({ value })} placeholder="14.5%" />
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <TextField
                  className="min-w-48 flex-1"
                  label="Small print (optional)"
                  value={item.note}
                  onChange={(note) => set({ note: note || undefined })}
                  placeholder="e.g. Wine Spectator"
                />
                <Toggle label="Show as a big tile" checked={Boolean(item.highlight)} onChange={(highlight) => set({ highlight })} />
              </div>
            </div>
          )}
        />
      );
    case "story":
      return (
        <div className="space-y-3">
          <TextArea label="Text" rows={5} value={section.body} onChange={(body) => patch({ body })} hint="Leave a blank line between paragraphs." />
          <ImagesField images={section.images} onChange={(images) => patch({ images })} />
        </div>
      );
    case "tasting":
      return (
        <div className="space-y-3">
          <TextArea label="Tasting notes" rows={4} value={section.body} onChange={(body) => patch({ body })} />
          <ListField
            label="Flavors and aromas"
            values={section.flavors}
            onChange={(flavors) => patch({ flavors })}
            hint="Comma separated, e.g. Blackberry, Cassis, Vanilla"
            separator=","
          />
          <p className="text-xs font-medium text-muted">How it feels (1 = light, 5 = full)</p>
          <ItemList
            items={section.structure}
            onChange={(structure) => patch({ structure })}
            blank={() => ({ label: "", level: 3 })}
            addLabel="Add a scale (e.g. Body, Tannin, Acidity)"
            render={(item, set) => (
              <div className="grid grid-cols-[2fr_1fr] gap-2">
                <TextField label="Scale" value={item.label} onChange={(label) => set({ label })} placeholder="Body" />
                <LevelField value={item.level} onChange={(level) => set({ level })} />
              </div>
            )}
          />
          <p className="text-xs font-medium text-muted">The blend</p>
          <ItemList
            items={section.blend}
            onChange={(blend) => patch({ blend })}
            blank={() => ({ name: "", percent: 100 })}
            addLabel="Add a grape"
            render={(item, set) => (
              <div className="grid grid-cols-[2fr_1fr] gap-2">
                <TextField label="Grape" value={item.name} onChange={(name) => set({ name })} placeholder="Cabernet Sauvignon" />
                <TextField
                  label="Percent"
                  type="number"
                  value={String(item.percent)}
                  onChange={(v) => set({ percent: Math.min(100, Math.max(0, Number(v) || 0)) })}
                />
              </div>
            )}
          />
          <div className="grid gap-2 sm:grid-cols-[1fr_3fr]">
            <TextField
              label="Vintage year"
              value={section.vintage?.year}
              onChange={(year) => patch({ vintage: { body: section.vintage?.body ?? "", year } })}
              placeholder="2023"
            />
            <TextArea
              label="About the vintage (weather, growing season)"
              rows={2}
              value={section.vintage?.body}
              onChange={(body) => patch({ vintage: { year: section.vintage?.year ?? "", body } })}
            />
          </div>
        </div>
      );
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
              <TextField
                className="sm:col-span-2"
                label="Short description (optional)"
                value={item.description}
                onChange={(d) => set({ description: d || undefined })}
              />
              <TextField
                label="Photo link (optional)"
                type="url"
                value={item.imageUrl}
                onChange={(imageUrl) => set({ imageUrl: imageUrl || undefined })}
              />
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
    case "memberships":
      return (
        <div className="space-y-3">
          <TextArea label="Intro (optional)" rows={2} value={section.body} onChange={(body) => patch({ body: body || undefined })} />
          <ItemList
            items={section.tiers}
            onChange={(tiers) => patch({ tiers })}
            blank={(): Tier => ({ name: "", perks: [] })}
            addLabel="Add a tier"
            render={(tier, set) => (
              <div className="space-y-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <TextField label="Tier name" value={tier.name} onChange={(name) => set({ name })} placeholder="Gold" />
                  <TextField label="Price (optional)" value={tier.price} onChange={(price) => set({ price: price || undefined })} placeholder="From $120 a shipment" />
                </div>
                <ListField label="Perks" values={tier.perks} onChange={(perks) => set({ perks })} hint="One per line" rows={3} />
                <div className="flex flex-wrap items-end gap-4">
                  <TextField
                    className="min-w-48 flex-1"
                    label="Join link (optional)"
                    type="url"
                    value={tier.url}
                    onChange={(url) => set({ url: url || undefined })}
                  />
                  <Toggle label="Most popular" checked={Boolean(tier.featured)} onChange={(featured) => set({ featured })} />
                </div>
              </div>
            )}
          />
        </div>
      );
    case "maker":
      return (
        <div className="space-y-3">
          <TextArea label="Intro (optional)" rows={3} value={section.body} onChange={(body) => patch({ body: body || undefined })} />
          <p className="text-xs font-medium text-muted">Key numbers</p>
          <ItemList
            items={section.stats}
            onChange={(stats) => patch({ stats })}
            blank={() => ({ label: "", value: "" })}
            addLabel="Add a number (e.g. Bottles a year: 9,000)"
            render={(item, set) => (
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Label" value={item.label} onChange={(label) => set({ label })} placeholder="Founded" />
                <TextField label="Value" value={item.value} onChange={(value) => set({ value })} placeholder="1984" />
              </div>
            )}
          />
          <p className="text-xs font-medium text-muted">People</p>
          <ItemList
            items={section.people}
            onChange={(people) => patch({ people })}
            blank={(): Person => ({ name: "" })}
            addLabel="Add a person (e.g. your winemaker)"
            render={(p, set) => (
              <div className="space-y-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <TextField label="Name" value={p.name} onChange={(name) => set({ name })} />
                  <TextField label="Role (optional)" value={p.role} onChange={(role) => set({ role: role || undefined })} placeholder="Winemaker" />
                </div>
                <TextArea label="About them (optional)" rows={2} value={p.body} onChange={(body) => set({ body: body || undefined })} />
                <TextField label="Photo link (optional)" type="url" value={p.imageUrl} onChange={(imageUrl) => set({ imageUrl: imageUrl || undefined })} />
              </div>
            )}
          />
          <p className="text-xs font-medium text-muted">How you make it</p>
          <ItemList
            items={section.items}
            onChange={(items) => patch({ items })}
            blank={() => ({ title: "", body: "" })}
            addLabel="Add a topic (e.g. Our farming, Harvest by hand)"
            render={(item, set) => (
              <div className="space-y-2">
                <TextField label="Topic" value={item.title} onChange={(title) => set({ title })} placeholder="Our farming" />
                <TextArea label="Details" rows={2} value={item.body} onChange={(body) => set({ body })} />
              </div>
            )}
          />
          <ImagesField images={section.images} onChange={(images) => patch({ images })} />
        </div>
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
          <Toggle label="Show a map of this address" checked={section.map} onChange={(map) => patch({ map })} />
          <div className="grid gap-2 sm:grid-cols-2">
            <TextField label="Opening hours (optional)" value={section.hours} onChange={(hours) => patch({ hours: hours || undefined })} />
            <TextField label="Phone (optional)" value={section.phone} onChange={(phone) => patch({ phone: phone || undefined })} />
          </div>
          <TextArea label="More details (optional)" rows={3} value={section.body} onChange={(body) => patch({ body: body || undefined })} />
          <p className="text-xs font-medium text-muted">Tastings, tours and events to book</p>
          <ItemList
            items={section.experiences}
            onChange={(experiences) => patch({ experiences })}
            blank={(): Experience => ({ title: "" })}
            addLabel="Add a tasting or tour"
            render={(item, set) => (
              <div className="space-y-2">
                <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
                  <TextField label="Name" value={item.title} onChange={(title) => set({ title })} placeholder="Estate tasting" />
                  <TextField label="Price (optional)" value={item.price} onChange={(price) => set({ price: price || undefined })} />
                </div>
                <TextField label="Details (optional)" value={item.body} onChange={(body) => set({ body: body || undefined })} />
                <TextField label="Booking link (optional)" type="url" value={item.url} onChange={(url) => set({ url: url || undefined })} />
              </div>
            )}
          />
          <p className="text-xs font-medium text-muted">Nearby places</p>
          <ItemList
            items={section.nearby}
            onChange={(nearby) => patch({ nearby })}
            blank={(): Nearby => ({ name: "", kind: "stay" })}
            addLabel="Add a place to stay, eat or see"
            render={(item, set) => (
              <div className="grid gap-2 sm:grid-cols-2">
                <TextField label="Name" value={item.name} onChange={(name) => set({ name })} />
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-muted">Type</span>
                  <select value={item.kind} onChange={(e) => set({ kind: e.target.value as Nearby["kind"] })} className={inputClass}>
                    <option value="stay">Place to stay</option>
                    <option value="eat">Restaurant</option>
                    <option value="do">Something to see or do</option>
                  </select>
                </label>
                <TextField label="Note (optional)" value={item.note} onChange={(note) => set({ note: note || undefined })} placeholder="5 minutes away" />
                <TextField label="Link (optional)" type="url" value={item.url} onChange={(url) => set({ url: url || undefined })} />
              </div>
            )}
          />
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
type Tier = Extract<Section, { type: "memberships" }>["tiers"][number];
type Person = Extract<Section, { type: "maker" }>["people"][number];
type Experience = Extract<Section, { type: "visit" }>["experiences"][number];
type Nearby = Extract<Section, { type: "visit" }>["nearby"][number];
type Image = Extract<Section, { type: "story" }>["images"][number];

/** A list of short strings edited as one text box (comma separated, or one per line). */
function ListField({
  label,
  values,
  onChange,
  hint,
  separator = "\n",
  rows,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  hint?: string;
  separator?: "," | "\n";
  rows?: number;
}) {
  // Keep the raw text while typing so a trailing comma or new line isn't eaten.
  const parse = (t: string) => t.split(separator).map((v) => v.trim()).filter(Boolean);
  const joined = values.join(separator === "," ? ", " : "\n");
  const [text, setText] = useState(joined);
  // If the values change from outside (e.g. a row above was removed and this row now shows another
  // tier), show the new values instead of the old text.
  if (parse(text).join("\u0000") !== values.join("\u0000")) setText(joined);
  const set = (t: string) => {
    setText(t);
    onChange(parse(t));
  };
  return separator === "," ? (
    <TextField label={label} value={text} onChange={set} hint={hint} />
  ) : (
    <TextArea label={label} value={text} onChange={set} hint={hint} rows={rows} />
  );
}

function LevelField({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted">Level</span>
      <select value={Math.round(value)} onChange={(e) => onChange(Number(e.target.value))} className={inputClass}>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n} {["", "(light)", "", "(medium)", "", "(full)"][n]}
          </option>
        ))}
      </select>
    </label>
  );
}

function ImagesField({ images, onChange }: { images: Image[]; onChange: (images: Image[]) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted">Photos (optional, only photos your company owns)</p>
      <ItemList
        items={images}
        onChange={onChange}
        blank={(): Image => ({ url: "", alt: "" })}
        addLabel="Add a photo"
        render={(img, set) => (
          <div className="grid gap-2 sm:grid-cols-2">
            <TextField label="Photo link" type="url" value={img.url} onChange={(url) => set({ url })} />
            <TextField label="What it shows" value={img.alt} onChange={(alt) => set({ alt })} placeholder="Our vineyard at harvest" />
          </div>
        )}
      />
    </div>
  );
}
