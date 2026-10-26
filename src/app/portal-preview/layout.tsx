import type { Metadata } from "next";

// Bare layout for the editor's phone preview (no portal header). Never indexed.
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
