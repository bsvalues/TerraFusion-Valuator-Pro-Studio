import Link from "next/link";

/**
 * Public marketing landing for TerraFusion Valuator Pro.
 * Re-skinned to the TerraFusion brand (deep navy ground + electric-cyan accent, uppercase
 * micro-label grammar, bold headline + structured label/value block) — echoing
 * terrafusionmarket.com. Uses semantic tokens (bg-background/text-foreground/primary/...) which
 * now resolve to the TerraFusion palette in globals.css. NOT v0 emerald-on-zinc.
 *
 * Careful language: "USPAP-aware", "evidence and workfile discipline" — not a compliance guarantee.
 */

export const metadata = {
  title: "TerraFusion Valuator Pro — Commercial Fee Appraisal Workbench",
  description:
    "Finish commercial appraisal analysis faster, with a stronger evidence trail. Three approaches to value, AI-assisted narrative drafting, and PDF report export — for fee appraisers.",
};

const FACTS: [string, string][] = [
  ["Approaches", "Cost · Sales · Income"],
  ["Narrative", "AI-assisted drafting"],
  ["Discipline", "Evidence + workfile trail"],
  ["Output", "PDF report export"],
];

export default function Landing() {
  return (
    <main
      className="min-h-screen text-foreground"
      style={{ background: "radial-gradient(120% 90% at 80% -10%, hsl(215 40% 14%) 0%, hsl(var(--background)) 55%)" }}
    >
      <div className="mx-auto max-w-5xl px-6">
        {/* Nav */}
        <header className="flex items-center justify-between py-6">
          <span className="text-sm font-semibold tracking-tight">
            TerraFusion <span style={{ color: "hsl(var(--primary))" }}>Valuator Pro</span>
          </span>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/sample-report" className="hover:text-foreground">Sample report</Link>
            <Link href="/workbench" className="hover:text-foreground">Open workbench</Link>
          </nav>
        </header>

        {/* Hero */}
        <section className="py-16 sm:py-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--primary))" }}>
            For commercial fee appraisers
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            Finish commercial appraisal analysis faster, with a stronger evidence trail.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            A USPAP-aware appraisal workbench built around <span className="text-foreground">evidence and workfile
            discipline</span>. It supports all three approaches to value, drafts the narrative with AI assistance,
            and exports a PDF report — so every number can point back to where it came from.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/workbench"
              className="inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              Open the workbench →
            </Link>
            <Link href="/sample-report" className="inline-flex items-center justify-center rounded-md border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary">
              See a sample report
            </Link>
            <Link href="/pricing" className="inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Try it on a demo assignment — no card required.{" "}
            <Link href="/demo" className="text-foreground underline-offset-4 hover:underline" style={{ textDecorationColor: "hsl(var(--primary))" }}>Start the demo →</Link>
          </p>

          {/* Structured label/value block — TerraFusion grammar (echoes the .com) */}
          <dl className="mt-14 grid grid-cols-2 gap-x-10 gap-y-6 border-t border-border pt-8 sm:grid-cols-4">
            {FACTS.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{k}</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* What it does */}
        <section className="grid gap-6 border-t border-border py-14 sm:grid-cols-3">
          {[
            ["Three approaches to value", "Cost, sales comparison (with regression support), and income — in one governed workspace."],
            ["AI-assisted narrative drafting", "Draft the report narrative from your own analysis, then edit. You stay the author of record."],
            ["Evidence + workfile discipline", "Runs are logged and outputs cite their sources, so your workfile holds up to review."],
          ].map(([h, b]) => (
            <div key={h} className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-base font-semibold text-foreground">{h}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b}</p>
            </div>
          ))}
        </section>

        {/* Who / why */}
        <section className="border-t border-border py-14">
          <h2 className="text-2xl font-bold tracking-tight">Built for the appraiser doing the work</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Form software handles residential forms. This is for the <span className="text-foreground">commercial</span>{" "}
            analysis underneath — the three approaches, the regression, the narrative, and the report — with an
            evidence trail that saves you time and stands up when the work is reviewed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/workbench" className="inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
              Open the workbench →
            </Link>
            <Link href="/pricing" className="inline-flex items-center justify-center rounded-md border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary">
              See pricing
            </Link>
          </div>
        </section>

        <footer className="border-t border-border py-8 text-sm text-muted-foreground">
          TerraFusion Valuator Pro · an evidence-anchored appraisal workbench for fee appraisers.
          <span className="mt-1 block text-muted-foreground/70">
            USPAP-aware analytical tooling. You remain the appraiser of record; this software supports your judgment, it does not replace it.
          </span>
        </footer>
      </div>
    </main>
  );
}
