import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "TerraFusion Professional Runtime",
  description: "Governed professional workspace — Valuator Pro module.",
};

export default function RuntimeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/assignments" className="text-sm font-semibold tracking-tight">
            TerraFusion <span className="text-cyan-400">Professional Runtime</span>
          </Link>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Slice 1 · Valuator Pro
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
