import Link from "next/link";

/**
 * Pricing — launch (test) prices. Buttons use Stripe Payment Links from env;
 * if a link isn't configured yet, the button degrades to "Request access" instead
 * of breaking. Set these in the deployment env:
 *   NEXT_PUBLIC_STRIPE_SOLO_URL, NEXT_PUBLIC_STRIPE_PRO_URL,
 *   NEXT_PUBLIC_STRIPE_FIRM_URL, NEXT_PUBLIC_STRIPE_REPORT_URL
 *   NEXT_PUBLIC_CONTACT_EMAIL (used for the Request-access fallback)
 */

export const metadata = {
  title: "Pricing — TerraFusion Valuator Pro",
  description: "Launch pricing for the commercial fee-appraisal workbench. Solo, Pro, Firm, and per-report.",
};

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";

function buy(url: string | undefined, tier: string): { href: string; label: string; live: boolean } {
  if (url) return { href: url, label: `Choose ${tier}`, live: true };
  const href = CONTACT ? `mailto:${CONTACT}?subject=${encodeURIComponent(`Valuator Pro access — ${tier}`)}` : "/welcome?request=1";
  return { href, label: "Request access", live: false };
}

const TIERS = [
  { name: "Solo Appraiser", price: "$49", cadence: "/month", url: process.env.NEXT_PUBLIC_STRIPE_SOLO_URL,
    points: ["One appraiser", "All three approaches", "AI-assisted narrative", "PDF report export"] },
  { name: "Pro Appraiser", price: "$149", cadence: "/month", featured: true, url: process.env.NEXT_PUBLIC_STRIPE_PRO_URL,
    points: ["Everything in Solo", "Higher run volume", "Regression + reconciliation", "Priority support"] },
  { name: "Firm", price: "$399", cadence: "/month", url: process.env.NEXT_PUBLIC_STRIPE_FIRM_URL,
    points: ["Multiple appraisers", "Shared workfiles", "Order management", "Firm onboarding"] },
];

export default function Pricing() {
  const perReport = buy(process.env.NEXT_PUBLIC_STRIPE_REPORT_URL, "Per-report");
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-6">
        <header className="flex items-center justify-between py-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">TerraFusion <span className="text-emerald-400">Valuator Pro</span></Link>
          <Link href="/workbench" className="text-sm text-zinc-400 hover:text-zinc-200">Open workbench →</Link>
        </header>

        <section className="py-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Launch pricing</h1>
          <p className="mx-auto mt-3 max-w-xl text-zinc-400">
            Test pricing while we onboard the first appraisers. <span className="text-emerald-400">Founding access:</span> the
            first 10 users keep a discounted rate for life.
          </p>
        </section>

        <section className="grid gap-5 sm:grid-cols-3">
          {TIERS.map((t) => {
            const b = buy(t.url, t.name);
            return (
              <div key={t.name} className={`rounded-2xl border p-6 ${t.featured ? "border-emerald-500/60 bg-emerald-500/5" : "border-zinc-800"}`}>
                {t.featured && <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">Most popular</div>}
                <h3 className="text-lg font-semibold">{t.name}</h3>
                <div className="mt-2"><span className="text-3xl font-bold">{t.price}</span><span className="text-zinc-500">{t.cadence}</span></div>
                <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                  {t.points.map((p) => <li key={p}>· {p}</li>)}
                </ul>
                <a href={b.href} className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold ${t.featured ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400" : "border border-zinc-700 text-zinc-200 hover:border-zinc-500"}`}>{b.label}</a>
                {!b.live && <p className="mt-2 text-center text-xs text-zinc-600">checkout configuring — request access and we’ll set you up</p>}
              </div>
            );
          })}
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 p-6 sm:flex sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Per-report export</h3>
            <p className="mt-1 text-sm text-zinc-400">Low volume? Pay <span className="font-semibold text-zinc-200">$29</span> per finished report instead of a subscription.</p>
          </div>
          <a href={perReport.href} className="mt-4 inline-flex items-center justify-center rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:border-zinc-500 sm:mt-0">{perReport.live ? "Buy a report credit" : "Request access"}</a>
        </section>

        <footer className="py-10 text-center text-sm text-zinc-500">
          Prices are launch/test rates and may change. <Link href="/sample-report" className="text-zinc-300 underline underline-offset-4">See a sample report</Link> before you buy.
        </footer>
      </div>
    </main>
  );
}
