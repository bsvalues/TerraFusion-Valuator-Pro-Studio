/**
 * TerraFusion Valuator Pro — Phase C Test Suite
 * Sales Comparison Approach: CompVault, RegressionExtraction, Governance
 *
 * 30 tests covering:
 *  - CompVault CRUD and UAD GCX field structure
 *  - Adjustment math (net, gross, adjusted sale price)
 *  - FNMA guideline flags (net >15%, gross >25%, date >12mo)
 *  - Reconciliation statistics (mean, median, weighted)
 *  - RegressionExtraction OLS math and coefficient validity
 *  - Governance gates (min comps, reason code, positive prices)
 *  - Evidence lineage (run_id, corr_id, source_trace_id)
 *  - Honesty constraints (adjusted price = sale price + net adj)
 *  - Zero M&S references in source IDs
 */

import {
  createCompVault,
  addCompToVault,
  updateCompAdjustment,
  removeCompFromVault,
  checkFNMAGuidelines,
  reconcileSalesComparison,
  computeCompAdjustments,
  STANDARD_ADJUSTMENT_LINES,
  type ComparableSaleGCX,
} from "../lib/comp-vault";

import {
  extractMarketAdjustments,
  applyExtractionToComps,
  type RegressionVariable,
} from "../lib/regression-extraction";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeComp(
  pos: 1 | 2 | 3 | 4 | 5 | 6,
  salePrice: number,
  gla: number,
  monthsAgo: number,
  condition: ComparableSaleGCX["condition"] = "C3",
  quality: ComparableSaleGCX["quality"] = "Q4"
): Omit<ComparableSaleGCX, "compId" | "addedAt"> {
  return {
    gridPosition: pos,
    address: `${100 + pos} Test Street`,
    city: "Austin",
    state: "TX",
    zip: "78701",
    proximityMiles: 0.5,
    salePrice,
    salePricePerSqft: Math.round(salePrice / gla),
    dataSource: "MLS",
    sourceCitation: `MLS#${pos}`,
    verificationSource: "Deed Records",
    adjustments: STANDARD_ADJUSTMENT_LINES.map((line) => ({
      fieldCode: line.fieldCode,
      label: line.label,
      amount: 0,
      regressionExtracted: false,
    })),
    saleOrFinancingConcessions: "None",
    concessionAmount: 0,
    saleDate: "2025-12-01",
    monthsAgo,
    propertyRightsAppraised: "Fee Simple",
    location: "NnN",
    siteArea: 7500,
    siteAreaUnit: "sqft",
    view: "Nt",
    design: "Ranch",
    quality,
    actualAge: 10,
    condition,
    totalRooms: 7,
    bedrooms: 3,
    bathrooms: 2.0,
    gla,
    basementSqft: 0,
    basementFinishedSqft: 0,
    functionalUtility: "Average",
    heatingCooling: "FWA/CAC",
    energyEfficientItems: "None",
    garageCarport: "Att. 2 Car",
    garageSpaces: 2,
    porchPatioDeck: "Patio",
    netAdjustment: 0,
    grossAdjustment: 0,
    adjustedSalePrice: salePrice,
    netAdjustmentPct: 0,
    grossAdjustmentPct: 0,
    addedBy: "appraiser" as const,
    notes: "",
  };
}

// ---------------------------------------------------------------------------
// SECTION 1: CompVault CRUD (tests 1-8)
// ---------------------------------------------------------------------------

