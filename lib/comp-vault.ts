/**
 * TerraFusion Valuator Pro — CompVault Service
 *
 * Manages the appraiser's selected comparable sales pool for a given
 * appraisal assignment. Provides UAD GCX-compliant field types, comp
 * CRUD operations, and the data structures consumed by the regression
 * extraction engine.
 *
 * UAD GCX field naming follows FNMA Form 1004 / Freddie Mac Form 70
 * Section "Sales Comparison Approach" field identifiers.
 *
 * GOVERNANCE:
 *  - Maximum 6 comps per grid (FNMA 1004 standard)
 *  - Minimum 3 comps required before regression extraction
 *  - All comps require a source citation (MLS ID, deed book/page, etc.)
 *  - Sale date must be within 12 months unless market conditions justify
 */

// ---------------------------------------------------------------------------
// UAD Condition and Quality Ratings
// ---------------------------------------------------------------------------
export type UADCondition = "C1" | "C2" | "C3" | "C4" | "C5" | "C6";
export type UADQuality = "Q1" | "Q2" | "Q3" | "Q4" | "Q5" | "Q6";
export type UADView = "Bn" | "Nt" | "Nv" | "Wt" | "Wv" | "Pv" | "Gf" | "Gd" | "Gn" | "Gb" | "Gp" | "Gi" | "Bt" | "Bv" | "Bf" | "Ot";
export type UADLocation = "InfB" | "InfN" | "InfA" | "NnB" | "NnN" | "NnA" | "BnB" | "BnN" | "BnA";

// ---------------------------------------------------------------------------
// Adjustment line types (UAD GCX adjustment grid)
// ---------------------------------------------------------------------------
export interface AdjustmentLine {
  /** UAD field code, e.g. GCX_ADJ_LOCATION */
  fieldCode: string;
  /** Human-readable label */
  label: string;
  /** Dollar adjustment for this comp (positive = superior to subject, negative = inferior) */
  amount: number;
  /** Whether this adjustment was market-extracted via regression (vs. appraiser judgment) */
  regressionExtracted: boolean;
  /** Regression coefficient used ($/unit) if extracted */
  regressionCoefficient?: number;
  /** Quantity difference from subject (e.g. +200 sqft) */
  quantityDifference?: number;
  /** Evidence source reference */
  evidenceRef?: string;
}

// ---------------------------------------------------------------------------
// Comparable Sale — UAD GCX fields
// ---------------------------------------------------------------------------
export interface ComparableSaleGCX {
  /** Internal ID */
  compId: string;
  /** Grid position 1-6 */
  gridPosition: 1 | 2 | 3 | 4 | 5 | 6;

  // --- GCX_ADDR fields ---
  address: string;
  city: string;
  state: string;
  zip: string;

  // --- GCX_PROX --- Proximity to subject
  proximityMiles: number;

  // --- GCX_SP --- Sale price
  salePrice: number;

  // --- GCX_SPGLA --- Sale price per GLA
  salePricePerSqft: number;

  // --- GCX_DATA --- Data source
  dataSource: string;
  /** MLS number, deed book/page, or other citation */
  sourceCitation: string;
  verificationSource?: string;

  // --- GCX_VALUE --- Value adjustments
  adjustments: AdjustmentLine[];

  // --- GCX_SALE --- Sale/financing concessions
  saleOrFinancingConcessions: string;
  concessionAmount: number;

  // --- GCX_DATE --- Date of sale/time
  saleDate: string; // ISO date string
  monthsAgo: number;

  // --- GCX_RIGHTS --- Rights appraised
  propertyRightsAppraised: string;

  // --- GCX_LOC --- Location
  location: UADLocation;

  // --- GCX_SITE --- Site
  siteArea: number; // sqft
  siteAreaUnit: "sqft" | "acres";

  // --- GCX_VIEW --- View
  view: UADView;

  // --- GCX_DESIGN --- Design (style)
  design: string;

  // --- GCX_QUAL --- Quality of construction
  quality: UADQuality;

  // --- GCX_AGE --- Actual age
  actualAge: number;
  effectiveAge?: number;

  // --- GCX_COND --- Condition
  condition: UADCondition;

  // --- GCX_ABVGRD --- Above grade room count
  totalRooms: number;
  bedrooms: number;
  bathrooms: number; // UAD format: X.Y (full.half)

  // --- GCX_SQFT --- Gross living area
  gla: number;

