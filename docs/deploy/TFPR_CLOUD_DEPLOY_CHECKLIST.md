# TFPR Cloud Deploy Checklist (Slice 1)

Deploy the TerraFusion Professional Runtime (Slice 1) to a cloud environment
(Vercel + a cloud Postgres/Supabase). This is the step between "runtime-proven
locally" and "live URL."

> **No secrets in this file.** Do not paste connection strings, keys, or
> passwords here or into git. Credentials are entered by the operator directly in
> the hosting provider's dashboard. This agent does not enter credentials or
> configure billing.

## Prerequisites
- [ ] A cloud **Postgres/Supabase** project exists (this is the v0 `WorkfileStore`
      backing — vendor implementation, not product identity).
- [ ] Network: the database is reachable from Vercel (Supabase Postgres
      connection string, or any managed Postgres). The local docker
      `terrafusion-postgres-dev` is **not** reachable from Vercel.

## Database
- [ ] Create the application database (or use the Supabase default DB).
- [ ] Run the migration `lib/tfpr/runtime/migrations/001_init.sql` against it
      (Supabase SQL editor, or `psql "$DATABASE_URL" -f 001_init.sql`).
- [ ] Confirm the 7 tables exist: `tfpr_assignments`, `tfpr_workfile_subjects`,
      `tfpr_workfile_runs`, `tfpr_workfile_evidence`, `tfpr_workfile_drafts`,
      `tfpr_certified_values`, `tfpr_trace_events`.

## Vercel environment variables (set in the Vercel dashboard, not in git)
- [ ] `DATABASE_URL` — the cloud Postgres connection string.
- [ ] `AI_PROVIDER=template` — sovereign default; works with no external AI.
- [ ] `OPENAI_API_KEY` — **not required** (Slice 1 uses the template provider only).
- [ ] `TFPR_TENANT_ID` — optional; defaults to `tenant_dev` if unset (single-tenant
      stub until real auth/multi-tenancy lands).
- [ ] `TFPR_ENTITLEMENT_TIER` — optional; defaults to `trial`. Set to `expired`
      only to test the gate.

## Fail-loud sanity (by design)
- [ ] With `DATABASE_URL` **unset**, the app must FAIL LOUD on any workfile
      operation (no fake reload success). This is correct behavior — confirm it
      errors rather than silently "working."

## Post-deploy verification (run against the deployed URL)
- [ ] `GET /assignments` loads (My Assignments front door — not pricing).
- [ ] Create an assignment ("Start New") succeeds.
- [ ] **Reload persistence**: reload the page; the assignment is still there.
- [ ] Open the workfile; save subject; reload — subject persists.
- [ ] Evidence ledger: add an item; it appears and persists after reload.
- [ ] MUSE: draft the reconciliation narrative; it is marked **non-final
      (write_low)** and stored in the workfile.
- [ ] Certify: blocked without confirm + reason (expect a validation error);
      then certify with confirm + reason succeeds (`write_high`).
- [ ] Audit view: shows the append-only trace including `certified` (write_high)
      with the reason code.

## Guardrails (do not do as part of this deploy)
- [ ] Do **not** merge PR #8 (`commercial-launch-wrapper`) — it stays frozen.
- [ ] Do **not** wire Stripe / billing.
- [ ] Do **not** claim "Powered by TerraFusion OS" — Slice 1 badge is
      "Built on TerraFusion Professional Runtime (Slice 1)" until export + the
      remaining "inside" criteria land.

## Notes
- The deployed app is the Valuator Pro **module** running inside TFPR — first
  screen is My Assignments, governed by the runtime (workfile + MUSE + write-lanes
  + append-only audit + entitlement).
- Decision record + spec live in the OS repo:
  `docs/architecture/TFPR_DECISION_RECORD.md` (and the spec/plan beside it).
