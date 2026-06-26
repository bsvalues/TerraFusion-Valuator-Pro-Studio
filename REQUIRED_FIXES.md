# Required Fixes — minimum before taking money

Ordered. None require touching the analytical engines.

1. **Create 4 Stripe Payment Links** (Solo $49/mo, Pro $149/mo, Firm $399/mo, per-report $29) and set:
   ```
   NEXT_PUBLIC_STRIPE_SOLO_URL=
   NEXT_PUBLIC_STRIPE_PRO_URL=
   NEXT_PUBLIC_STRIPE_FIRM_URL=
   NEXT_PUBLIC_STRIPE_REPORT_URL=
   NEXT_PUBLIC_CONTACT_EMAIL=        # used for the Request-access fallback
   ```
   Until set, pricing buttons safely degrade to "Request access" — not broken, but no self-serve payment.

2. **AI narrative is provider-abstracted (sovereign by design) — `OPENAI_API_KEY` is OPTIONAL, not a
   blocker.** Default `AI_PROVIDER=template` drafts a structured scaffold with **no external AI**. Only
   set `OPENAI_API_KEY` if you choose `AI_PROVIDER=openai`, or point `TERRAFUSION_AI_ENDPOINT` at the
   sovereign provider. See `SOVEREIGN_AI_ALIGNMENT.md`.

3. **Decide the launch access model.** `/workbench` is open today. Recommended launch posture: keep it
   open, sell **access + onboarding** to the first 10 manually, add entitlement gating *after* first
   revenue. (Don't block launch building auth.)

4. **Verify on deploy [smoke test]:**
   - `/workbench`: subject → cost → sales → income → reconcile → narrative → PDF, end to end.
   - `export-pdf` produces a real file.
   - `/report` renders for the `/sample-report` link.
   - app runs with no Supabase configured (in-memory) and with it (persistent).

5. **Set `NEXT_PUBLIC_APP_URL`** and **deploy** the `commercial-launch-wrapper` branch (Vercel).

6. **Capture one real sample report** (run a demo assignment, export the PDF) so `/sample-report` shows
   genuine output.

That's the whole list. 1–2 are the only hard blockers to a first paid transaction.
