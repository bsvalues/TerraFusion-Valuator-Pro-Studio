# Recovery Backlog — Legacy → TFPS

Implementation tickets to bring recovered legacy capability into TerraFusion Professional Suite. **Recon output only — no code implemented.** Each ticket: ID · Title · Module · Problem · Legacy evidence · Proposed TFPS behavior · Acceptance · Files likely touched · Priority · Agent lane · Do/Don't.

---

### REC-001 — Assignment/Order context
- **Module:** TFPS:Valuator / TFPR:Workfile
- **Problem:** TFPS assignment captures only a title; no client/lender/borrower/intended-users/dates/fee/order#.
- **Legacy evidence:** `OrderToXML.map` (`FNMA_FILENUMBER`,`LENDERCASENUMBER`,`FEE`,`APPRDATE`,`DUE_DATE`); Mercury order intake.
- **Proposed:** `AssignmentContext` contract + a Valuator "Assignment" surface; persist to WorkfileStore (extend subject JSON or new column); show on Command Center.
- **Acceptance:** create assignment with client/lender/intended use+users/effective+report+inspection dates/rights/fee → persists → reload → appears in report header. ReviewForge flags missing required assignment fields.
- **Files:** `lib/tfpr/contracts/*`, `lib/subject-context.ts`, `app/(runtime)/assignments/[id]/[module=subject]`, `/api/tfpr/assignments/[id]/subject`.
- **Priority:** P0 · **Lane:** runtime+suite · **Do:** keep write_low for edits. **Don't:** add billing/Stripe.

### REC-002 — Persisted comp adjustment grid
- **Module:** TFPS:CompForge / TFPR:Workfile / TFPR:Evidence
- **Problem:** Comp grid runs in-session; only a `compSummary` persists. The core of residential appraisal isn't durable; reconciliation/report can't show the real grid.
- **Legacy evidence:** `GC1_BASERATE1`, `GC1_ADJSALEPRC_ADJ`, `..._COMP2SUB_SUP/INF`, `AdjustmentTypes.xml`.
- **Proposed:** `CompRecord` + `AdjustmentLine` contracts; persist full grid (per-comp sale, date, source, per-line adjustments, adjusted indication) in a `tfpr_workfile_comps` table or rich run snapshot; hydrate on reload; feed reconciliation + report + review.
- **Acceptance:** enter ≥3 comps with adjustments → reload shows full grid → reconciliation reads adjusted indications → report shows comp grid → review flags unsupported adjustments.
- **Files:** `lib/tfpr/contracts/*`, `lib/comp-vault.ts`, `components/sales-comparison-panel.tsx`, `/api/tfpr/.../runs` or new comps route, migration.
- **Priority:** P0 · **Lane:** suite+runtime · **Do:** single source (no parallel path). **Don't:** fabricate comps.

### REC-003 — Workfile binary attachments (photos/docs)
- **Module:** TFPR:Evidence / TFPR:Workfile
- **Problem:** EvidenceRef stores citations only; no photos/maps/docs/sketch attachments. USPAP workfile incomplete.
- **Legacy evidence:** `.ZAP` `Photos/`, `Workfile/` (contract/tax/MLS/assessor/plat PDFs), `Sketch/`.
- **Proposed:** attachment model — object/blob store + `EvidenceRef` pointing to it (tenant-scoped, audited); upload UI in Evidence module.
- **Acceptance:** attach a photo + a PDF to an assignment → persists → reload → appears in Evidence + report exhibits; audit `evidence_appended` with attachment ref.
- **Files:** contracts, runtime store, evidence route + module, migration.
- **Priority:** P1 · **Lane:** runtime · **Do:** sanitize/scan uploads. **Don't:** store secrets in URLs.

