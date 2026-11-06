"use client";

/* eslint-disable @next/next/no-img-element -- previews of the brand's own uploads; plain <img> is simplest. */

import { createContext, useContext, useId, useRef, useState } from "react";
import type { LandingImage } from "@/lib/landing";
import { uploadPhoto } from "../upload-actions";

// Photo uploads for the page builder. Every photo is shrunk in the browser to at most 1600px and
// re-saved before it's sent, which keeps consumer pages fast on a phone and strips hidden metadata
// such as GPS location. Then it's stored by the uploadPhoto server action and shown from /media/<id>.

const MAX_SIDE = 1600;

/** Which product the photos belong to. Set once by the editor so every field can upload. */
export const PhotoProductContext = createContext<string | null>(null);

async function shrinkPhoto(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`We couldn't open “${file.name}”. Try a JPG or PNG photo.`);
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't prepare the photo. Try another browser.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const encode = (type: string, quality: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  // WebP keeps see-through backgrounds and is small. Older Safari can't make WebP, so fall back to JPEG.
  let blob = await encode("image/webp", 0.84);
  if (!blob || blob.type !== "image/webp") blob = await encode("image/jpeg", 0.85);
  if (!blob) throw new Error("Your browser couldn't prepare the photo. Try another browser.");
  return { blob, width, height };
}

/** Uploads photos one at a time and reports progress. */
function useUploader() {
  const productId = useContext(PhotoProductContext);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: File[], onUploaded: (url: string, file: File) => void) {
    if (!productId) return;
    setError(null);
    const photos = files.filter((f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif|gif|avif)$/i.test(f.name));
    if (photos.length < files.length) setError("Some files weren't photos, so we skipped them.");
    for (const [i, file] of photos.entries()) {
      setBusy(photos.length > 1 ? `Uploading ${i + 1} of ${photos.length}…` : "Uploading…");
      try {
        const { blob, width, height } = await shrinkPhoto(file);
        const form = new FormData();
        form.set("photo", blob, "photo");
        form.set("width", String(width));
        form.set("height", String(height));
        const res = await uploadPhoto(productId, form);
        if (res.error !== undefined) throw new Error(res.error);
        onUploaded(res.url, file);
      } catch (err) {
        setError(err instanceof Error && err.message ? err.message : "The upload didn't work. Check your connection and try again.");
        break;
      }
    }
    setBusy(null);
  }

  return { upload, busy, error };
}

function filesFrom(list: FileList | null | undefined): File[] {
  return list ? Array.from(list) : [];
}

/** Drag photos onto it, or tap it to pick from the phone's photos or camera. */
function DropZone({
  multiple,
  onFiles,
  busy,
  children,
  className = "",
}: {
  multiple: boolean;
  onFiles: (files: File[]) => void;
  busy: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!busy) onFiles(filesFrom(e.dataTransfer.files).slice(0, multiple ? 20 : 1));
      }}
      className={className}
    >
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className={`flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-3 py-4 text-center text-sm transition disabled:cursor-wait ${
          over ? "border-brand bg-brand/5" : "border-line bg-paper hover:border-stone-400 hover:bg-white"
        }`}
      >
        {children}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => {
          onFiles(filesFrom(e.target.files));
          e.target.value = "";
        }}
      />
    </div>
  );
}

function CameraIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function Status({ busy, error }: { busy: string | null; error: string | null }) {
  if (busy) return <p className="text-xs font-medium text-brand" role="status">{busy}</p>;
  if (error) return <p className="text-xs text-red-700" role="alert">{error}</p>;
  return null;
}

/**
 * One photo: the main product photo, the logo, a product or a person. Shows the photo with Replace and
 * Remove, or a big "Upload a photo" box. A photo link can still be pasted for photos already online.
 */
