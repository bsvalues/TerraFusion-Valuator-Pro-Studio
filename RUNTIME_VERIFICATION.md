# Runtime Verification — Valuator Pro (commercial-launch-wrapper)

"Make sure the drawers open." Verified the engine + API integration + the report deliverable.
UI not driven click-by-click (no interactive browser available) — verified the layers beneath it.

## Results
| Check | How | Result |
|---|---|---|
| Analytical engines | `npx jest` (cost / income / reconciliation / regression vaults) | ✅ **168/168 tests pass**, 5 suites |
| Server health | `GET /api/health` | ✅ 200; runs in **in-memory mode** without Supabase (graceful) |
| **Governed-run contract** | `POST /api/reconciliation/calculate` | ✅ **422** without `reason_code` (min 3) and without `correlation_id`/`run_id` — the TerraFusion governance spine is **enforced**, not cosmetic |
| Report deliverable | `POST /api/export-pdf` (full `ReportData`) | ✅ **200, ~22 KB** print-ready report HTML (subject, comps, **reconciliation**, USPAP citations, Certified General block). *Note: "PDF export" = print-ready HTML → browser print, not a server-side binary.* |
| AI narrative (OpenAI) | `POST /api/narrative` | ⚠️ **not verified** — no `OPENAI_API_KEY` set locally. Route exists and is gated; set the key in the deploy env and verify there. |

## Verdict
Runtime **passes on everything testable without external keys**: the engines compute, the governed-run
contract is enforced, and the report deliverable generates with real content. The one unverified path
(AI narrative) is **environment-gated on `OPENAI_API_KEY`**, not a code defect.

## Confirms the integrity-pass claim
The product doesn't just *say* "evidence-anchored / governed" — the reconciliation API refuses to run
without a `reason_code` + `run_id`, and the report carries the reconciliation + citations. The spine is real.

## Next
1. Push `7a6ae85` (integrity pass) to PR #8.
2. Set deploy env: `OPENAI_API_KEY` (enables + lets us verify narrative), Stripe Payment Link vars, `NEXT_PUBLIC_CONTACT_EMAIL`.
3. Deploy; verify narrative end-to-end on the deploy.
4. Then Stripe go-live (STRIPE_SETUP.md) → soft launch.
