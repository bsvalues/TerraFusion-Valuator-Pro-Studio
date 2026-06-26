# Do Not Copy — what NOT to bring forward from a la mode TOTAL

Recover the **workflow judgment**, not the skin or the lock-in. These are the things to deliberately avoid reproducing.

## Top 10 things not to copy
1. **Windows-desktop WinForms UI.** Dense, modal, decades-old. TFPS is web/governed — keep the workflow, not the screens. (`WinTOTAL.exe`, `DevComponents.DotNetBar2.dll`.)
2. **Proprietary binary/encrypted file formats** — `.ZAP`, `.adj`, `.fdb` (ZIP/AES), `WinTOTAL.cfg` (encrypted). Opaque, brittle, vendor-locked. TFPS uses an open, queryable Postgres workfile — keep it.
3. **Copyrighted report/narrative templates & boilerplate** (`Custom Addenda/*.tx`, `Phrase.xml`, stock-text database). Legal risk. Author TFPS's own cert/A&LC/phrases; bind public **FNMA/MISMO** field standards only.
4. **a la mode's review/bias word lists verbatim** (`BiasWordsMasterList.txt`). Build TFPS's own list; mirror the *mechanism* (flag, don't auto-edit), not the data.
5. **Per-form hardcoding / 600+ accreted form codes** (`Contents.xml`, legacy + UAD + GSE + desktop + hybrid variants). Model forms as data/contracts; start with 1004/1004UAD and grow — don't clone the whole tangle.
6. **Cloud-as-bolt-on architecture** (Mercury legacy + Titan + Vault + Dropbox stitched together). TFPS runtime *is* the substrate — don't recreate the bolt-on sprawl.
7. **Vendor delivery-plugin lock-in** (`AvailablePlugins.xml`: per-AMC plugins). Use open standards (MISMO/UCDP) instead of a plugin per buyer.
8. **MSDE→SQL Server→Spectrum→SQLite engine drift.** One clean store (Postgres/WorkfileStore), fail-loud — don't carry the migration scar tissue.
9. **Embedded license/heartbeat coupling** (`alamode.Guardian.dll`, `heartbeat.alamode.com`, concurrent-use checks). TFPS uses runtime Entitlement — keep it clean, don't hardwire licensing into the app.
10. **Implicit/auto behaviors that hide provenance** — silent auto-fill from `DefaultData.fdb`, auto-numbering quirks, hidden conversions. TFPS doctrine: governed, audited, honest truth-states — every value traceable. Don't reintroduce magic.

## Also avoid
- **Reading user PII as "features."** The install contains a real firm's data (clients, addresses, contacts, Dropbox paths). Do **not** ingest, copy, or surface that PII into TFPS; recon used it only to infer structure.
- **Outdated report language / pre-UAD assumptions** baked into legacy forms — use current FNMA/UAD/USPAP standards.
- **Decompiling or redistributing** a la mode binaries or schemas — interoperate via open standards (MISMO), not reverse-engineered internals.
- **"USPAP-compliant" claims** — legacy implies compliance via ruleset; TFPS says **"USPAP-aware"** and leaves authorship/compliance to the appraiser.

## What TO copy (the judgment)
The *workflow*: order→subject→approaches→comp grid→reconciliation→review→report→deliver; the comp-grid adjustment discipline; sketch→GLA; the bundled evidence workfile; automated completeness/bias QC; quicklists/phrases for speed; MISMO/PDF deliverables. Recover these as TFPS-native, governed, open implementations.
