"use client";

/** A submit button that asks first. Used inside small server-action forms. */
export function ConfirmSubmit({ question, className, children }: { question: string; className?: string; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(question)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
