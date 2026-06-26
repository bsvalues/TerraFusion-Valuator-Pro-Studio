/**
 * TerraFusion Valuator Pro — Subject Context
 *
 * This module defines the single-subject, fee-appraiser-centric context
 * that replaces the county ParcelContext. Every analytical run (cost, regression,
 * income, spatial) is anchored to a SubjectContext so that evidence lineage
 * is traceable from input → run → output → report section.
 *
 * GOVERNANCE RULES:
 *  - No run may be executed without a populated SubjectContext.
 *  - Every run emits a RunRecord with input_snapshot + output_snapshot.
 *  - The appraiser role may invoke any analytical run; all runs require a reason_code.
 *  - No Marshall & Swift references, labels, or fallback assumptions anywhere in this file.
 */

// ---------------------------------------------------------------------------
// UAD Property Rights Appraised (FNMA 1004 field: PROPERTY_RIGHTS)
// ---------------------------------------------------------------------------
export type PropertyRights =
  | "Fee Simple"
  | "Leasehold"
  | "Fee Simple Subject to"
  | "Life Estate"
  | "Other";

// ---------------------------------------------------------------------------
// UAD Intended Use (FNMA 1004 field: INTENDED_USE)
// ---------------------------------------------------------------------------
export type IntendedUse =
  | "Mortgage Finance"
  | "Estate Planning"
  | "Litigation Support"
  | "Tax Appeal"
  | "Relocation"
  | "Private Sale"
  | "Insurance"
  | "Other";

// ---------------------------------------------------------------------------
// UAD Report Type
// ---------------------------------------------------------------------------
export type ReportType =
  | "Appraisal Report"
  | "Restricted Appraisal Report";

// ---------------------------------------------------------------------------
// UAD Scope of Work
// ---------------------------------------------------------------------------
export type InspectionType =
  | "Interior and Exterior"
  | "Exterior Only"
  | "Desktop (No Inspection)";

// ---------------------------------------------------------------------------
// UAD enums (REC-008) — formalized; no fake defaults (null until set).
// ---------------------------------------------------------------------------
export type Condition = "C1" | "C2" | "C3" | "C4" | "C5" | "C6";
export type Quality = "Q1" | "Q2" | "Q3" | "Q4" | "Q5" | "Q6";
export type Occupancy = "Owner-occupied" | "Tenant-occupied" | "Vacant" | "Unknown";

// ---------------------------------------------------------------------------
// Subject Context — the anchor for all analytical runs
// ---------------------------------------------------------------------------
export interface SubjectContext {
  // Appraisal Order Identity
  fileNumber: string | null;
  clientName: string | null;
  clientEmail: string | null;
  lenderName: string | null;
  loanNumber: string | null;
  effectiveDate: string | null;         // ISO date string YYYY-MM-DD
  reportDate: string | null;            // ISO date string YYYY-MM-DD
  inspectionDate: string | null;        // ISO date string YYYY-MM-DD (legacy APPRDATE)
  dueDate: string | null;               // ISO date string YYYY-MM-DD
  fee: number | null;                   // Appraisal fee (USD)

  // USPAP Assignment Conditions
  intendedUse: IntendedUse | null;
  intendedUsers: string[];              // e.g. ["Client", "Lender", "Court"]
  propertyRights: PropertyRights | null;
  reportType: ReportType | null;
  inspectionType: InspectionType | null;
  scopeOfWork: string | null;           // Free-text scope statement

  // Subject Property Identity
  propertyId: string | null;            // Internal UUID
  parcelNumber: string | null;          // APN / Parcel ID
  legalDescription: string | null;      // Legal description (REC-008)
  address: string | null;
  city: string | null;
  county: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;

  // Subject Property Characteristics (UAD-mapped)
  propertyType: string | null;          // UAD PROP_TYPE
  yearBuilt: number | null;
  gla: number | null;                   // Gross Living Area / Rentable Area (sqft)
  siteArea: number | null;              // Site area in sqft
  bedrooms: number | null;
  bathrooms: number | null;
  garageSpaces: number | null;
  condition: Condition | null;          // UAD C1-C6 (REC-008 enum)
  quality: Quality | null;              // UAD Q1-Q6 (REC-008 enum)
  view: string | null;                  // UAD Bn/Nt/Pstrl/Wtr/WtrFr/etc.
  location: string | null;              // UAD Neutral/Beneficial/Adverse
  occupancy: Occupancy | null;          // UAD occupancy (REC-008 enum)

  // Subject depth — REC-008 (HBU, flood/environmental, tax)
  highestBestUse: string | null;        // Highest & best use conclusion
  floodZone: string | null;             // FEMA flood zone (e.g. X, AE)
  femaPanel: string | null;             // FEMA map panel #
  easements: string | null;             // Easements / access notes
  taxAssessedValue: number | null;      // Assessed value
  taxYear: number | null;               // Assessment year
  annualTaxes: number | null;           // Annual real-estate taxes

