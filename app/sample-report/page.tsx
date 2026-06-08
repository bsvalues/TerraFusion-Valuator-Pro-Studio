import Link from "next/link";

export const metadata = {
  title: "Sample report — TerraFusion Valuator Pro",
  description: "See what a finished commercial appraisal analysis looks like before you buy.",
};

export default function SampleReport() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6">
        <header className="flex items-center justify-between py-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">TerraFusion <span className="text-cyan-400">Valuator Pro</span></Link>
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing →</Link>
        </header>

        <section className="py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Sample</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">See a finished report before you buy</h1>
          <p className="mt-4 text-muted-foreground">
            This opens the live report view so you can see how the three approaches reconcile, how the narrative
            reads, and how every figure traces back to its evidence. It's an <span className="text-foreground">illustrative
            sample</span> — your assignments produce your own report and PDF.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/report" className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-background hover:bg-cyan-400">Open the sample report →</Link>
            <Link href="/workbench" className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-3 text-sm font-semibold text-foreground hover:border-muted-foreground">Build one in the workbench</Link>
          </div>

          <div className="mt-12 rounded-2xl border border-border p-6">
            <h2 className="text-base font-semibold">What's in it</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>· Subject and assignment conditions</li>
              <li>· Cost, sales-comparison (with regression support), and income approaches</li>
              <li>· Reconciliation to a supported value conclusion</li>
              <li>· AI-assisted narrative you can edit — you remain the author</li>
              <li>· PDF export with the evidence trail intact</li>
            </ul>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Ready to run your own? <Link href="/pricing" className="text-foreground underline underline-offset-4">See pricing</Link> or
            {" "}<Link href="/demo" className="text-foreground underline underline-offset-4">try a demo assignment</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
