/**
 * TerraFusion Valuator Pro — Reconciliation Vault
 *
 * Implements USPAP Standards Rule 1-6: the appraiser must reconcile the
 * quality and quantity of data available and analyzed within the approaches
 * used and the applicability or suitability of the approaches used.
 *
 * ARCHITECTURE:
 *  - ReconciliationVault holds the three approach values and appraiser weights
 *  - computeReconciliation() produces a ReconciliationResult with the final
 *    weighted value, range, and USPAP SR 1-6 compliance check
 *  - emitReconciliationEvidence() produces the evidence trail
 *
 * UAD FIELD MAPPING:
 *  REC_COST_VALUE      — Indicated Value by Cost Approach
 *  REC_SALES_VALUE     — Indicated Value by Sales Comparison Approach
 *  REC_INCOME_VALUE    — Indicated Value by Income Approach
 *  REC_COST_WEIGHT     — Weight assigned to Cost Approach
 *  REC_SALES_WEIGHT    — Weight assigned to Sales Comparison Approach
 *  REC_INCOME_WEIGHT   — Weight assigned to Income Approach
 *  REC_WEIGHTED_VALUE  — Weighted Average of Applicable Approaches
 *  REC_FINAL_VALUE     — Final Opinion of Value (appraiser's judgment)
 *  REC_VALUE_RANGE     — Range of Indicated Values
 *
 * USPAP COMPLIANCE:
 *  - SR 1-6(a): Reconcile quality and quantity of data
 *  - SR 1-6(b): Reconcile applicability and suitability of approaches
 *  - SR 1-6(c): State a point value or range of values (point value required
 *    for mortgage lending)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ApproachApplicability =
  | "Primary"
  | "Secondary"
  | "Supporting"
  | "Not Applicable";

export interface ApproachInput {
  /** Indicated value from this approach (null = not developed) */
  indicatedValue: number | null;
  /** Whether this approach was developed */
  developed: boolean;
  /** Appraiser-assigned weight (0–1, must sum to 1.0 across developed approaches) */
  weight: number;
  /** Applicability rating */
  applicability: ApproachApplicability;
  /** Appraiser's rationale for the weight assigned */
  rationale: string;
}

