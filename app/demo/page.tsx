import Link from "next/link";

export const metadata = {
  title: "Try a demo — TerraFusion Valuator Pro",
  description: "Run a demo commercial appraisal assignment end to end. No card required.",
};

export default function Demo() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6">
        <header className="flex items-center justify-between py-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">TerraFusion <span className="text-emerald-400">Valuator Pro</span></Link>
          <Link href="/pricing" className="text-sm text-zinc-400 hover:text-zinc-200">Pricing →</Link>
        </header>

        <section className="py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Demo · no card required</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Run a real assignment in the workbench</h1>
          <p className="mt-4 text-zinc-400">
            The fastest way to judge this is to use it. Open the workbench, set a subject, and walk the three
            approaches through to a reconciled value and a draft narrative — the same flow you'd use on a real
            assignment.
          </p>

          <ol className="mt-8 space-y-3 text-sm text-zinc-300">
            <li><span className="font-semibold text-emerald-400">1.</span> Open the workbench and set the subject + assignment conditions.</li>
            <li><span className="font-semibold text-emerald-400">2.</span> Run the Cost, Sales, and Income approaches.</li>
            <li><span className="font-semibold text-emerald-400">3.</span> Reconcile to a value and draft the narrative.</li>
            <li><span className="font-semibold text-emerald-400">4.</span> Export the PDF and review the evidence trail.</li>
          </ol>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/workbench" className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">Open the workbench →</Link>
            <Link href="/sample-report" className="inline-flex items-center justify-center rounded-lg border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-200 hover:border-zinc-500">See a finished sample first</Link>
          </div>

          <p className="mt-8 text-sm text-zinc-500">Like it? <Link href="/pricing" className="text-zinc-300 underline underline-offset-4">Pick a plan</Link> — founding access keeps a discounted rate for life.</p>
        </section>
      </div>
    </main>
  );
}
