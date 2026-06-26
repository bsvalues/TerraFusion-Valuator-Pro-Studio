# Launch Readiness — Valuator Pro (commercial-launch-wrapper)

Status of the app for taking money. Code-presence verified by inspection; **runtime items marked
[verify on deploy]** — I have not run the full app end-to-end yet.

## What exists (the product, already built)
- **Next.js 15 app router** + pnpm. Tailwind. Supabase optional persistence (in-memory fallback).
- **`/workbench`** — the governed fee-appraiser workspace: Subject → Cost (CostForge) → Sales
  (comparison + regression) → Income → Reconciliation → Report. Runs are logged; outputs cite evidence.
- **`/report`** — report view.
- **API routes:** `export-pdf`, `narrative` (needs `OPENAI_API_KEY`), `appraiser-profile`, `orders`,
  `valuations`, `market`, `risk`, `regression-extraction`, `legacy-import`, `health`.

## What this branch adds (the commercial wrapper — no product changes)
- **`/`** — public marketing landing (was the swarm dashboard; that moved to **`/studio`**).
- **`/pricing`** — Solo/Pro/Firm/per-report; Stripe Payment Links via env, Request-access fallback.
- **`/sample-report`** — routes to the live report as an illustrative sample.
- **`/demo`** — run a demo assignment in the workbench (no card).
- **`/welcome`** — post-checkout / post-request start instructions.

## Demoable today
A stranger appraiser can: land on `/`, understand the value in seconds, see `/pricing`, view a
`/sample-report`, and open `/workbench` to try it. **That path is the launch goal and it's in place.**

## What blocks taking money (see REQUIRED_FIXES.md)
1. **Stripe Payment Links not created** — env vars unset, so buttons show "Request access" (safe, but no
   self-serve payment yet).
2. **No entitlement gating** — `/workbench` is open to anyone. For launch this is acceptable (sell
   access + onboarding to the first 10, gate later) — but it's a decision to make consciously.
3. **`OPENAI_API_KEY` required in prod** for narrative drafting. [verify on deploy]
4. **[verify on deploy]:** `/workbench` full run end-to-end; `export-pdf` output; `/report` renders for
   the sample link; behavior with no Supabase (in-memory).

## Honest note
"USPAP-aware" / "evidence and workfile discipline" language is used throughout — **not** a compliance
guarantee. The appraiser remains the author of record.
