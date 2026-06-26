# Report Logic Recovery — how a la mode assembles a report → ReportForge

Mechanism recovered from `Contents.xml`, `OrderToXML.map`, `Custom Addenda/*.tx`, `DAVINCI/Forms/Transfer/*.xfr`, `Phrase.xml`, `Mercury/Deliveries/*.xml`, print/PDF config (OBSERVED unless noted). **No proprietary template/narrative text is reproduced** — only the assembly mechanism.

## 1. Report sections (industry-standard, OBSERVED via form catalog)
A residential URAR (1004) report assembles, in order: subject/assignment header → neighborhood/market → site → improvements → **sales comparison grid** → cost approach → income (if used) → **reconciliation & final value** → **certification** → **assumptions & limiting conditions** → **addenda** → **exhibits** (location map, plat, building sketch, subject + comp photos). Form codes in `Contents.xml` (600+) incl. `1004/1004UAD/2055/1073/1025`, photo pages (`PIC3X5/PIC4X6/PICINT*`), `MAP`, `SKT`, supplements (`SUP/TADD/MPA4`).

## 2. Template logic & variable substitution (OBSERVED mechanism)
- Each form = `{CODE}.XML` template + `{CODE}.DFL` defaults (`Contents.xml`).
- **Field-code substitution:** report data fields (e.g. `CONDITION`, `FEE`, `GC1_BASERATE1`) map to template/output positions via `OrderToXML.map` (e.g. `FEE → //REPORT/ORDER/BILLING/FEES/BASE_FEE/VALUE`). This is mail-merge-style: template placeholders ← field values.
- **Addenda** = `Custom Addenda/*.tx` (e.g. `2020.tx`, `2020 ext.tx`) — boilerplate paragraphs with embedded field codes, substituted at generation. **Quicklists/Phrase library** (`Phrase.xml`, `Quicklists/`) provide reusable canned text the appraiser inserts.
- **Sketch → fields:** `DAVINCI/Forms/Transfer/1004.xfr`, `FieldData.xfr`, `Map.xfr` map sketch geometry → form fields (GLA, areas).

## 3. Calculations feeding report text (OBSERVED/INFERRED)
- Comp grid: comp sale price − per-line adjustments → adjusted indication; superior/inferior flags (`..._COMP2SUB_SUP/INF`); reconciled sales value.
- Cost: RCN − depreciation + site → cost value.
- Income: NOI ÷ cap rate (and GRM) → income value.
- Reconciliation: weighted approaches → final opinion (feeds the certification + value lines).

## 4. Certification & A&LC (OBSERVED location, text not reproduced)
Stored as Custom Addenda `.tx` + standard form certification pages; appraiser license/office auto-filled from `AppSettings.xml`/`DefaultData.fdb`. Final value + cert are the *signed* output.

## 5. Exhibits (OBSERVED in `.ZAP`)
`Photos/` (subject + comp + UUID jpg, `AssignmentMap.bmp`), `Workfile/` (contract, tax, MLS, assessor, plat PDFs), `Sketch/` (+`SketchInfo.xml`), `Preview/` (EMF rendered pages). All bundled with the report.

## 6. Export path (OBSERVED)
- **PDF** via internal print driver (`PrintProfiles.xml`; output to a Dropbox folder per `alamode.xml`).
- **MISMO XML** — full report serialized for AMC/UCDP delivery (`Mercury/Deliveries/*.xml`, multi-MB per report).
- Delivery via plugins (`Mercury/AvailablePlugins.xml`): MercuryNetwork, AppraisalPort, VSS, GAC, Amrock; chunked upload (`DATACOURIERCHUNKSIZE`).

## Map to TFPS ReportForge / MUSE / Workfile / certify

| Legacy mechanism | TFPS today | Recovery |
|---|---|---|
| Form template + field-code substitution | `renderWorkfileHtml` (generic HTML from workfile) | Build **form-accurate templates** (start 1004/1004UAD) with field binding from SubjectContext + runs (P1, ReportForge) |
| Addenda `.tx` + Phrase/Quicklists boilerplate | MUSE one reconciliation draft | Recover **addenda/cert/A&LC library + phrase/quicklist** as MUSE `write_low` drafts the appraiser edits (P1, MUSE/ReportForge) |
| Sketch → GLA field transfer | none | Recover later (P2) |
| Calculations → report text | runs persisted; report reads them | Bind all approach runs + reconciliation + certified value into report sections (P1) |
| Certification + license/office | none | Recover **AppraiserProfile → certification block**; bind `write_high` certify into the cert (P1) |
| Exhibits bundle (photos/maps/sketch/comp grid) | none in report | Recover **exhibit pages** from Evidence attachments (P1, after attachment model) |
| PDF export | HTML only | Recover **PDF** (print-to-PDF of the report route) (P1) |
| MISMO XML export | none | Recover **MISMO XML** export from the workfile (P1/P2) |
| AMC/UCDP delivery, e-sign | none | **Park** (P3) |

**Doctrine fit:** report sections are assembled **only** from the governed workfile (subject + runs + evidence + reconciliation + certified value) — single source, append-only audit, MUSE drafts are `write_low` (appraiser remains author), final cert is `write_high`. This is the same "no parallel path" rule already in TFPS — extend its *depth*, not its data sources.