  // Commercial-specific
  numberOfUnits: number | null;
  numberOfFloors: number | null;
  occupancyRate: number | null;
  capRate: number | null;
  parkingSpaces: number | null;
  zoning: string | null;
  landUse: string | null;
}

// ---------------------------------------------------------------------------
// Run Record — emitted by every analytical engine
// ---------------------------------------------------------------------------
export type RunType =
  | "cost"
  | "income_direct_cap"
  | "income_dcf"
  | "sales_comparison"
  | "reconciliation"
  | "regression"
  | "spatial";

export type RunStatus = "pending" | "running" | "complete" | "failed";

export interface RunRecord {
  runId: string;                        // UUID
  runType: RunType;
  fileNumber: string;                   // Links to SubjectContext.fileNumber
  propertyId: string | null;
  triggeredBy: string;                  // Appraiser license number or "system"
  reasonCode: string;                   // Required — e.g. "Initial cost approach run"
  correlationId: string;                // UUID linking related runs
  status: RunStatus;
  startedAt: string;                    // ISO datetime
  completedAt: string | null;           // ISO datetime
  inputSnapshot: Record<string, unknown>;   // Full input state at time of run
  outputSnapshot: Record<string, unknown>;  // Full output state after run
  evidenceRefs: EvidenceRef[];          // Sources cited
  narrativeReady: boolean;              // True when output can feed narrative agent
}

// ---------------------------------------------------------------------------
// Evidence Reference — every output must cite its sources
// ---------------------------------------------------------------------------
export interface EvidenceRef {
  sourceType:
    | "mls_sale"
    | "public_record"
    | "cost_manual"
    | "income_survey"
    | "regression_model"
    | "spatial_analysis"
    | "appraiser_judgment"
    | "market_study";
  sourceId: string;                     // MLS number, document ID, model ID, etc.
  sourceLabel: string;                  // Human-readable label
  retrievedAt: string;                  // ISO datetime
  confidence: number;                   // 0.0 – 1.0
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Default empty SubjectContext
// ---------------------------------------------------------------------------
export const DEFAULT_SUBJECT_CONTEXT: SubjectContext = {
  fileNumber: null,
  clientName: null,
  clientEmail: null,
  lenderName: null,
  loanNumber: null,
  effectiveDate: null,
  reportDate: null,
  inspectionDate: null,
  dueDate: null,
  fee: null,
  intendedUse: null,
  intendedUsers: [],
  propertyRights: null,
  reportType: null,
  inspectionType: null,
  scopeOfWork: null,
  propertyId: null,
  parcelNumber: null,
  legalDescription: null,
  address: null,
  city: null,
  county: null,
  state: null,
  zip: null,
  latitude: null,
  longitude: null,
  propertyType: null,
  yearBuilt: null,
  gla: null,
  siteArea: null,
  bedrooms: null,
  bathrooms: null,
  garageSpaces: null,
  condition: null,
  quality: null,
  view: null,
  location: null,
  occupancy: null,
  highestBestUse: null,
  floodZone: null,
  femaPanel: null,
  easements: null,
  taxAssessedValue: null,
  taxYear: null,
  annualTaxes: null,
  numberOfUnits: null,
  numberOfFloors: null,
  occupancyRate: null,
  capRate: null,
  parkingSpaces: null,
  zoning: null,
  landUse: null,
};

// ---------------------------------------------------------------------------
// Governance helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the SubjectContext has the minimum fields required
 * to anchor an analytical run.
 */
export function isSubjectReady(ctx: SubjectContext): boolean {
  return (
    ctx.fileNumber !== null &&
    ctx.address !== null &&
    ctx.city !== null &&
    ctx.state !== null &&
    ctx.effectiveDate !== null &&
    ctx.intendedUse !== null &&
    ctx.propertyRights !== null
  );
}

/**
 * Returns a list of missing required fields for display in the UI.
 */
export function getMissingSubjectFields(ctx: SubjectContext): string[] {
  const missing: string[] = [];
  if (!ctx.fileNumber) missing.push("File Number");
  if (!ctx.address) missing.push("Property Address");
  if (!ctx.city) missing.push("City");
  if (!ctx.state) missing.push("State");
  if (!ctx.effectiveDate) missing.push("Effective Date of Appraisal");
  if (!ctx.intendedUse) missing.push("Intended Use");
  if (!ctx.propertyRights) missing.push("Property Rights Appraised");
  return missing;
}

/**
 * Generates a new correlation ID for linking related runs.
 */
export function newCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generates a new run ID.
 */
export function newRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
