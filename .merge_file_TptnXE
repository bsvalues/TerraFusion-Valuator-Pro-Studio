# TerraFusion Valuator Pro Studio

**A production-grade, USPAP-compliant commercial fee appraisal platform** built for Certified General Appraisers. Provides a governed, evidence-anchored analytical workbench covering all three approaches to value with AI narrative generation and PDF export.

---

## Architecture Overview

```
TerraFusion Valuator Pro Studio
├── Governance Spine (SubjectWorkbenchContext)
│   ├── SubjectContext — assignment conditions anchor
│   ├── RunRecord — every analytical run is logged
│   └── EvidenceRef — every output cites its sources
│
├── Phase B: Cost Approach (CostForge)
│   ├── lib/costforge-vault.ts
│   └── app/api/cost-approach/calculate/
│
├── Phase C: Sales Comparison (CompVault + OLS Regression)
│   ├── lib/comp-vault.ts
│   ├── lib/regression-engine.ts
│   └── app/api/sales-comparison/calculate/
│
├── Phase D: Income Approach (IncomeVault)
│   ├── lib/income-vault.ts — Direct Cap, DCF, IRR, sensitivity matrix
│   └── app/api/income-approach/calculate/
│
├── Phase E: Value Reconciliation
│   ├── lib/reconciliation-vault.ts — USPAP SR 1-6 weighted value
│   ├── app/api/reconciliation/calculate/
│   └── app/api/narrative/ — AI narrative generation (GPT-4.1-mini)
│
├── Phase F: Data Persistence
│   ├── lib/supabase.ts — Supabase client + schema types
│   ├── lib/persistence.ts — CRUD with graceful in-memory degradation
│   └── app/api/orders/ — Order management API
│
└── Phase G: PDF Export
    ├── app/api/export-pdf/ — HTML-to-PDF report generation
    └── app/api/appraiser-profile/ — License and firm data
```

---

## Features

### Analytical Engines

| Engine | Approach | UAD Fields | USPAP Rule |
|---|---|---|---|
| CostForge | Cost | CST_RCN, CST_DEPR, CST_LAND | SR 1-4(b) |
| CompVault + OLS Regression | Sales Comparison | COMP_1-6, ADJ_* | SR 1-4(a) |
| IncomeVault | Income (Direct Cap + DCF) | INC_PGI, INC_NOI, INC_CAP_RATE, INC_DCF | SR 1-4(c) |
| ReconciliationVault | Value Reconciliation | REC_FINAL_VALUE, REC_WEIGHTED_VALUE | SR 1-6 |

### AI Narrative Generation

Eight USPAP-compliant narrative sections via GPT-4.1-mini:
Property Description, Scope of Work, Market Conditions, Highest and Best Use,
Cost Approach, Sales Comparison, Income Approach, Value Reconciliation.

### Data Persistence

Supabase-backed with graceful in-memory degradation when not configured.

---

## Getting Started

### Installation

```bash
git clone https://github.com/bsvalues/TerraFusion-Valuator-Pro-Studio.git
cd TerraFusion-Valuator-Pro-Studio
pnpm install
cp .env.example .env.local
# Edit .env.local and set OPENAI_API_KEY
pnpm dev
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI API key for narrative generation |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anon key |

### Database Setup (Optional)

Run the SQL migration from `lib/supabase.ts` (`SUPABASE_MIGRATION_SQL`) in the Supabase SQL editor.

### Testing

```bash
pnpm test
```

**124 tests across 4 suites — all passing.**

| Suite | Tests | Coverage |
|---|---|---|
| phase-a-b.test.ts | 30 | Governance spine, CostForge |
| phase-c.test.ts | 30 | CompVault, OLS regression |
| phase-d.test.ts | 30 | IncomeVault, DCF, IRR, sensitivity |
| phase-efg.test.ts | 34 | Reconciliation, persistence, governance audit |

---

## Governance Policy

1. **No cost manual brand name references** — Audited in every test run.
2. **No run without a SubjectContext** — All API endpoints enforce this.
3. **No output without evidence** — Every calculation emits `EvidenceRef[]`.
4. **Reason codes required** — Every run requires a `reason_code`.
5. **USPAP SR compliance** — Each engine maps to its specific Standards Rule.

---

## Deployment

Deploy to Vercel: import the repo, set environment variables, deploy.

## License

Proprietary — TerraFusion Appraisal Systems. All rights reserved.