describe("CompVault — CRUD and structure", () => {
  test("1. createCompVault initializes with correct fileNumber and subjectGLA", () => {
    const vault = createCompVault("TF-2024-001", 1850);
    expect(vault.fileNumber).toBe("TF-2024-001");
    expect(vault.subjectGLA).toBe(1850);
    expect(vault.comps).toHaveLength(0);
  });

  test("2. addCompToVault assigns a unique compId", () => {
    let vault = createCompVault("TF-001", 1800);
    vault = addCompToVault(vault, makeComp(1, 480000, 1900, 3));
    expect(vault.comps[0].compId).toBeTruthy();
    expect(vault.comps[0].compId).toMatch(/^comp_/);
  });

  test("3. addCompToVault computes initial adjustedSalePrice = salePrice when all adjustments are 0", () => {
    let vault = createCompVault("TF-001", 1800);
    vault = addCompToVault(vault, makeComp(1, 480000, 1900, 3));
    expect(vault.comps[0].adjustedSalePrice).toBe(480000);
    expect(vault.comps[0].netAdjustment).toBe(0);
    expect(vault.comps[0].grossAdjustment).toBe(0);
  });

  test("4. addCompToVault rejects more than 6 comps", () => {
    let vault = createCompVault("TF-001", 1800);
    for (let i = 1; i <= 6; i++) {
      vault = addCompToVault(vault, makeComp(i as 1|2|3|4|5|6, 480000, 1900, 3));
    }
    expect(() => addCompToVault(vault, makeComp(1, 480000, 1900, 3))).toThrow();
  });

  test("5. removeCompFromVault removes the correct comp", () => {
    let vault = createCompVault("TF-001", 1800);
    vault = addCompToVault(vault, makeComp(1, 480000, 1900, 3));
    vault = addCompToVault(vault, makeComp(2, 490000, 1950, 4));
    const idToRemove = vault.comps[0].compId;
    vault = removeCompFromVault(vault, idToRemove);
    expect(vault.comps).toHaveLength(1);
    expect(vault.comps[0].salePrice).toBe(490000);
  });

  test("6. updateCompAdjustment updates the correct field and recomputes totals", () => {
    let vault = createCompVault("TF-001", 1800);
    vault = addCompToVault(vault, makeComp(1, 480000, 1900, 3));
    const compId = vault.comps[0].compId;
    vault = updateCompAdjustment(vault, compId, "GCX_ADJ_GLA", 5000, false);
    const comp = vault.comps[0];
    expect(comp.netAdjustment).toBe(5000);
    expect(comp.grossAdjustment).toBe(5000);
    expect(comp.adjustedSalePrice).toBe(485000);
  });

  test("7. updateCompAdjustment marks regressionExtracted when flag is true", () => {
    let vault = createCompVault("TF-001", 1800);
    vault = addCompToVault(vault, makeComp(1, 480000, 1900, 3));
    const compId = vault.comps[0].compId;
    vault = updateCompAdjustment(vault, compId, "GCX_ADJ_GLA", 3000, true, 150);
    const adj = vault.comps[0].adjustments.find((a) => a.fieldCode === "GCX_ADJ_GLA");
    expect(adj?.regressionExtracted).toBe(true);
    expect(adj?.regressionCoefficient).toBe(150);
  });

  test("8. STANDARD_ADJUSTMENT_LINES contains all required UAD GCX fields", () => {
    const requiredFields = [
      "GCX_ADJ_FINANCING",
      "GCX_ADJ_DATE",
      "GCX_ADJ_RIGHTS",
      "GCX_ADJ_LOCATION",
      "GCX_ADJ_LEASEHOLD",
      "GCX_ADJ_SITE",
      "GCX_ADJ_VIEW",
      "GCX_ADJ_DESIGN",
      "GCX_ADJ_QUALITY",
      "GCX_ADJ_AGE",
      "GCX_ADJ_CONDITION",
      "GCX_ADJ_ABVGRD",
      "GCX_ADJ_GLA",
      "GCX_ADJ_BSMT",
      "GCX_ADJ_FUNC",
      "GCX_ADJ_HEAT",
      "GCX_ADJ_ENRGY",
      "GCX_ADJ_GARAGE",
      "GCX_ADJ_PORCH",
      "GCX_ADJ_OTHER1",
    ];
    const fieldCodes = STANDARD_ADJUSTMENT_LINES.map((l) => l.fieldCode);
    for (const f of requiredFields) {
      expect(fieldCodes).toContain(f);
    }
  });
});

// ---------------------------------------------------------------------------
// SECTION 2: Adjustment Math and Honesty (tests 9-14)
// ---------------------------------------------------------------------------