export interface ReconciliationVault {
  fileNumber: string;
  effectiveDate: string;
  propertyType: string;
  costApproach: ApproachInput;
  salesComparison: ApproachInput;
  incomeApproach: ApproachInput;
  /** Appraiser's final opinion — may differ from weighted average */
  finalValue: number | null;
  /** Rounded to nearest $500 per USPAP convention */
  finalValueRounded: number | null;
  /** USPAP SR 1-6 narrative */
  reconciliationNarrative: string;
  /** Highest & Best Use conclusion */
  highestBestUse: string;
  /** Exposure time estimate */
  exposureTime: string;
  /** Marketing time estimate */
  marketingTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReconciliationResult {
  /** All three approach values */
  costValue: number | null;
  salesValue: number | null;
  incomeValue: number | null;
  /** Only developed approaches */
  developedApproaches: Array<{
    name: string;
    value: number;
    weight: number;
    applicability: ApproachApplicability;
    weightedContribution: number;
  }>;
  /** Sum of weights for developed approaches */
  totalWeight: number;
  /** Weighted average of developed approaches */
  weightedValue: number | null;
  /** Appraiser's final opinion */
  finalValue: number | null;
  finalValueRounded: number | null;
  /** Range metrics */
  rangeMin: number | null;
  rangeMax: number | null;
  rangeSpread: number | null;
  rangeSpreadPct: number | null;
  /** USPAP compliance check */
  uspap: {
    sr16a: boolean; // Data quality reconciled
    sr16b: boolean; // Approach applicability stated
    sr16c: boolean; // Point value stated
    compliant: boolean;
    issues: string[];
  };
}

export interface ReconciliationEvidence {
  runId: string;
  correlationId: string;
  fileNumber: string;
  computedAt: string;
  inputSnapshot: {
    costValue: number | null;
    salesValue: number | null;
    incomeValue: number | null;
    costWeight: number;
    salesWeight: number;
    incomeWeight: number;
  };
  outputSnapshot: {
    weightedValue: number | null;
    finalValue: number | null;
    finalValueRounded: number | null;
    rangeSpreadPct: number | null;
  };
  evidenceRefs: Array<{
    fieldCode: string;
    value: number | null;
    source: string;
    note: string;
  }>;
  uspapCompliant: boolean;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createReconciliationVault(
  fileNumber: string,
  effectiveDate: string,
  propertyType: string
): ReconciliationVault {
  return {
    fileNumber,
    effectiveDate,
    propertyType,
    costApproach: {
      indicatedValue: null,
      developed: false,
      weight: 0,
      applicability: "Supporting",
      rationale: "",
    },
    salesComparison: {
      indicatedValue: null,
      developed: false,
      weight: 0,
      applicability: "Primary",
      rationale: "",
    },
    incomeApproach: {
      indicatedValue: null,
      developed: false,
      weight: 0,
      applicability: "Not Applicable",
      rationale: "",
    },
    finalValue: null,
    finalValueRounded: null,
    reconciliationNarrative: "",
    highestBestUse: "",
    exposureTime: "3–6 months",
    marketingTime: "3–6 months",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

export function computeReconciliation(vault: ReconciliationVault): ReconciliationResult {
  const approaches = [
    { name: "Cost Approach", input: vault.costApproach },
    { name: "Sales Comparison Approach", input: vault.salesComparison },
    { name: "Income Approach", input: vault.incomeApproach },
  ];

  const developed = approaches.filter(
    (a) => a.input.developed && a.input.indicatedValue !== null && a.input.indicatedValue > 0
  );

  const totalWeight = developed.reduce((s, a) => s + a.input.weight, 0);

  let weightedValue: number | null = null;
  if (developed.length > 0 && Math.abs(totalWeight - 1.0) < 0.001) {
    weightedValue = Math.round(
      developed.reduce((s, a) => s + a.input.indicatedValue! * a.input.weight, 0)
    );
  } else if (developed.length > 0 && totalWeight > 0) {
    // Normalize weights if they don't sum to 1
    weightedValue = Math.round(
      developed.reduce((s, a) => s + (a.input.indicatedValue! * a.input.weight) / totalWeight, 0)
    );
  }

  const developedValues = developed.map((a) => a.input.indicatedValue!);
  const rangeMin = developedValues.length > 0 ? Math.min(...developedValues) : null;
  const rangeMax = developedValues.length > 0 ? Math.max(...developedValues) : null;
  const rangeSpread = rangeMin !== null && rangeMax !== null ? rangeMax - rangeMin : null;
  const rangeSpreadPct =
    rangeSpread !== null && rangeMin !== null && rangeMin > 0
      ? (rangeSpread / rangeMin) * 100
      : null;

  // Final value: use appraiser override if set, otherwise use weighted
  const finalValue = vault.finalValue ?? weightedValue;
  const finalValueRounded = finalValue !== null ? Math.round(finalValue / 500) * 500 : null;

  // USPAP SR 1-6 compliance
  const uspapIssues: string[] = [];
  const sr16a = developed.length > 0 && developed.every((a) => a.input.rationale.trim().length > 0);
  if (!sr16a) uspapIssues.push("SR 1-6(a): All developed approaches must have a rationale statement.");

  const sr16b = developed.every((a) => a.input.applicability !== "Not Applicable");
  if (!sr16b) uspapIssues.push("SR 1-6(b): Approach applicability must be stated for all developed approaches.");

  const sr16c = finalValueRounded !== null && finalValueRounded > 0;
  if (!sr16c) uspapIssues.push("SR 1-6(c): A point value opinion is required.");

  const narrativeOk = vault.reconciliationNarrative.trim().length >= 50;
  if (!narrativeOk) uspapIssues.push("Reconciliation narrative must be at least 50 characters.");

  return {
    costValue: vault.costApproach.indicatedValue,
    salesValue: vault.salesComparison.indicatedValue,
    incomeValue: vault.incomeApproach.indicatedValue,
    developedApproaches: developed.map((a) => ({
      name: a.name,
      value: a.input.indicatedValue!,
      weight: a.input.weight,
      applicability: a.input.applicability,
      weightedContribution: Math.round(a.input.indicatedValue! * (a.input.weight / (totalWeight || 1))),
    })),
    totalWeight,
    weightedValue,
    finalValue,
    finalValueRounded,
    rangeMin,
    rangeMax,
    rangeSpread,
    rangeSpreadPct,
    uspap: {
      sr16a,
      sr16b,
      sr16c,
      compliant: uspapIssues.length === 0,
      issues: uspapIssues,
    },
  };
}

// ---------------------------------------------------------------------------
// Evidence
// ---------------------------------------------------------------------------

export function emitReconciliationEvidence(
  vault: ReconciliationVault,
  result: ReconciliationResult,
  runId: string,
  correlationId: string
): ReconciliationEvidence {
  return {
    runId,
    correlationId,
    fileNumber: vault.fileNumber,
    computedAt: new Date().toISOString(),
    inputSnapshot: {
      costValue: vault.costApproach.indicatedValue,
      salesValue: vault.salesComparison.indicatedValue,
      incomeValue: vault.incomeApproach.indicatedValue,
      costWeight: vault.costApproach.weight,
      salesWeight: vault.salesComparison.weight,
      incomeWeight: vault.incomeApproach.weight,
    },
    outputSnapshot: {
      weightedValue: result.weightedValue,
      finalValue: result.finalValue,
      finalValueRounded: result.finalValueRounded,
      rangeSpreadPct: result.rangeSpreadPct,
    },
    evidenceRefs: [
      {
        fieldCode: "REC_COST_VALUE",
        value: vault.costApproach.indicatedValue,
        source: "CostForge Engine",
        note: vault.costApproach.developed ? `Weight: ${(vault.costApproach.weight * 100).toFixed(0)}% — ${vault.costApproach.applicability}` : "Not developed",
      },
      {
        fieldCode: "REC_SALES_VALUE",
        value: vault.salesComparison.indicatedValue,
        source: "CompVault / Regression",
        note: vault.salesComparison.developed ? `Weight: ${(vault.salesComparison.weight * 100).toFixed(0)}% — ${vault.salesComparison.applicability}` : "Not developed",
      },
      {
        fieldCode: "REC_INCOME_VALUE",
        value: vault.incomeApproach.indicatedValue,
        source: "IncomeVault / DCF",
        note: vault.incomeApproach.developed ? `Weight: ${(vault.incomeApproach.weight * 100).toFixed(0)}% — ${vault.incomeApproach.applicability}` : "Not developed",
      },
      {
        fieldCode: "REC_WEIGHTED_VALUE",
        value: result.weightedValue,
        source: "Weighted Average",
        note: `Range: $${result.rangeMin?.toLocaleString() ?? "—"} – $${result.rangeMax?.toLocaleString() ?? "—"} (${result.rangeSpreadPct?.toFixed(1) ?? "—"}% spread)`,
      },
      {
        fieldCode: "REC_FINAL_VALUE",
        value: result.finalValueRounded,
        source: "Appraiser's Final Opinion",
        note: vault.reconciliationNarrative.slice(0, 100) + (vault.reconciliationNarrative.length > 100 ? "…" : ""),
      },
    ],
    uspapCompliant: result.uspap.compliant,
  };
}

// ---------------------------------------------------------------------------
// Default weight suggestions by property type
// ---------------------------------------------------------------------------

export function suggestWeights(propertyType: string): {
  costWeight: number;
  salesWeight: number;
  incomeWeight: number;
  rationale: string;
} {
  const pt = propertyType.toLowerCase();
  if (pt.includes("office") || pt.includes("retail") || pt.includes("industrial") || pt.includes("commercial")) {
    return {
      costWeight: 0.10,
      salesWeight: 0.40,
      incomeWeight: 0.50,
      rationale: "Income approach receives primary weight for income-producing commercial properties. Sales comparison provides market support. Cost approach is given minimal weight for non-new construction.",
    };
  }
  if (pt.includes("multi") || pt.includes("apartment") || pt.includes("hospitality")) {
    return {
      costWeight: 0.10,
      salesWeight: 0.35,
      incomeWeight: 0.55,
      rationale: "Income approach receives primary weight as investors purchase based on income potential. Sales comparison provides secondary support.",
    };
  }
  if (pt.includes("land") || pt.includes("vacant")) {
    return {
      costWeight: 0.00,
      salesWeight: 1.00,
      incomeWeight: 0.00,
      rationale: "Sales comparison is the only applicable approach for vacant land. No improvements to cost; income approach not applicable.",
    };
  }
  if (pt.includes("new") || pt.includes("proposed")) {
    return {
      costWeight: 0.40,
      salesWeight: 0.60,
      incomeWeight: 0.00,
      rationale: "Cost approach receives significant weight for new or proposed construction. Sales comparison provides market support.",
    };
  }
  // Default: single-family residential
  return {
    costWeight: 0.15,
    salesWeight: 0.85,
    incomeWeight: 0.00,
    rationale: "Sales comparison approach receives primary weight as it best reflects the actions of buyers and sellers in the subject market area. Cost approach provides a check on reasonableness. Income approach is not applicable for owner-occupied residential.",
  };
}