export function PhotoField({
  label,
  value,
  onChange,
  hint,
  size = "small",
}: {
  label: string;
  value: string | undefined;
  onChange: (url: string | undefined) => void;
  hint?: string;
  size?: "hero" | "small";
}) {
  const { upload, busy, error } = useUploader();
  const [pasting, setPasting] = useState(false);
  const linkId = useId();
  const pick = (files: File[]) => upload(files.slice(0, 1), (url) => onChange(url));
  const hero = size === "hero";

  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-medium text-muted">{label}</span>
      {value ? (
        <div className={`flex gap-3 ${hero ? "flex-col sm:flex-row sm:items-end" : "items-center"}`}>
          <img
            src={value}
            alt=""
            className={`rounded-xl border border-line bg-[repeating-conic-gradient(#f3f1ec_0_25%,#fff_0_50%)] bg-[length:16px_16px] object-contain ${
              hero ? "h-56 w-full sm:w-72" : "h-20 w-20"
            }`}
          />
          <div className="flex flex-wrap gap-2">
            <DropZone multiple={false} onFiles={pick} busy={Boolean(busy)} className="w-auto">
              <span className="px-1 font-medium">{busy ? "Uploading…" : "Replace photo"}</span>
            </DropZone>
            <button type="button" onClick={() => onChange(undefined)} className="rounded-xl px-3 text-sm font-medium text-muted underline hover:text-ink">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <DropZone multiple={false} onFiles={pick} busy={Boolean(busy)} className={hero ? "h-56" : "h-24 sm:w-64"}>
          <CameraIcon className={hero ? "h-9 w-9 text-brand" : "h-6 w-6 text-brand"} />
          <span className="font-semibold">{busy ?? (hero ? "Upload your main photo" : "Upload a photo")}</span>
          {hero && !busy && <span className="text-xs text-muted">Tap to choose, or drag a photo here</span>}
        </DropZone>
      )}
      <Status busy={null} error={error} />
      {hint && <p className="text-xs text-muted">{hint}</p>}
      {pasting || (value && !value.startsWith("/media/")) ? (
        <label htmlFor={linkId} className="block space-y-1">
          <span className="text-xs text-muted">Or paste a link to a photo that&apos;s already online</span>
          <input
            id={linkId}
            type="url"
            value={value?.startsWith("/media/") ? "" : (value ?? "")}
            onChange={(e) => onChange(e.target.value || undefined)}
            placeholder="https://"
            className="block w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
          />
        </label>
      ) : (
        <button type="button" onClick={() => setPasting(true)} className="text-xs text-muted underline hover:text-ink">
          Or use a link to a photo that&apos;s already online
        </button>
      )}
    </div>
  );
}

/**
 * The "upload pictures" spot under each topic: any number of photos, each with an optional caption that
 * also describes it for people using screen readers.
 */
export function PhotoStrip({
  images,
  onChange,
  label = "Pictures for this section",
  hint = "Optional. They show as a row of photos at the bottom of this section. Only use photos your company owns.",
}: {
  images: LandingImage[];
  /** Gets a function from the current photos to the new ones, so uploads that finish late add to the newest list. */
  onChange: (update: (images: LandingImage[]) => LandingImage[]) => void;
  label?: string;
  hint?: string;
}) {
  const { upload, busy, error } = useUploader();
  const add = (files: File[]) => upload(files, (url) => onChange((prev) => [...prev, { url, alt: "" }]));
  const set = (i: number, patch: Partial<LandingImage>) => onChange((prev) => prev.map((img, j) => (j === i ? { ...img, ...patch } : img)));
  const remove = (i: number) => onChange((prev) => prev.filter((_, j) => j !== i));
  const move = (i: number, delta: number) =>
    onChange((prev) => {
      const next = [...prev];
      const [img] = next.splice(i, 1);
      next.splice(i + delta, 0, img);
      return next;
    });

  return (
    <div className="space-y-2 rounded-xl bg-paper/60 p-3 ring-1 ring-line ring-inset">
      <div>
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <CameraIcon className="h-4 w-4 text-brand" />
          {label}
        </p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((img, i) => (
          <li key={`${img.url}-${i}`} className="space-y-1.5 rounded-xl border border-line bg-surface p-2">
            <div className="relative">
              <img src={img.url} alt="" className="h-28 w-full rounded-lg bg-paper object-cover" />
              <div className="absolute top-1 right-1 flex gap-1">
                {i > 0 && <SmallButton label="Move left" onClick={() => move(i, -1)}>←</SmallButton>}
                {i < images.length - 1 && <SmallButton label="Move right" onClick={() => move(i, 1)}>→</SmallButton>}
                <SmallButton label="Remove photo" onClick={() => remove(i)}>×</SmallButton>
              </div>
            </div>
            <input
              value={img.alt}
              onChange={(e) => set(i, { alt: e.target.value })}
              placeholder="What it shows (optional)"
              aria-label="What this photo shows"
              className="block w-full rounded-md border border-line bg-surface px-2 py-1 text-xs"
            />
          </li>
        ))}
        <li>
          <DropZone multiple onFiles={add} busy={Boolean(busy)} className="h-full min-h-28">
            <CameraIcon className="h-6 w-6 text-brand" />
            <span className="font-semibold">{busy ?? (images.length ? "Add more pictures" : "Upload pictures")}</span>
            {!busy && <span className="text-xs text-muted">One or several at once</span>}
          </DropZone>
        </li>
      </ul>
      <Status busy={null} error={error} />
    </div>
  );
}

function SmallButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm font-semibold text-white backdrop-blur hover:bg-black/80"
    >
      {children}
    </button>
  );
}
