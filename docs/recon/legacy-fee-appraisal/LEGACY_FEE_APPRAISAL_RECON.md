# Legacy Fee-Appraisal Software — Reconnaissance

**Subject:** a la mode **TOTAL** (and WinTOTAL, Mercury/TOTAL Connect, TOTAL Sketch/DaVinci, TOTAL Mobile Sync, Titan)
**Method:** read-only filesystem archaeology of `C:\Program Files (x86)\a la mode\` and `C:\ProgramData\alamode\`.
**Date:** 2026-06-08 · isolated worktree `recon/legacy-fee-appraisal` · **docs-only, no code.**

> **Evidence rules used throughout:** Findings are labeled **OBSERVED** (seen in a file/path) or **INFERRED** (deduced). Every claim cites a path. **Copyright boundary:** this recon records structure, file formats, config keys, and *industry-standard* appraisal concepts (FNMA URAR 1004/1025/1073/2055, USPAP terms, UAD fields are industry standard). It does **not** reproduce a la mode's copyrighted report/narrative template text, and no binaries were decompiled. a la mode internal field codes are cited only as illustrative facts for interoperability, not reproduced wholesale.

---

## 1. What the legacy software actually is

**a la mode TOTAL** is a mature, desktop-primary **fee-appraisal production system** — the dominant tool in the U.S. residential appraisal industry for ~20 years. It is not a dashboard or a form filler; it is a full **report-production operating environment** for an independent/small-office appraiser.

Installed modules (OBSERVED — `C:\Program Files (x86)\a la mode\`):

| Module | Purpose | Evidence |
|---|---|---|
| **TOTAL / WinTOTAL** (`WinTOTAL.exe`) | The hub: form editor, data entry, comp grid, adjustments, review, report assembly, export | `TOTAL/WinTOTAL.exe`; `alamode.xml` |
| **TOTAL Sketch (DaVinci)** (`DaVinci.exe`) | Property sketch / floor plan; derives GLA & areas, transfers to form | `TOTAL Sketch/`; `DAVINCI/Forms/Transfer/1004.xfr` |
| **Mercury / TOTAL Connect** (`Mercury.exe`) | Order intake + delivery portal (now legacy; `ISLEGACY=True`) | `TOTAL Connect/`; `Mercury/AvailablePlugins.xml` |
| **TOTAL Mobile Sync / for Tablet PC** | Field/mobile data capture + sync | `TOTAL Mobile Sync/`; `alamode.xml` |
| **Mileage Estimator / Sched** | Trip mileage; appointment scheduling | `Mileage Estimator/`, `Sched/eSched.exe` |
| **Titan Files Downloader / Vault** | Cloud document storage + protected-file (lender/AMC) repository | `Titan Drive/`, `Vault/`, `alaRedun.ini` |

User type (OBSERVED): a real working firm — "M & S Valuation" / Bill Spencer, multi-user (William, Gabe, Kenneth Spencer; `ProgramData/alamode/Users/`), WA/ID market, FNMA residential + small income work (`ReportHistory.XML` folders: `2020/1004/PASCO`, `2020/INCOME/WALLA WALLA`).

## 2. Primary workflows

`Order intake (Mercury/XSites) → open/create .ZAP report → Subject + assignment data entry (WinTOTAL forms) → Sketch (DaVinci → GLA) → Comp search + adjustment grid → Cost/Income as applicable → Reconciliation → ReviewScripts QC (incl. bias check) → Addenda/certification → PDF + MISMO XML export → deliver via AMC/lender plugin (DataCourier).` (Synthesized from both recon agents; see `LEGACY_WORKFLOW_MAP.md`.)

The appraiser **lives in WinTOTAL**, working a single `.ZAP` file (a ZIP archive containing `ReportData.xml`, `FieldData.xml`, `RepInfo.xml`, `History.xml`, `Photos/`, `Workfile/`, `Sketch/`, `Preview/`, addenda `.tx`). OBSERVED in `DeletedReports/*.zap` + sample ZAP internals.

## 3. Strongest capabilities (what it does well)

1. **Form fidelity** — true FNMA/UAD forms (1004/1004UAD/2055/1073/1025/2090/2095 + GSE/desktop/hybrid variants), page-accurate (`Active.fdb` 35M, `PageBoundaries.xml`, `Contents.xml` 600+ form codes).
2. **The comp grid** — multi-comp side-by-side adjustment grid with per-line adjustments, comp-to-subject superior/inferior flags (`GC1_…`, `..._COMP2SUB_SUP/INF`), adjustment-type catalog (`AdjustmentTypes.xml`).
3. **Sketch → area derivation** — DaVinci computes GLA/areas from the drawing and transfers to the form (`*.xfr`).
4. **Workfile completeness** — every report bundles photos, maps, plat, contract, tax/MLS/assessor PDFs, sketch, revision history in one `.ZAP` (USPAP workfile in a box).
5. **Automated QC / ReviewScripts** — downloadable, versioned compliance rules incl. **bias-language detection** (`BiasWordsMasterList.txt`, `BiasWarningsExclusions.xml`) and completeness/consistency checks (`Review.fdb`).
6. **Quicklists + phrase library** — fast canned data entry + boilerplate (`Quicklists/`, `Phrase.xml`).
7. **Export + delivery** — PDF + **MISMO XML**, AMC/UCDP delivery via many plugins (`Mercury/AvailablePlugins.xml`: MercuryNetwork, AppraisalPort, VSS, GAC, Amrock…).
8. **Modular updateability** — forms (FDB), QC rules (ReviewScripts), narrative (Custom Addenda/DAVINCI) decoupled from the EXE, updated over the wire.

## 4. Weakest capabilities (what to retire / not learn from)

- Desktop-Windows-only, .NET WinForms; binary/encrypted `.fdb`/`WinTOTAL.cfg` (opaque, brittle, hard to integrate). See `DO_NOT_COPY.md`.
- Proprietary `.ZAP`/`.adj`/`.fdb` formats; lock-in; cloud is bolt-on (Titan/Mercury) not substrate.
- Legacy modules layered over decades (Mercury legacy, MSDE→Spectrum→SQLite drift) — accreted complexity.

## 5. What is still valuable (recover the judgment, not the skin)

The **professional workflow knowledge** encoded in it: the form/field model, the comp-grid adjustment discipline, the sketch→GLA link, the workfile-as-evidence bundle, the QC ruleset (esp. bias + completeness), MISMO/AMC delivery, and quicklists/phrases for speed. These are what make it a *real appraisal tool* vs. a web app. See `GAP_ANALYSIS_TFPS.md`.

## 6. What TerraFusion should learn

TFPS has the **governance spine** legacy lacks (append-only audit, write-lanes, sovereign AI, honest truth-states, queryable workfile). Legacy has the **production depth** TFPS lacks (forms, comp grid, photos/sketch, addenda, MISMO/PDF, delivery, comp DB). The win is **TFPR governance + recovered legacy production depth** — not copying the UI.

---

## Executive conclusion (per WO)

**Executive summary:** a la mode TOTAL is a complete, USPAP-grade fee-appraisal production environment whose value is *workflow knowledge*, not its dated UI. Current TFPS is a clean, honest, governed suite *shell* with real analytical engines but **shallow appraisal production depth**. To become a true suite, TFPS must recover: UAD form fidelity, the persisted multi-comp adjustment grid, photos/sketch→GLA, the workfile evidence bundle, a deeper review ruleset (incl. bias + completeness), and PDF/MISMO export + delivery. The TFPR runtime is the right substrate to host these.

See companion docs for detail. Top-10 lists, build sequence, next-5 tickets, and roadmap are in `GAP_ANALYSIS_TFPS.md` (lists) and `RECOVERY_BACKLOG.md` (tickets + sequence).
