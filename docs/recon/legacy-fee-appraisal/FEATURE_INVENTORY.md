# Feature Inventory — a la mode TOTAL vs. TFPS

Per feature: **Legacy location** · **Evidence (OBSERVED/INFERRED)** · **TFPS status** (exists / partial / missing / wrong) · **Action** (recover / redesign / ignore / park) · **Priority** (P0–P3).

## Assignment
| Feature | Legacy location | Evidence | TFPS status | Action | Pri |
|---|---|---|---|---|---|
| Order metadata (client/lender/borrower/fee/order#) | Mercury; `OrderToXML.map` (`FNMA_FILENUMBER`,`LENDERCASENUMBER`,`FEE`) | OBSERVED | missing | recover | P0 |
| Intended use / intended users | form header; `OrderToXML.map` | OBSERVED (use) / INFERRED (users) | partial | recover | P0 |
| Effective / report / inspection / due dates | form header (`APPRDATE`,`DUE_DATE`,`APPRDLVRDATE`) | OBSERVED | partial (effective only) | recover | P0 |
| Property rights / ownership interest | UAD field | OBSERVED | partial (rights only) | recover | P1 |
| Scope of work | form text | INFERRED | missing | recover | P1 |
| Certification + Assumptions & Limiting Conditions | Custom Addenda `.tx` | OBSERVED | missing | recover | P1 |
| Appraiser identity / license / signature | `AppSettings.xml` office; TSA e-sign | OBSERVED | missing | recover | P1 |

## Subject
| Feature | Legacy location | Evidence | TFPS | Action | Pri |
|---|---|---|---|---|---|
| Address / city / county / state / zip | `OrderToXML.map` (`SUBPROPADDRESS`…) | OBSERVED | exists | — | — |
| Legal description / APN / lot/block | `SUBLEGALDESCRIP`,`SUBASSESSPARCEL` | OBSERVED | partial (parcel field) | recover | P1 |
| Lat/long, nearest cross st | `LATITUDE`,`LONGITUDE` | OBSERVED | partial | recover | P2 |
| Zoning / Highest & Best Use | form fields | OBSERVED (zoning) / INFERRED (HBU) | missing | recover | P1 |
| Tax assessment fields | form | INFERRED | missing | recover | P2 |
| Flood / environmental / easement / access | form | INFERRED | missing | recover | P2 |
| Occupancy / tenancy | UAD | OBSERVED | missing | recover | P2 |

## Site / Improvements
| Feature | Legacy | Evidence | TFPS | Action | Pri |
|---|---|---|---|---|---|
| Site size / view / utilities | `SITSIZE`,`SITVIEW` | OBSERVED | partial (siteArea) | recover | P2 |
| GLA / rooms / beds / baths | `RMSAGSQFTGLA`,`RMSAGTOTROOMS` | OBSERVED | partial | recover | P1 |
| Year built / condition C1–C6 / quality Q1–Q6 | UAD enums | OBSERVED | exists (condition/quality strings) | redesign (enums) | P2 |
| **Sketch → GLA derivation** | DaVinci `*.xfr` | OBSERVED | missing | recover | P2 |

## Cost
| Feature | Legacy | Evidence | TFPS | Action | Pri |
|---|---|---|---|---|---|
| RCN / depreciation (phys/func/ext) | cost form | OBSERVED | exists (CostForge) | — | — |
| Entrepreneurial incentive/profit | cost form | INFERRED | missing | recover | P2 |
| Site improvements / land value support | cost form | INFERRED | partial | recover | P2 |
| Cost-source citation | cost form | INFERRED | missing | recover | P2 |

## Sales
| Feature | Legacy | Evidence | TFPS | Action | Pri |
|---|---|---|---|---|---|
| **Multi-comp adjustment grid (persisted)** | comp grid; `GC1_…`,`AdjustmentTypes.xml` | OBSERVED | **partial — summary only, grid not persisted** | recover | P0 |
| Per-line adjustments + superior/inferior flags | `..._COMP2SUB_SUP/INF` | OBSERVED | partial (in-session) | recover | P0 |
| Comp database / search | COMPSIMPORTER, IDC geocode (`alaRedun.ini`) | OBSERVED | missing | recover/park | P2 |
| Sale verification / conditions | comp grid | INFERRED | missing | recover | P2 |
| Regression / market support | (TFPS has regression) | — | exists (TFPS strength) | keep | — |
| Comp photos / maps | ZAP `Photos/` | OBSERVED | missing | recover | P1 |

## Income
| Feature | Legacy | Evidence | TFPS | Action | Pri |
|---|---|---|---|---|---|
| Rent roll / market rent / vacancy / expenses / NOI / cap / GRM | 1025/income form | OBSERVED | exists (IncomeForge) | — | — |
| Rent comps / expense comps / cap-rate support | income form | INFERRED | missing | recover | P2 |
| DCF | (TFPS has DCF) | — | exists | keep | — |

## Reconciliation
| Feature | Legacy | Evidence | TFPS | Action | Pri |
|---|---|---|---|---|---|
| Approach weighting / applicability / final opinion | reconciliation page | OBSERVED | exists | — | — |
| Final-opinion lock/certify + **append-only trace** | (legacy lock) | INFERRED | **exists — TFPS better** (write_high + AuditTrace) | keep | — |
| Reliability scoring / weighting rationale prompts | form | INFERRED | partial | recover | P2 |

## Report
| Feature | Legacy | Evidence | TFPS | Action | Pri |
|---|---|---|---|---|---|
| UAD-form-accurate output (1004/2055/1073/1025) | `Active.fdb`,`Contents.xml` | OBSERVED | missing (generic HTML) | recover | P1 |
| Narrative sections / phrase library | `Phrase.xml`, Custom Addenda | OBSERVED | partial (1 MUSE draft) | recover | P1 |
| Certification / A&LC / addenda | Custom Addenda `.tx` | OBSERVED | missing | recover | P1 |
| Exhibits: photos / maps / sketch / comp grid pages | ZAP `Photos/`,`Sketch/`,`Preview/` | OBSERVED | missing | recover | P1 |
| **PDF export** | print engine | OBSERVED | partial (HTML only) | recover | P1 |
| **MISMO XML export** | `Mercury/Deliveries/*.xml` | OBSERVED | missing | recover | P1 |

## Review
| Feature | Legacy | Evidence | TFPS | Action | Pri |
|---|---|---|---|---|---|
| Missing-field / completeness checks | `Review.fdb` | OBSERVED | partial | recover | P1 |
| Unsupported-adjustment warnings | ReviewScripts | INFERRED | partial | recover | P1 |
| **Bias-language detection** | `BiasWordsMasterList.txt`,`BiasWarningsExclusions.xml` | OBSERVED | missing | recover | P1 |
| USPAP/FNMA rule library (versioned) | `ReviewScriptConfig.xml` (TOTAL80…154) | OBSERVED | partial (~8 checks) | recover | P1 |
| Supervisor / final delivery checks | Mercury | INFERRED | missing | park | P3 |

## Workfile
| Feature | Legacy | Evidence | TFPS | Action | Pri |
|---|---|---|---|---|---|
| Single bundled workfile (.ZAP) | `DeletedReports/*.zap` internals | OBSERVED | partial (DB rows, no attachments) | recover | P1 |
| Photos / docs / attachments | ZAP `Photos/`,`Workfile/` | OBSERVED | missing | recover | P1 |
| Notes / inspection notes | form | INFERRED | partial (evidence labels) | recover | P2 |
| Revision / report history | `History.xml`,`ReportHistory.XML` | OBSERVED | exists (AuditTrace, append-only — better) | keep | — |
| Save / reload | `.adj`/`.ZAP` | OBSERVED | exists (Postgres, fail-loud) | keep | — |

## Admin / Settings / Templates / Exports
| Feature | Legacy | Evidence | TFPS | Action | Pri |
|---|---|---|---|---|---|
| Office/appraiser profile defaults | `AppSettings.xml`,`DefaultData.fdb` | OBSERVED | missing | recover | P2 |
| **Quicklists / canned responses** | `Quicklists/` | OBSERVED | missing | recover | P1 |
| Report numbering (auto + prefix) | `AppSettings.xml` (prefix "WIL") | OBSERVED | partial (uuid id) | recover | P3 |
| Backup / cloud sync (Vault/Titan/Dropbox) | `Backups/`,`alamode.xml` | OBSERVED | partial (Postgres only) | park | P3 |
| Multi-user / contacts | `Users/`, contacts `.adj` | OBSERVED | missing (single-tenant stub) | park | P3 |
| MLS / public-records import | IDC geocode (`alaRedun.ini`) | OBSERVED | missing | park | P3 |
| AMC / UCDP / EAD delivery + e-sign | Mercury plugins, TSA | OBSERVED | missing | park | P3 |
