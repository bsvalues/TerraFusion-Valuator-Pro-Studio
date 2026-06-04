import Link from "next/link";

export const metadata = {
  title: "Welcome — TerraFusion Valuator Pro",
  description: "You're set up. Here's how to start your first assignment.",
};

export default function Welcome() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-2xl px-6">
        <header className="py-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">TerraFusion <span className="text-emerald-400">Valuator Pro</span></Link>
        </header>

        <section className="py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Welcome</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">You're in. Let's get your first report out.</h1>
          <p className="mt-4 text-zinc-400">
            If you just subscribed — thank you. If you requested access — we'll confirm your account shortly and
            point you here. Either way, this is where you start.
          </p>

          <div className="mt-8 rounded-2xl border border-zinc-800 p-6">
            <h2 className="text-base font-semibold">Start here</h2>
            <ol className="mt-3 space-y-2 text-sm text-zinc-300">
              <li><span className="font-semibold text-emerald-400">1.</span> Open the workbench.</li>
              <li><span className="font-semibold text-emerald-400">2.</span> Set your subject + assignment conditions.</li>
              <li><span className="font-semibold text-emerald-400">3.</span> Run the three approaches, reconcile, draft the narrative.</li>
              <li><span className="font-semibold text-emerald-400">4.</span> Export your PDF.</li>
            </ol>
            <Link href="/workbench" className="mt-6 inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">Open the workbench →</Link>
          </div>

          <p className="mt-8 text-sm text-zinc-500">
            Questions or need a hand getting set up? Reach out and we'll help you finish your first assignment.
          </p>
        </section>
      </div>
    </main>
  );
}