  // --- GCX_BSMT --- Basement
  basementSqft: number;
  basementFinishedSqft: number;

  // --- GCX_FUNC --- Functional utility
  functionalUtility: string;

  // --- GCX_HEAT --- Heating/cooling
  heatingCooling: string;

  // --- GCX_ENRGY --- Energy efficient items
  energyEfficientItems: string;

  // --- GCX_GARAGE --- Garage/carport
  garageCarport: string;
  garageSpaces: number;

  // --- GCX_PORCH --- Porch/patio/deck
  porchPatioDeck: string;

  // --- GCX_OTHER --- Other
  other?: string;

  // --- Computed ---
  /** Net adjustment total */
  netAdjustment: number;
  /** Gross adjustment total (absolute values) */
  grossAdjustment: number;
  /** Adjusted sale price */
  adjustedSalePrice: number;
  /** Net adjustment as % of sale price */
  netAdjustmentPct: number;
  /** Gross adjustment as % of sale price */
  grossAdjustmentPct: number;

  // --- Metadata ---
  addedAt: string;
  addedBy: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Standard UAD adjustment lines for the grid
// ---------------------------------------------------------------------------
export const STANDARD_ADJUSTMENT_LINES: Array<{ fieldCode: string; label: string }> = [
  { fieldCode: "GCX_ADJ_FINANCING", label: "Sale or Financing Concessions" },
  { fieldCode: "GCX_ADJ_DATE", label: "Date of Sale/Time" },
  { fieldCode: "GCX_ADJ_RIGHTS", label: "Rights Appraised" },
  { fieldCode: "GCX_ADJ_LOCATION", label: "Location" },
  { fieldCode: "GCX_ADJ_LEASEHOLD", label: "Leasehold/Fee Simple" },
  { fieldCode: "GCX_ADJ_SITE", label: "Site" },
  { fieldCode: "GCX_ADJ_VIEW", label: "View" },
  { fieldCode: "GCX_ADJ_DESIGN", label: "Design (Style)" },
  { fieldCode: "GCX_ADJ_QUALITY", label: "Quality of Construction" },
  { fieldCode: "GCX_ADJ_AGE", label: "Actual Age" },
  { fieldCode: "GCX_ADJ_CONDITION", label: "Condition" },
  { fieldCode: "GCX_ADJ_ABVGRD", label: "Above Grade Room Count" },
  { fieldCode: "GCX_ADJ_GLA", label: "Gross Living Area" },
  { fieldCode: "GCX_ADJ_BSMT", label: "Basement & Finished Rooms Below Grade" },
  { fieldCode: "GCX_ADJ_FUNC", label: "Functional Utility" },
  { fieldCode: "GCX_ADJ_HEAT", label: "Heating/Cooling" },
  { fieldCode: "GCX_ADJ_ENRGY", label: "Energy Efficient Items" },
  { fieldCode: "GCX_ADJ_GARAGE", label: "Garage/Carport" },
  { fieldCode: "GCX_ADJ_PORCH", label: "Porch/Patio/Deck" },
  { fieldCode: "GCX_ADJ_OTHER1", label: "Net Adjustment (Total)" },
];

// ---------------------------------------------------------------------------
// CompVault — in-memory store for the current session
// ---------------------------------------------------------------------------
export interface CompVault {
  fileNumber: string;
  subjectGLA: number;
  subjectSalePrice?: number;
  comps: ComparableSaleGCX[];
  createdAt: string;
  updatedAt: string;
}

export function createCompVault(fileNumber: string, subjectGLA: number): CompVault {
  return {
    fileNumber,
    subjectGLA,
    comps: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function addCompToVault(vault: CompVault, comp: Omit<ComparableSaleGCX, "compId" | "addedAt" | "netAdjustment" | "grossAdjustment" | "adjustedSalePrice" | "netAdjustmentPct" | "grossAdjustmentPct">): CompVault {
  if (vault.comps.length >= 6) {
    throw new Error("Maximum 6 comparables allowed per FNMA 1004 grid.");
  }
  const computed = computeCompAdjustments({
    ...comp,
    compId: `comp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    addedAt: new Date().toISOString(),
    netAdjustment: 0,
    grossAdjustment: 0,
    adjustedSalePrice: 0,
    netAdjustmentPct: 0,
    grossAdjustmentPct: 0,
  });
  return {
    ...vault,
    comps: [...vault.comps, computed],
    updatedAt: new Date().toISOString(),
  };
}

export function updateCompAdjustment(
  vault: CompVault,
  compId: string,
  fieldCode: string,
  amount: number,
  regressionExtracted = false,
  regressionCoefficient?: number
): CompVault {
  const comps = vault.comps.map((comp) => {
    if (comp.compId !== compId) return comp;
    const adjustments = comp.adjustments.map((adj) =>
      adj.fieldCode === fieldCode
        ? { ...adj, amount, regressionExtracted, regressionCoefficient }
        : adj
    );
    return computeCompAdjustments({ ...comp, adjustments });
  });
  return { ...vault, comps, updatedAt: new Date().toISOString() };
}

export function removeCompFromVault(vault: CompVault, compId: string): CompVault {
  return {
    ...vault,
    comps: vault.comps.filter((c) => c.compId !== compId),
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Compute derived adjustment fields
// ---------------------------------------------------------------------------
export function computeCompAdjustments(comp: ComparableSaleGCX): ComparableSaleGCX {
  const netAdjustment = comp.adjustments.reduce((sum, adj) => sum + adj.amount, 0);
  const grossAdjustment = comp.adjustments.reduce((sum, adj) => sum + Math.abs(adj.amount), 0);
  const adjustedSalePrice = comp.salePrice + netAdjustment;
  const netAdjustmentPct = comp.salePrice > 0 ? (netAdjustment / comp.salePrice) * 100 : 0;
  const grossAdjustmentPct = comp.salePrice > 0 ? (grossAdjustment / comp.salePrice) * 100 : 0;
  return {
    ...comp,
    netAdjustment,
    grossAdjustment,
    adjustedSalePrice,
    netAdjustmentPct,
    grossAdjustmentPct,
  };
}

// ---------------------------------------------------------------------------
// FNMA guideline checks
// ---------------------------------------------------------------------------
export interface FNMAGuidelineCheck {
  compId: string;
  address: string;
  netAdjPctFlag: boolean;   // > 15% net
  grossAdjPctFlag: boolean; // > 25% gross
  dateFlag: boolean;        // > 12 months
  proximityFlag: boolean;   // > 1 mile (residential)
  netAdjPct: number;
  grossAdjPct: number;
  monthsAgo: number;
  proximityMiles: number;
}

export function checkFNMAGuidelines(vault: CompVault): FNMAGuidelineCheck[] {
  return vault.comps.map((comp) => ({
    compId: comp.compId,
    address: comp.address,
    netAdjPctFlag: Math.abs(comp.netAdjustmentPct) > 15,
    grossAdjPctFlag: comp.grossAdjustmentPct > 25,
    dateFlag: comp.monthsAgo > 12,
    proximityFlag: comp.proximityMiles > 1,
    netAdjPct: comp.netAdjustmentPct,
    grossAdjPct: comp.grossAdjustmentPct,
    monthsAgo: comp.monthsAgo,
    proximityMiles: comp.proximityMiles,
  }));
}

// ---------------------------------------------------------------------------
// Reconciliation of the sales comparison approach
// ---------------------------------------------------------------------------
export interface SalesCompReconciliation {
  adjustedPrices: number[];
  mean: number;
  median: number;
  weightedValue: number;
  range: { low: number; high: number };
  indicatedValue: number;
  reconciliationNote: string;
}

export function reconcileSalesComparison(
  vault: CompVault,
  weights?: number[]
): SalesCompReconciliation {
  if (vault.comps.length === 0) {
    throw new Error("No comparables in vault.");
  }
  const prices = vault.comps.map((c) => c.adjustedSalePrice);
  const sorted = [...prices].sort((a, b) => a - b);
  const mean = prices.reduce((s, p) => s + p, 0) / prices.length;
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
  const w = weights ?? prices.map(() => 1 / prices.length);
  const weightedValue = prices.reduce((s, p, i) => s + p * w[i], 0);
  const indicatedValue = Math.round(weightedValue / 1000) * 1000;
  return {
    adjustedPrices: prices,
    mean,
    median,
    weightedValue,
    range: { low: sorted[0], high: sorted[sorted.length - 1] },
    indicatedValue,
    reconciliationNote: `The adjusted sale prices of the comparable sales range from ${sorted[0].toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} to ${sorted[sorted.length - 1].toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}. The indicated value by the Sales Comparison Approach is ${indicatedValue.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}.`,
  };
}
