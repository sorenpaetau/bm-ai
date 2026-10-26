// Page title row shared by the Tags and Analytics pages. The portal layout supplies the padding.
export function PageHeader({ title, intro, actions }: { title: string; intro?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h1 className="font-serif text-3xl font-medium tracking-[-0.01em] text-ink sm:text-4xl">{title}</h1>
        {intro && <p className="mt-2 text-muted">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function formatDate(date: Date | null, withTime = false): string {
  if (!date) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
    timeZone: "America/Los_Angeles",
  }).format(date);
}
