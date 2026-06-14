# Data Model Recovery — a la mode TOTAL → TFPR/TFPS contracts

Implied data model recovered from `OrderToXML.map`, `ReportHistory.XML`, `AppSettings.xml`, `.ZAP` internals, `AdjustmentTypes.xml`, `Contents.xml` (OBSERVED unless noted). a la mode internal field codes are cited as illustrative facts for interoperability; the **target** is domain entities + TFPR/TFPS contracts, not a copy of a la mode's field dictionary.

## Storage model (OBSERVED)
- **Report = `.ZAP`** (a ZIP archive). Internals: `RepInfo.xml` (metadata), `ReportData.xml` (normalized report), `FieldData.xml` (field values), `History.xml` (revisions), `Photos/`, `Workfile/` (contract/tax/MLS/assessor PDFs, maps, plat), `Sketch/` (+`SketchInfo.xml`), `Preview/` (EMF page renders), addenda `.tx`. Naming: `{Address}.ZAP`, foldered `Year/Form/City` (`ReportHistory.XML`).
- **Work-in-progress = `.adj`** per user/year (`WinTOTAL/Users/{name}-{guid}/{year}.adj`).
- **Form/rule/default databases = `.fdb`** (ZIP archives): `Active.fdb` (forms), `Legacy.fdb`, `Review.fdb` (QC), `DefaultData.fdb` (defaults), `Scripts.fdb`.
- **Engine:** "Spectrum" (embedded; `SPECTRUM_ENABLED=True`); `System.Data.SQLite.dll` present; `Backups/ExactDatabase_SQLite.zip.bak` → SQLite-class local store (INFERRED). Optional SQL Server per `TOTALSqlSetup/PreReqs.xml`.
- **Cloud:** Vault (protected docs), Titan Drive (files), Mercury/XSites (orders/delivery).

## Entities → TFPR/TFPS contract mapping

### AssignmentContext (order) — *new contract to add*
OBSERVED fields: file number(s) (`FNMA_FILENUMBER`,`CLIENT_FILE_NO`,`LENDERCASENUMBER`,`FHA_CASENUMBER`), dates (`REQUEST_DATE`,`APPRDATE`=inspection,`DUE_DATE`,`APPRDLVRDATE`,`DELIVEREDDATE`), `TYPE_OF_FORM` (e.g. `1004UAD`), `TYPE_OF_APPRAISAL`, priority/notes, fee (`FEE`,`MISC_FEE1`).
→ **TFPS:** extend **SubjectContext**/new **AssignmentContext** in Valuator Pro; persist in **WorkfileStore** (`tfpr_assignments` + a new `assignment_meta`/subject JSON). Today TFPS `Assignment` = {id,title,status,tier} only — **big gap**.

### SubjectContext (subject property)
OBSERVED: address parts (`SUBPROPADDRESS/CITY/COUNTY/STATE/ZIP`), legal (`SUBLEGALDESCRIP`,`SUBASSESSPARCEL`,`LOT/BLOCK`), geo (`LATITUDE/LONGITUDE`,`NEAREST_CROSSST`), type/age (`GDSTYPE`,`PJIYRBUILT`,`YEAR_REMODELED`), site (`SITSIZE`,`SITVIEW`), rooms (`RMSAGSQFTGLA`,`RMSAGTOTROOMS/BEDROOMS/BATHS`), HVAC, units (`GDSNUMUNITS`). Enums: condition C1–C6, quality Q1–Q6, property rights, occupancy.
→ **TFPS:** `lib/subject-context.ts` SubjectContext — **extend** with legal/APN, zoning, HBU, flood/environmental, tax, occupancy/tenancy; formalize **enums** (C1–C6, Q1–Q6, rights, occupancy). EvidenceRef should link source docs to these.

### SalesApproach / Comp records — *biggest data gap*
OBSERVED: per-comp fields (`GC1_BASERATE1`=sale price, `GC1_ADJSALEPRC_ADJ`=adjusted, `GC1_COMP2SUB_SUP/INF/EQL` flags), adjustment-type catalog (`AdjustmentTypes.xml`: date/age/location/condition/quality/size/features), 3–6 comps + additional-comp pages.
→ **TFPS:** TFPS `comp-vault` models this **in-session**, but **persists only a `compSummary`** (count + price/adjusted range + dates) in the sales `RunRecord.outputSnapshot`. **Recover a persisted Comp + AdjustmentLine model** (a `CompRecord` contract + `tfpr_workfile_comps` or rich run snapshot) so the grid survives reload and feeds report/review.

### CostApproach / IncomeApproach
OBSERVED: cost (RCN, depreciation, site), income (rent roll, vacancy, expenses, NOI, cap, GRM).
→ **TFPS:** CostForge/IncomeForge engines exist; persist richer `RunRecord.outputSnapshot` (cost components incl. entrepreneurial incentive; income rent/expense comps). Already enriched income (`capRate`,`noi`) + sales (`compSummary`) in Slice 6 — extend.

### Reconciliation
OBSERVED: approach indications + weighting + final opinion + applicability.
→ **TFPS:** `reconciliation-vault` + `CertifiedValue` (write_high) — **TFPS is ahead** (append-only certify). Add reliability/weighting rationale fields.

### EvidenceRef / Workfile attachments
OBSERVED: `.ZAP` bundles `Photos/` (UUID jpg), `Workfile/` (PDF docs), `Sketch/`, maps/plat; `History.xml`.
→ **TFPS:** `EvidenceRef`/`EvidenceItem` exist as *citations* but **store no binary attachments**. Recover an attachment model (blob/object store + EvidenceRef pointing to it).

### RunRecord / AuditTrace
OBSERVED: legacy tracks `History.xml` (per-report revisions) + `ReportHistory.XML` (access log).
→ **TFPS:** `RunRecord` + append-only `AuditTrace` — **TFPS is ahead** (governed, queryable, tenant-scoped). Keep.

### ReportPackage
OBSERVED: report = assembled form pages + addenda + exhibits → PDF/MISMO XML.
→ **TFPS:** `ReportPackage` contract exists; impl is HTML-from-workfile. Recover UAD-form-accurate + PDF + MISMO.

### Appraiser/User + Office profile
OBSERVED: `AppSettings.xml` office ("M & S Valuation", address, phone), `CUSTOMERNUMBER`, `CURCONTACTGUID`, multi-user `Users/`, auto-number prefix.
→ **TFPS:** none (single-tenant stub). Add an **AppraiserProfile** (license/signature/office) feeding ReportForge certification. P2; multi-user = P3.

## Enums to formalize in TFPS (industry-standard, safe)
Property rights (Fee Simple/Leasehold/…), Condition C1–C6, Quality Q1–Q6, Occupancy (Owner/Tenant/Vacant), Form type (1004/1004UAD/2055/1073/1025/2090/2095), Intended use, Adjustment types (date/time, location, site, GLA, age, condition, quality, features, financing/concessions).

## Summary
TFPS's runtime contracts (Workfile, RunRecord, EvidenceRef, AuditTrace, ReportPackage, CertifiedValue) are a **clean superset substrate** — but the **domain payload is shallow**: no real AssignmentContext, thin Subject, **no persisted comp grid**, no binary attachments, no appraiser profile. Recovering those is the data-model work to make TFPS a real appraisal tool.
