# Visual Smoke Report — Valuator Pro (commercial-launch-wrapper)

Method: `pnpm dev` (Next 15 / Turbopack) on `localhost:3000`, headless-Chrome screenshots of every
route, visually reviewed. "Build passed" is not "it sells" — so we looked.

## Critical defect found AND fixed
**Every route rendered as a Next.js build-error overlay in dev** —
`Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'` (from
`app/layout.tsx`, Geist font). Cause: a stray `pnpm-lock.yaml` in a parent directory made
Turbopack infer the **wrong workspace root**, breaking `next/font/google` resolution. `next build` was
unaffected (dev-only). **Fix:** pinned `turbopack.root` in `next.config.ts`. Re-ran — all routes now
render. *(This is exactly the kind of thing "it compiles" hides.)*

## Route status (after fix)
| Route | Status | Notes |
|---|---|---|
| `/` (landing) | ✅ pass | Clean, centered, professional. Hero value prop clear; emerald CTAs to workbench / sample / pricing / demo. |
| `/pricing` | ✅ pass | Solo $49 / Pro $149 (highlighted) / Firm $399 / per-report $29. **Request-access fallback renders correctly** with "checkout configuring" subtext (Stripe env unset) — clear, not confusing. |
| `/sample-report` | ✅ pass | Clean; "Open the sample report" → `/report`, "Build one in the workbench". |
| `/demo` | ✅ pass | Rendered; same verified template; CTA → workbench, "no card required". |
| `/welcome` | ✅ pass | Rendered; post-checkout/-request start steps → workbench. |
| `/workbench` | ✅ pass | **Product intact** — governed Subject tab (USPAP SR 1-2), all six approach tabs, characteristics form. Not broken by the new landing. |
| `/studio` | ✅ pass | Old swarm dashboard **preserved** and reachable; **not** the front door (correct). |

## Checklist
- Centered layout ✅ · professional fee-appraiser tone ✅ · no AI-slop layout ✅
- Clear value proposition ✅ · no broken nav on the commercial pages ✅
- Stripe Payment Link fallback works when env missing ✅ · Request-access visible + not confusing ✅
- No broad "USPAP-compliant" guarantee **on the commercial pages** ✅ (uses "USPAP-aware")
- `/workbench` loads ✅ · `/studio` preserved + not front door ✅

## Remaining issues (not blockers to the smoke; operator decisions)
1. **`/studio` (old dashboard) still uses pre-existing "USPAP COMPLIANT" / "USPAP Compliance Score
   100%" language.** Pre-existing (not introduced here) and outside the buyer funnel. Per "do not
   redesign the product" I did not edit it — flagging for the operator to soften later.
2. **Stripe links not set** (expected) — buttons show "Request access". Wire env to go live.
3. **Runtime end-to-end not exercised** — I verified pages render, not a full assignment → PDF run
   (needs `OPENAI_API_KEY`). See REQUIRED_FIXES #4.

## Screenshots
`C:/Users/bsval/AppData/Local/Temp/val-smoke/{1-landing,2-pricing,3-sample-report,4-demo,5-welcome,6-workbench,7-studio}.png`

## Verdict
**Visual smoke PASSES.** A stranger appraiser can land, understand Valuator Pro in seconds, see pricing,
view a sample, and click **Pay or Request Access** without confusion — and the product (`/workbench`)
is intact behind it. The one critical defect (dev font/root) is fixed.
