# Stripe Setup — go-live checklist (Valuator Pro)

The pages are already wired. This is the **account work** that turns "Request access" into real
checkout. ~10 minutes. No code changes required.

---

## 1. Create four Stripe Payment Links
Stripe Dashboard → **Product catalog** (create each product), then **Payment Links** → create a link per product.

| Product | Price | Billing |
|---|---|---|
| Solo Appraiser | **$49** | recurring · monthly |
| Pro Appraiser | **$149** | recurring · monthly |
| Firm | **$399** | recurring · monthly |
| Per-report Export | **$29** | **one-time** |

Tips:
- For the 3 subscriptions: price type = **Recurring**, interval = **Monthly**.
- For per-report: price type = **One time**.
- Under each Payment Link → **After payment**, set the redirect to your deployed
  **`/welcome`** page (e.g. `https://<your-domain>/welcome`).
- Copy each link's URL (looks like `https://buy.stripe.com/xxxx…`).

---

## 2. Set environment variables (Vercel → Project → Settings → Environment Variables)
Add for **Production** and **Preview**:

```
NEXT_PUBLIC_STRIPE_SOLO_URL    = https://buy.stripe.com/...   # Solo link
NEXT_PUBLIC_STRIPE_PRO_URL     = https://buy.stripe.com/...   # Pro link
NEXT_PUBLIC_STRIPE_FIRM_URL    = https://buy.stripe.com/...   # Firm link
NEXT_PUBLIC_STRIPE_REPORT_URL  = https://buy.stripe.com/...   # Per-report link
NEXT_PUBLIC_CONTACT_EMAIL      = you@yourdomain.com           # powers the fallback
# AI is OPTIONAL — sovereign by design; default needs no external AI:
AI_PROVIDER                    = template                     # template | terrafusion | openai | disabled
OPENAI_API_KEY                 = sk-...                       # OPTIONAL — only if AI_PROVIDER=openai
```
Then **redeploy** (Vercel does this automatically on the next push, or trigger it manually).

> `NEXT_PUBLIC_*` vars are read in the browser, so a **redeploy is required** after changing them.

---

## 3. Where each variable is used
- `NEXT_PUBLIC_STRIPE_SOLO/PRO/FIRM/REPORT_URL` → **`app/pricing/page.tsx`** (the `buy()` helper). If a
  link is set, that tier's button becomes **"Choose <tier>"** linking to Stripe. If unset, it shows
  **"Request access."**
- `NEXT_PUBLIC_CONTACT_EMAIL` → **`app/pricing/page.tsx`** fallback: "Request access" becomes a
  `mailto:` to this address. If unset, it links to `/welcome`.
- `AI_PROVIDER` / `OPENAI_API_KEY` / `TERRAFUSION_AI_ENDPOINT` → **`app/api/narrative`** via the
  TerraFusion AI gateway. **`OPENAI_API_KEY` is OPTIONAL** — only used when `AI_PROVIDER=openai`. The
  default (`template`) drafts a structured scaffold with **no external AI**. See SOVEREIGN_AI_ALIGNMENT.md.

---

## 4. Verify (after env is set + redeploy)
- `/pricing` — each configured tier button reads **"Choose …"** and **opens Stripe** in checkout.
- Any tier **without** a link still shows **"Request access"** (no broken buttons).
- Complete a test checkout → you land on **`/welcome`**.
- `/workbench` still loads and runs.

---

## 5. Language guardrails (don't undo these)
- ✅ Use: **"USPAP-aware"**, **"evidence-anchored"**, **"workfile discipline"**, "AI-assisted narrative",
  "supports all three approaches to value", "PDF report export".
- ❌ Do **not** claim: "USPAP-compliant" as a guarantee, "certified compliant", or "guaranteed
  defensible." The appraiser remains the author of record.

---

## 6. Post-Stripe verification checklist
```
[ ] pnpm build           # passes
[ ] pnpm dev             # starts on localhost:3000
[ ] open /pricing        # all four buttons render
[ ] click Solo / Pro / Firm / Per-report
[ ] each opens its Stripe checkout URL
[ ] Request-access fallback is GONE for every tier that has a link
[ ] /welcome renders
[ ] /workbench still loads
```

When all boxes are checked and the env vars are live in Production, **you can take the first dollar.**