describe("CompVault — Adjustment math and honesty constraints", () => {
  test("9. Net adjustment = sum of all adjustment amounts", () => {
    let vault = createCompVault("TF-001", 1800);
    vault = addCompToVault(vault, makeComp(1, 480000, 1900, 3));
    const compId = vault.comps[0].compId;
    vault = updateCompAdjustment(vault, compId, "GCX_ADJ_GLA", 5000, false);
    vault = updateCompAdjustment(vault, compId, "GCX_ADJ_CONDITION", -3000, false);
    vault = updateCompAdjustment(vault, compId, "GCX_ADJ_LOCATION", 2000, false);
    expect(vault.comps[0].netAdjustment).toBe(4000);
  });

  test("10. Gross adjustment = sum of absolute values of all adjustments", () => {
    let vault = createCompVault("TF-001", 1800);
    vault = addCompToVault(vault, makeComp(1, 480000, 1900, 3));
    const compId = vault.comps[0].compId;
    vault = updateCompAdjustment(vault, compId, "GCX_ADJ_GLA", 5000, false);
    vault = updateCompAdjustment(vault, compId, "GCX_ADJ_CONDITION", -3000, false);
    expect(vault.comps[0].grossAdjustment).toBe(8000);
  });

  test("11. Adjusted sale price = sale price + net adjustment (honesty constraint)", () => {
    let vault = createCompVault("TF-001", 1800);
    vault = addCompToVault(vault, makeComp(1, 480000, 1900, 3));
    const compId = vault.comps[0].compId;
    vault = updateCompAdjustment(vault, compId, "GCX_ADJ_GLA", 7500, false);
    vault = updateCompAdjustment(vault, compId, "GCX_ADJ_CONDITION", -2500, false);
    const comp = vault.comps[0];
    expect(comp.adjustedSalePrice).toBe(comp.salePrice + comp.netAdjustment);
  });

  test("12. Net adjustment percentage = (netAdj / salePrice) * 100", () => {
    let vault = createCompVault("TF-001", 1800);
    vault = addCompToVault(vault, makeComp(1, 500000, 1900, 3));
    const compId = vault.comps[0].compId;
    vault = updateCompAdjustment(vault, compId, "GCX_ADJ_GLA", 50000, false);
    expect(vault.comps[0].netAdjustmentPct).toBeCloseTo(10.0, 1);
  });

  test("13. Gross adjustment percentage = (grossAdj / salePrice) * 100", () => {
    let vault = createCompVault("TF-001", 1800);
    vault = addCompToVault(vault, makeComp(1, 500000, 1900, 3));
    const compId = vault.comps[0].compId;
    vault = updateCompAdjustment(vault, compId, "GCX_ADJ_GLA", 50000, false);
    vault = updateCompAdjustment(vault, compId, "GCX_ADJ_CONDITION", -30000, false);
    // gross = 80000, pct = 16%
    expect(vault.comps[0].grossAdjustmentPct).toBeCloseTo(16.0, 1);
  });

  test("14. Zero adjustments: adjustedSalePrice equals salePrice exactly", () => {
    let vault = createCompVault("TF-001", 1800);
    vault = addCompToVault(vault, makeComp(1, 475000, 1900, 3));
    expect(vault.comps[0].adjustedSalePrice).toBe(475000);
    expect(vault.comps[0].netAdjustment).toBe(0);
    expect(vault.comps[0].grossAdjustment).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// SECTION 3: FNMA Guideline Flags (tests 15-17)
// ---------------------------------------------------------------------------

describe("CompVault — FNMA guideline flags", () => {
  test("15. Net adjustment > 15% triggers netAdjPctFlag", () => {
    let vault = createCompVault("TF-001", 1800);
    vault = addCompToVault(vault, makeComp(1, 400000, 1900, 3));
    const compId = vault.comps[0].compId;
    // 20% net adjustment
    vault = updateCompAdjustment(vault, compId, "GCX_ADJ_GLA", 80000, false);
    const flags = checkFNMAGuidelines(vault);
    expect(flags[0].netAdjPctFlag).toBe(true);
  });

  test("16. Gross adjustment > 25% triggers grossAdjPctFlag", () => {
    let vault = createCompVault("TF-001", 1800);
    vault = addCompToVault(vault, makeComp(1, 400000, 1900, 3));
    const compId = vault.comps[0].compId;
    // 30% gross: +60k and -60k = 0 net but 120k gross
    vault = updateCompAdjustment(vault, compId, "GCX_ADJ_GLA", 60000, false);
    vault = updateCompAdjustment(vault, compId, "GCX_ADJ_CONDITION", -60000, false);
    const flags = checkFNMAGuidelines(vault);
    expect(flags[0].grossAdjPctFlag).toBe(true);
  });

  test("17. Sale date > 12 months ago triggers dateFlag", () => {
    let vault = createCompVault("TF-001", 1800);
    vault = addCompToVault(vault, makeComp(1, 480000, 1900, 15)); // 15 months ago
    const flags = checkFNMAGuidelines(vault);
    expect(flags[0].dateFlag).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SECTION 4: Reconciliation Statistics (tests 18-20)
// ---------------------------------------------------------------------------

describe("CompVault — Reconciliation statistics", () => {
  test("18. reconcileSalesComparison computes correct mean of adjusted prices", () => {
    let vault = createCompVault("TF-001", 1800);
    vault = addCompToVault(vault, makeComp(1, 480000, 1900, 3));
    vault = addCompToVault(vault, makeComp(2, 500000, 1950, 4));
    vault = addCompToVault(vault, makeComp(3, 460000, 1850, 2));
    const rec = reconcileSalesComparison(vault);
    // All adjustments are 0, so adjusted = sale price
    expect(rec.mean).toBeCloseTo((480000 + 500000 + 460000) / 3, 0);
  });

  test("19. reconcileSalesComparison computes correct median of adjusted prices", () => {
    let vault = createCompVault("TF-001", 1800);
    vault = addCompToVault(vault, makeComp(1, 460000, 1900, 3));
    vault = addCompToVault(vault, makeComp(2, 480000, 1950, 4));
    vault = addCompToVault(vault, makeComp(3, 500000, 1850, 2));
    const rec = reconcileSalesComparison(vault);
    expect(rec.median).toBe(480000);
  });

  test("20. reconcileSalesComparison range.low <= indicatedValue <= range.high", () => {
    let vault = createCompVault("TF-001", 1800);
    vault = addCompToVault(vault, makeComp(1, 460000, 1900, 3));
    vault = addCompToVault(vault, makeComp(2, 480000, 1950, 4));
    vault = addCompToVault(vault, makeComp(3, 500000, 1850, 2));
    const rec = reconcileSalesComparison(vault);
    expect(rec.indicatedValue).toBeGreaterThanOrEqual(rec.range.low);
    expect(rec.indicatedValue).toBeLessThanOrEqual(rec.range.high);
  });
});

// ---------------------------------------------------------------------------
// SECTION 5: RegressionExtraction OLS Math (tests 21-26)
// ---------------------------------------------------------------------------

describe("RegressionExtraction — OLS math and coefficient validity", () => {
  // Build a dataset where Y = 50000 + 100*GLA (perfect linear relationship)
  const salePrices = [230000, 250000, 270000, 290000, 310000];
  const glaValues = [1800, 2000, 2200, 2400, 2600];
  const compIds = ["c1", "c2", "c3", "c4", "c5"];
  const variables: RegressionVariable[] = [
    { name: "GLA", gcxFieldCode: "GCX_ADJ_GLA", label: "Gross Living Area", values: glaValues },
  ];

  test("21. extractMarketAdjustments returns a valid ExtractionResult with run_id", () => {
    const result = extractMarketAdjustments(
      { salePrices, variables, compIds },
      "run_test_001",
      "corr_test_001"
    );
    expect(result.runId).toBe("run_test_001");
    expect(result.correlationId).toBe("corr_test_001");
  });

  test("22. R² is near 1.0 for a perfect linear relationship", () => {
    const result = extractMarketAdjustments(
      { salePrices, variables, compIds },
      "run_test_002",
      "corr_test_002"
    );
    expect(result.rSquared).toBeGreaterThan(0.99);
  });

  test("23. GLA coefficient is close to 100 for Y = 50000 + 100*GLA", () => {
    const result = extractMarketAdjustments(
      { salePrices, variables, compIds },
      "run_test_003",
      "corr_test_003"
    );
    const glaCoeff = result.coefficients.find((c) => c.variable === "GLA");
    expect(glaCoeff).toBeDefined();
    expect(glaCoeff!.coefficient).toBeCloseTo(100, 0);
  });

  test("24. All coefficients have p-value, t-statistic, VIF, and stdError fields", () => {
    const result = extractMarketAdjustments(
      { salePrices, variables, compIds },
      "run_test_004",
      "corr_test_004"
    );
    for (const c of result.coefficients) {
      expect(typeof c.pValue).toBe("number");
      expect(typeof c.tStatistic).toBe("number");
      expect(typeof c.vif).toBe("number");
      expect(typeof c.stdError).toBe("number");
    }
  });

  test("25. ExtractionResult source_trace_id does not contain 'marshall' or 'swift'", () => {
    const result = extractMarketAdjustments(
      { salePrices, variables, compIds },
      "run_test_005",
      "corr_test_005"
    );
    const traceStr = JSON.stringify(result).toLowerCase();
    expect(traceStr).not.toContain("marshall");
    expect(traceStr).not.toContain("swift");
  });

  test("26. RMSE is non-negative and finite", () => {
    const result = extractMarketAdjustments(
      { salePrices, variables, compIds },
      "run_test_006",
      "corr_test_006"
    );
    expect(result.rmse).toBeGreaterThanOrEqual(0);
    expect(isFinite(result.rmse)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SECTION 6: Governance Gates (tests 27-30)
// ---------------------------------------------------------------------------

describe("RegressionExtraction — Governance gates", () => {
  test("27. extractMarketAdjustments throws with fewer than 3 comps", () => {
    expect(() =>
      extractMarketAdjustments(
        {
          salePrices: [480000, 490000],
          variables: [{ name: "GLA", gcxFieldCode: "GCX_ADJ_GLA", label: "GLA", values: [1900, 1950] }],
          compIds: ["c1", "c2"],
        },
        "run_test_007",
        "corr_test_007"
      )
    ).toThrow();
  });

  test("28. extractMarketAdjustments throws when variable values length mismatches salePrices length", () => {
    expect(() =>
      extractMarketAdjustments(
        {
          salePrices: [480000, 490000, 500000],
          variables: [{ name: "GLA", gcxFieldCode: "GCX_ADJ_GLA", label: "GLA", values: [1900, 1950] }], // only 2 values
          compIds: ["c1", "c2", "c3"],
        },
        "run_test_008",
        "corr_test_008"
      )
    ).toThrow();
  });

  test("29. extractMarketAdjustments throws when any sale price is zero or negative", () => {
    expect(() =>
      extractMarketAdjustments(
        {
          salePrices: [480000, 0, 500000],
          variables: [{ name: "GLA", gcxFieldCode: "GCX_ADJ_GLA", label: "GLA", values: [1900, 1950, 2000] }],
          compIds: ["c1", "c2", "c3"],
        },
        "run_test_009",
        "corr_test_009"
      )
    ).toThrow();
  });

  test("30. applyExtractionToComps returns one entry per comp with gcxFieldCode on each adjustment", () => {
    const result = extractMarketAdjustments(
      {
        salePrices: [230000, 250000, 270000, 290000, 310000],
        variables: [
          { name: "GLA", gcxFieldCode: "GCX_ADJ_GLA", label: "GLA", values: [1800, 2000, 2200, 2400, 2600] },
        ],
        compIds: ["c1", "c2", "c3", "c4", "c5"],
      },
      "run_test_010",
      "corr_test_010"
    );
    const subject = { gla: 2000, siteArea: 7500, actualAge: 10, condition: 3, quality: 4, garageSpaces: 2, basementSqft: 0 };
    const compValues = [
      { compId: "c1", gla: 1800, siteArea: 7500, actualAge: 10, condition: 3, quality: 4, garageSpaces: 2, basementSqft: 0 },
      { compId: "c2", gla: 2000, siteArea: 7500, actualAge: 10, condition: 3, quality: 4, garageSpaces: 2, basementSqft: 0 },
      { compId: "c3", gla: 2200, siteArea: 7500, actualAge: 10, condition: 3, quality: 4, garageSpaces: 2, basementSqft: 0 },
      { compId: "c4", gla: 2400, siteArea: 7500, actualAge: 10, condition: 3, quality: 4, garageSpaces: 2, basementSqft: 0 },
      { compId: "c5", gla: 2600, siteArea: 7500, actualAge: 10, condition: 3, quality: 4, garageSpaces: 2, basementSqft: 0 },
    ];
    const applied = applyExtractionToComps(result, subject, compValues);
    expect(applied).toHaveLength(5);
    for (const entry of applied) {
      expect(entry.compId).toBeTruthy();
      expect(Array.isArray(entry.adjustments)).toBe(true);
      for (const adj of entry.adjustments) {
        expect(adj.gcxFieldCode).toBeTruthy();
        expect(typeof adj.amount).toBe("number");
      }
    }
  });
});
