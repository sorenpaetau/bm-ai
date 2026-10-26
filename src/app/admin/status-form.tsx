"use client";

// A status dropdown that saves as soon as it changes.
export function StatusForm({
  action,
  value,
  options,
}: {
  action: (form: FormData) => Promise<void>;
  value: string;
  options: Record<string, string>;
}) {
  return (
    <form action={action}>
      <select
        name="status"
        defaultValue={value}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        aria-label="Status"
        className="rounded-lg border border-line bg-surface px-2 py-1 text-sm"
      >
        {Object.entries(options).map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </select>
    </form>
  );
}
