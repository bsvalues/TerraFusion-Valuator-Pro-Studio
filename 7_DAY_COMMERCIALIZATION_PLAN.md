# 7-Day Commercialization Plan — Valuator Pro

Goal: a stranger appraiser can understand it in 10 seconds and has a visible path to **pay, request
access, or try a demo** — and the first paid transaction happens this week.

## Day 1 — Ship the wrapper
- Merge `commercial-launch-wrapper`; deploy to Vercel.
- Set `OPENAI_API_KEY`, `NEXT_PUBLIC_APP_URL`. Smoke `/`, `/pricing`, `/sample-report`, `/demo`,
  `/welcome`, `/workbench`.

## Day 2 — Make it real
- Run a full demo assignment in `/workbench`; export the PDF; confirm `/report` + `export-pdf` work.
- Fix anything in REQUIRED_FIXES #4 that breaks the end-to-end run.

## Day 3 — Payment path
- Create the 4 Stripe Payment Links; set the env vars + `NEXT_PUBLIC_CONTACT_EMAIL`.
- Confirm pricing buttons go live (and the Request-access fallback works without them).

## Day 4 — Proof + offer
- Capture a genuine sample report behind `/sample-report`.
- Finalize founding-10 offer copy. Confirm careful language (no compliance guarantees).

## Day 5 — First appraisers
- Line up ~5 commercial fee appraisers (your network / state CG group / forums).
- Send the **demo link** (self-serve) — not a sales pitch. Ask them to run one assignment.

## Day 6 — Convert
- Collect feedback; fix the top friction point.
- First checkout live; onboard the first paid user manually (founding rate).

## Day 7 — Review + next
- What converted, what didn't, what to gate next.
- Hand off to **Housing Truth Pro** as money lane #2 (freemium + monthly report).

**The week's single success metric:** one appraiser pays (or commits as a founding user).