### REC-004 — ReviewForge ruleset depth + bias detection
- **Module:** TFPS:ReviewForge / TFPR:MUSE
- **Problem:** ReviewForge has ~8 generic checks; legacy has a versioned rule library incl. **bias-language detection** and form-specific completeness.
- **Legacy evidence:** `ReviewScripts/Review.fdb`, `BiasWordsMasterList.txt`, `BiasWarningsExclusions.xml`, `ReviewScriptConfig.xml`.
- **Proposed:** expand `lib/tfps/review.ts` — add completeness-by-form, unsupported-adjustment checks (uses REC-002), and a **bias-language scan** over narratives/drafts (own word list, not a la mode's); severity + module link; emit `review_run`.
- **Acceptance:** report with biased phrasing → flagged; missing form-required field → blocker; unsupported adjustment → warning.
- **Files:** `lib/tfps/review.ts`, `/api/tfpr/.../review`, review module.
- **Priority:** P1 · **Lane:** suite · **Do:** flag only, never auto-edit. **Don't:** copy a la mode's bias list verbatim.

### REC-005 — ReportForge: form-accurate template + PDF
- **Module:** TFPS:ReportForge
- **Problem:** Report is generic HTML; not a deliverable UAD-form-accurate appraisal; no PDF.
- **Legacy evidence:** `Active.fdb`, `Contents.xml`, `PrintProfiles.xml` (PDF), form pages.
- **Proposed:** form-accurate report template (start **1004/1004UAD**) binding SubjectContext + persisted runs + comp grid + reconciliation + certified value + exhibits; add **PDF** (print-to-PDF of the report route).
- **Acceptance:** export → 1004-structured report with real data + comp grid + cert; downloadable PDF; `report_assembled` traced.
- **Files:** `lib/tfpr/runtime/report-package.ts`, report route, templates.
- **Priority:** P1 · **Lane:** suite · **Do:** draw only from workfile. **Don't:** reproduce a la mode template text.

### REC-006 — Addenda / certification / A&LC + AppraiserProfile
- **Module:** TFPS:ReportForge / TFPR:MUSE
- **Problem:** No certification, assumptions & limiting conditions, or addenda; no appraiser identity/license/signature.
- **Legacy evidence:** `Custom Addenda/*.tx`, `AppSettings.xml` office, TSA.
- **Proposed:** `AppraiserProfile` (license/office/signature) + standard cert + A&LC sections (own wording) as MUSE `write_low` drafts the appraiser edits; certify (`write_high`) binds into the cert block.
- **Acceptance:** report includes editable cert + A&LC + appraiser block; certify locks final value into cert with audit.
- **Files:** contracts, report-package, MUSE service, profile route.
- **Priority:** P1 · **Lane:** suite · **Don't:** assert "USPAP-compliant"; say "USPAP-aware".

### REC-007 — Quicklists + phrase library
- **Module:** TFPS (cross) / TFPR:MUSE
- **Problem:** No canned dropdown values or boilerplate; slow data entry.
- **Legacy evidence:** `Quicklists/`, `Phrase.xml`.
- **Proposed:** per-user Quicklists + a phrase library feeding form fields + MUSE drafts; tenant-scoped, persisted.
- **Acceptance:** add a quicklist value → reused across assignments; insert a phrase into a narrative draft.
- **Files:** contracts, store, UI fields.
- **Priority:** P1 · **Lane:** suite · **Don't:** import a la mode's stock text.

### REC-008 — Subject depth + enums (UAD)
- **Module:** TFPS:Valuator / SubjectContext
- **Problem:** Thin subject; missing legal/APN, zoning, HBU, flood/environmental, tax, occupancy; condition/quality are free strings.
- **Legacy evidence:** `OrderToXML.map` subject fields; UAD enums.
- **Proposed:** extend SubjectContext + formalize enums (C1–C6, Q1–Q6, rights, occupancy); link source docs via EvidenceRef.
- **Acceptance:** subject captures full UAD set; review flags missing; report binds them.
- **Files:** `lib/subject-context.ts`, subject panel, review.
- **Priority:** P1 · **Lane:** suite.

### REC-009 — MISMO XML export
- **Module:** TFPS:ReportForge
- **Problem:** No lender/AMC-deliverable format.
- **Legacy evidence:** `Mercury/Deliveries/*.xml` (MISMO).
- **Proposed:** MISMO 2.6/UAD XML export from the workfile (industry XSD).
- **Acceptance:** export valid MISMO XML for a 1004; validates against schema.
- **Priority:** P2 · **Lane:** suite · **Don't:** copy a la mode's mapping files; use the public MISMO schema.

### REC-010 — Cost/Income approach depth
- **Module:** TFPS:CostForge / TFPS:IncomeForge
- **Problem:** Missing entrepreneurial incentive/site detail (cost); rent/expense comps (income).
- **Legacy evidence:** cost/income forms.
- **Proposed:** extend engines + persisted run snapshots.
- **Acceptance:** cost shows entrepreneurial incentive + site improvements; income shows rent/expense comps.
- **Priority:** P2 · **Lane:** suite.

### REC-011 — Sketch → GLA (later)
- **Module:** TFPS:Valuator/CostForge
- **Problem:** No floor plan / area derivation.
- **Legacy evidence:** DaVinci `*.xfr`.
- **Proposed:** lightweight sketch capture → GLA/area → subject + exhibit. (Big; later.)
- **Priority:** P2/P3 · **Lane:** suite.

### REC-012 — AMC/UCDP delivery + e-sign (park)
- **Module:** TFPS (commercial lane)
- **Problem:** No delivery path.
- **Legacy evidence:** Mercury plugins, TSA.
- **Proposed:** later; ties to commercial lane (frozen).
- **Priority:** P3 · **Lane:** parked · **Don't:** start now (Stripe/PR#8 frozen).

---

## Top 10 recoverable capabilities
1. Persisted multi-comp adjustment grid (REC-002) · 2. Order/Assignment context (REC-001) · 3. Form-accurate report + PDF (REC-005) · 4. Review ruleset incl. bias detection (REC-004) · 5. Workfile attachments: photos/docs (REC-003) · 6. Addenda/certification/A&LC + appraiser profile (REC-006) · 7. Quicklists + phrase library (REC-007) · 8. Subject depth + UAD enums (REC-008) · 9. MISMO XML export (REC-009) · 10. Sketch→GLA (REC-011).

## Top 10 missing TFPS gaps (what TFPS can't do that legacy can)
1. Represent a real order/engagement · 2. Persist the comp grid · 3. Produce a form-accurate deliverable · 4. Export PDF · 5. Export MISMO/deliver to AMC · 6. Bundle photos/docs in the workfile · 7. Bias + completeness QC · 8. Certification/A&LC/addenda · 9. Fast entry (quicklists/phrases) · 10. Sketch-derived GLA.

## Recommended build sequence
1. **REC-001 Assignment context** (foundation for everything).
2. **REC-002 Persisted comp grid** (the heart; unlocks reconciliation/report/review depth).
3. **REC-008 Subject depth + enums** (feeds report + review).
4. **REC-005 Form-accurate report + PDF** (first real deliverable).
5. **REC-006 Addenda/cert/A&LC + profile** (makes it a USPAP-shaped report).
6. **REC-004 ReviewForge depth + bias** (pre-delivery confidence).
7. **REC-003 Attachments** (workfile completeness + report exhibits).
8. **REC-007 Quicklists/phrases**, **REC-010 cost/income depth**, **REC-009 MISMO**, **REC-011 sketch** (depth).
9. **REC-012 delivery/e-sign** (parked until commercial lane).

## Immediate next 5 tickets
REC-001 → REC-002 → REC-008 → REC-005 → REC-006. (Each lands as its own TFPS slice, proven against Postgres, behind the existing governance spine.)

## Longer-term roadmap
- **Phase A (real assignment):** REC-001/002/008 — model a complete assignment + persisted comps.
- **Phase B (real deliverable):** REC-005/006/003 — form-accurate report + PDF + cert + exhibits.
- **Phase C (confidence + speed):** REC-004/007/010 — deeper review, quicklists, approach depth.
- **Phase D (interchange):** REC-009 MISMO; REC-011 sketch.
- **Phase E (commercial):** REC-012 delivery/e-sign + the (frozen) commercial lane.
