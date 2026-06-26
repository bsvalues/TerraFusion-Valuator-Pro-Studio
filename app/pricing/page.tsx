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
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6">
        <header className="flex items-center justify-between py-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">TerraFusion <span className="text-cyan-400">Valuator Pro</span></Link>
          <Link href="/workbench" className="text-sm text-muted-foreground hover:text-foreground">Open workbench →</Link>
        </header>

        <section className="py-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Launch pricing</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Test pricing while we onboard the first appraisers. <span className="text-cyan-400">Founding access:</span> the
            first 10 users keep a discounted rate for life.
          </p>
        </section>

        <section className="grid gap-5 sm:grid-cols-3">
          {TIERS.map((t) => {
            const b = buy(t.url, t.name);
            return (
              <div key={t.name} className={`rounded-2xl border p-6 ${t.featured ? "border-cyan-500/60 bg-cyan-500/5" : "border-border"}`}>
                {t.featured && <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-cyan-400">Most popular</div>}
                <h3 className="text-lg font-semibold">{t.name}</h3>
                <div className="mt-2"><span className="text-3xl font-bold">{t.price}</span><span className="text-muted-foreground">{t.cadence}</span></div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {t.points.map((p) => <li key={p}>· {p}</li>)}
                </ul>
                <a href={b.href} className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold ${t.featured ? "bg-cyan-500 text-background hover:bg-cyan-400" : "border border-border text-foreground hover:border-muted-foreground"}`}>{b.label}</a>
                {!b.live && <p className="mt-2 text-center text-xs text-muted-foreground">checkout configuring — request access and we’ll set you up</p>}
              </div>
            );
          })}
        </section>

        <section className="mt-6 rounded-2xl border border-border p-6 sm:flex sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Per-report export</h3>
            <p className="mt-1 text-sm text-muted-foreground">Low volume? Pay <span className="font-semibold text-foreground">$29</span> per finished report instead of a subscription.</p>
          </div>
          <a href={perReport.href} className="mt-4 inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:border-muted-foreground sm:mt-0">{perReport.live ? "Buy a report credit" : "Request access"}</a>
        </section>

        <footer className="py-10 text-center text-sm text-muted-foreground">
          Prices are launch/test rates and may change. <Link href="/sample-report" className="text-foreground underline underline-offset-4">See a sample report</Link> before you buy.
        </footer>
      </div>
    </main>
  );
}
