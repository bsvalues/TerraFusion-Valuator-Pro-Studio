import Link from "next/link";

/**
 * Public marketing landing for TerraFusion Valuator Pro.
 * (The former swarm dashboard moved to /studio; the appraiser workspace is /workbench.)
 * Language is deliberately careful: "USPAP-aware", "evidence and workfile discipline" —
 * not "USPAP-compliant guarantee" / "certified compliant" / "guaranteed defensible".
 */

export const metadata = {
  title: "TerraFusion Valuator Pro — Commercial Fee Appraisal Workbench",
  description:
    "Finish commercial appraisal analysis faster, with a stronger evidence trail. Three approaches to value, AI-assisted narrative drafting, and PDF report export — for fee appraisers.",
};

function Cta({ href, children, primary }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
          : "inline-flex items-center justify-center rounded-lg border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500"
      }
    >
      {children}
    </Link>
  );
}

export default function Landing() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-6">
        {/* Nav */}
        <header className="flex items-center justify-between py-6">
          <span className="text-sm font-semibold tracking-tight">TerraFusion <span className="text-emerald-400">Valuator Pro</span></span>
          <nav className="flex items-center gap-5 text-sm text-zinc-400">
            <Link href="/pricing" className="hover:text-zinc-200">Pricing</Link>
            <Link href="/sample-report" className="hover:text-zinc-200">Sample report</Link>
            <Link href="/workbench" className="hover:text-zinc-200">Open workbench</Link>
          </nav>
        </header>

        {/* Hero */}
        <section className="py-16 sm:py-24">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">For commercial fee appraisers</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Finish commercial appraisal analysis faster, with a stronger evidence trail.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400">
            A USPAP-aware appraisal workbench built around <span className="text-zinc-200">evidence and workfile
            discipline</span>. It supports all three approaches to value, drafts the narrative with AI assistance,
            and exports a PDF report — so every number can point back to where it came from.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href="/workbench" primary>Open the workbench →</Cta>
            <Cta href="/sample-report">See a sample report</Cta>
            <Cta href="/pricing">Pricing</Cta>
          </div>
          <p className="mt-4 text-sm text-zinc-500">Try it on a demo assignment — no card required. <Link href="/demo" className="text-zinc-300 underline underline-offset-4 hover:text-white">Start the demo →</Link></p>
        </section>

        {/* What it does */}
        <section className="grid gap-6 border-t border-zinc-800 py-14 sm:grid-cols-3">
          {[
            ["Three approaches to value", "Cost, sales comparison (with regression support), and income — in one governed workspace."],
            ["AI-assisted narrative drafting", "Draft the report narrative from your own analysis, then edit. You stay the author of record."],
            ["Evidence + workfile discipline", "Runs are logged and outputs cite their sources, so your workfile holds up to review."],
          ].map(([h, b]) => (
            <div key={h}>
              <h3 className="text-base font-semibold text-zinc-100">{h}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{b}</p>
            </div>
          ))}
        </section>

        {/* Who / why */}
        <section className="border-t border-zinc-800 py-14">
          <h2 className="text-2xl font-bold tracking-tight">Built for the appraiser doing the work</h2>
          <p className="mt-4 max-w-2xl text-zinc-400">
            Form software handles residential forms. This is for the <span className="text-zinc-200">commercial</span>{" "}
            analysis underneath — the three approaches, the regression, the narrative, and the report — with an
            evidence trail that saves you time and stands up when the work is reviewed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href="/workbench" primary>Open the workbench →</Cta>
            <Cta href="/pricing">See pricing</Cta>
          </div>
        </section>

        <footer className="border-t border-zinc-800 py-8 text-sm text-zinc-500">
          TerraFusion Valuator Pro · an evidence-anchored appraisal workbench for fee appraisers.
          <span className="block text-zinc-600">USPAP-aware analytical tooling. You remain the appraiser of record; this software supports your judgment, it does not replace it.</span>
        </footer>
      </div>
    </main>
  );
}
