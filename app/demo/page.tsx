import Link from "next/link";

export const metadata = {
  title: "Try a demo — TerraFusion Valuator Pro",
  description: "Run a demo commercial appraisal assignment end to end. No card required.",
};

export default function Demo() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6">
        <header className="flex items-center justify-between py-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">TerraFusion <span className="text-cyan-400">Valuator Pro</span></Link>
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing →</Link>
        </header>

        <section className="py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Demo · no card required</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Run a real assignment in the workbench</h1>
          <p className="mt-4 text-muted-foreground">
            The fastest way to judge this is to use it. Open the workbench, set a subject, and walk the three
            approaches through to a reconciled value and a draft narrative — the same flow you'd use on a real
            assignment.
          </p>

          <ol className="mt-8 space-y-3 text-sm text-foreground">
            <li><span className="font-semibold text-cyan-400">1.</span> Open the workbench and set the subject + assignment conditions.</li>
            <li><span className="font-semibold text-cyan-400">2.</span> Run the Cost, Sales, and Income approaches.</li>
            <li><span className="font-semibold text-cyan-400">3.</span> Reconcile to a value and draft the narrative.</li>
            <li><span className="font-semibold text-cyan-400">4.</span> Export the PDF and review the evidence trail.</li>
          </ol>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/workbench" className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-background hover:bg-cyan-400">Open the workbench →</Link>
            <Link href="/sample-report" className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-3 text-sm font-semibold text-foreground hover:border-muted-foreground">See a finished sample first</Link>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">Like it? <Link href="/pricing" className="text-foreground underline underline-offset-4">Pick a plan</Link> — founding access keeps a discounted rate for life.</p>
        </section>
      </div>
    </main>
  );
}
