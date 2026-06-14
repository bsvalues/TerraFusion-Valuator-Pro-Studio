# Gap Analysis — a la mode TOTAL vs. TerraFusion Professional Suite

Blunt. **Capability · Legacy · Current TFPS · Gap · Risk if missing · Recommended recovery · Priority.** Where TFPS is *worse* than 20-year-old software, it says so.

| Capability | Legacy (a la mode) | Current TFPS | Gap | Risk if missing | Recovery | Pri |
|---|---|---|---|---|---|---|
| **Order/assignment intake** | Full order metadata + AMC intake | Title-only assignment | **TFPS far worse** | Can't represent a real engagement | AssignmentContext + fields | P0 |
| **Subject property model** | Deep UAD subject (legal, zoning, HBU, flood, tax, occupancy) | Address + a few fields | TFPS worse | Reports lack required subject data | Extend SubjectContext + enums | P1 |
| **Comp adjustment grid (persisted)** | Multi-comp grid, per-line adj, sup/inf flags, persisted | Grid in-session; **only a summary persists** | **TFPS worse** | Core of residential appraisal not durable; reconciliation/report can't show real grid | Persisted Comp + AdjustmentLine model | P0 |
| **Comp database / search / verification** | COMPSIMPORTER + IDC geocode + verification | none | TFPS worse | Manual comps only | Comp DB (later) / import | P2 |
| **Cost approach** | Full incl. entrepreneurial incentive, site | CostForge engine (solid) | Minor | Few cost components missing | Add components | P2 |
| **Income approach** | Rent/expense comps, NOI, cap, GRM, DCF | IncomeForge engine (solid) | Minor | Comps for income missing | Add rent/expense comps | P2 |
| **Sketch → GLA** | DaVinci derives area, transfers | none | TFPS worse | Manual GLA, no floor plan exhibit | Sketch module (later) | P2 |
| **Reconciliation → certify** | Weighting + final, file lock | Reconciliation + **write_high certify + append-only trace** | **TFPS BETTER** | — | Keep; add rationale prompts | — |
| **Workfile = evidence bundle** | One `.ZAP` w/ photos, docs, sketch, history | Postgres rows + **append-only audit** but **no binary attachments** | Mixed: governance better, attachments worse | USPAP workfile incomplete (no photos/docs) | Attachment model in Evidence | P1 |
| **Review / QC** | Versioned rule library incl. **bias detection**, completeness, USPAP | ReviewForge (~8 generic checks) | TFPS worse (depth) | Misses bias + form-specific completeness | Expand ReviewForge ruleset + bias | P1 |
| **Quicklists / phrase library** | Canned values + boilerplate, cloud-synced | none | TFPS worse | Slow data entry, no boilerplate | Quicklists + phrase library | P1 |
| **Report output fidelity** | UAD-form-accurate pages | Generic HTML | **TFPS worse** | Output not a deliverable appraisal | Form-accurate templates (1004 first) | P1 |
| **PDF export** | Native PDF | HTML only | TFPS worse | No PDF deliverable | Print-to-PDF | P1 |
| **MISMO XML export** | Full MISMO for UCDP/AMC | none | TFPS worse | Can't deliver to lenders/AMCs | MISMO export | P1/P2 |
| **Addenda / certification / A&LC** | Template library | none | TFPS worse | No cert/A&LC = not USPAP report | Addenda + cert + AppraiserProfile | P1 |
| **AMC/UCDP delivery + e-sign** | Many plugins, TSA e-sign | none | TFPS worse | No delivery path | Park (commercial lane) | P3 |
| **Governance: audit / write-lanes / sovereign AI / honest truth-states** | Minimal (access log) | **Append-only AuditTrace, write_low/high, sovereign AI, queryable workfile, honest module states** | **TFPS BETTER** | — | Keep — this is TFPS's moat | — |
| **Cross-platform / web** | Windows desktop only | Web (Next.js) | **TFPS better** | — | Keep | — |
| **Save/reload persistence** | `.ZAP`/`.adj` files | Postgres WorkfileStore (fail-loud) | Even (TFPS cleaner) | — | Keep | — |

## Verdict
- **TFPS wins on substrate:** governance (append-only audit, write-lanes), sovereign AI, honest truth-states, web delivery, fail-loud persistence, queryable workfile. These are genuinely better than legacy and are the moat.
- **Legacy wins on production depth:** the things that make it a *usable appraisal tool today* — order/subject depth, the persisted comp grid, sketch→GLA, the workfile evidence bundle, the QC rule library (esp. bias), quicklists, and form-accurate PDF + MISMO export + delivery.
- **The honest answer to the WO's key question** — *what did the old software know how to do that TFPS still does not?* — Produce a **deliverable, USPAP-compliant appraisal report from a fully-modeled assignment**: a real order, a deep subject, a persisted multi-comp adjustment grid, a sketch-derived GLA, a bundled evidence workfile, automated QC (incl. bias), and a form-accurate PDF/MISMO deliverable. TFPS has the spine and the engines but not yet this depth.

Top-10 lists and the build sequence are in `RECOVERY_BACKLOG.md`.
