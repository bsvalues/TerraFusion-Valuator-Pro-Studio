/**
 * TerraFusion Valuator Pro — Phase E/F/G Test Suite
 *
 * 30 tests covering:
 *  - Reconciliation engine (math, weights, USPAP SR 1-6)
 *  - Persistence layer (graceful degradation)
 *  - Subject context governance helpers
 *  - Governance audit (no M&S references)
 *  - suggestWeights by property type
 */

import {
  createReconciliationVault,
  computeReconciliation,
  emitReconciliationEvidence,
  suggestWeights,
  type ReconciliationVault,
  type ApproachInput,
} from "../lib/reconciliation-vault";

import {
  checkSupabaseConnection,
  loadOrders,
  saveOrder,
  loadRunHistory,
  saveRun,
  loadSubjectContext,
  loadAppraiserProfile,
} from "../lib/persistence";

import {
  DEFAULT_SUBJECT_CONTEXT,
  isSubjectReady,
  getMissingSubjectFields,
  newRunId,
  newCorrelationId,
} from "../lib/subject-context";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeApproach(value: number | null, weight: number, developed: boolean): ApproachInput {
  return {
    indicatedValue: value,
    developed,
    weight,
    applicability: developed ? "Primary" : "Not Applicable",
    rationale: "Test",
  };
}

function makeVault(overrides: Partial<ReconciliationVault> = {}): ReconciliationVault {
  const base = createReconciliationVault("TF-26-TEST", "2026-03-18", "commercial");
  return { ...base, ...overrides };
}

// ---------------------------------------------------------------------------
// SECTION 1: Reconciliation Engine — createReconciliationVault (4 tests)
// ---------------------------------------------------------------------------

describe("ReconciliationVault — createReconciliationVault", () => {
  test("R-01: creates vault with correct fileNumber", () => {
    const vault = createReconciliationVault("TF-26-0042", "2026-03-18", "commercial");
    expect(vault.fileNumber).toBe("TF-26-0042");
  });

  test("R-02: default weights are numeric (0 until approaches are developed)", () => {
    const vault = createReconciliationVault("TF-26-TEST", "2026-03-18", "commercial");
    expect(typeof vault.costApproach.weight).toBe("number");
    expect(typeof vault.salesComparison.weight).toBe("number");
    expect(typeof vault.incomeApproach.weight).toBe("number");
  });

  test("R-03: default vault has all approaches not developed", () => {
    const vault = createReconciliationVault("TF-26-TEST", "2026-03-18", "commercial");
    expect(vault.costApproach.developed).toBe(false);
    expect(vault.salesComparison.developed).toBe(false);
    expect(vault.incomeApproach.developed).toBe(false);
  });

  test("R-04: vault has required USPAP fields", () => {
    const vault = createReconciliationVault("TF-26-TEST", "2026-03-18", "commercial");
    expect(vault).toHaveProperty("effectiveDate");
    expect(vault).toHaveProperty("propertyType");
    expect(vault).toHaveProperty("reconciliationNarrative");
  });
});

// ---------------------------------------------------------------------------
// SECTION 2: computeReconciliation — weighted math (8 tests)
// ---------------------------------------------------------------------------

describe("computeReconciliation — weighted value math", () => {
  test("R-05: single approach at weight 1.0 returns its own value", () => {
    const vault = makeVault({
      salesComparison: makeApproach(1_000_000, 1.0, true),
      costApproach: makeApproach(null, 0, false),
      incomeApproach: makeApproach(null, 0, false),
    });
    const result = computeReconciliation(vault);
    expect(result.weightedValue).toBe(1_000_000);
  });

  test("R-06: two approaches at 0.5 each average correctly", () => {
    const vault = makeVault({
      salesComparison: makeApproach(1_000_000, 0.5, true),
      incomeApproach: makeApproach(1_100_000, 0.5, true),
      costApproach: makeApproach(null, 0, false),
    });
    const result = computeReconciliation(vault);
    expect(result.weightedValue).toBe(1_050_000);
  });

  test("R-07: three approaches weighted 60/20/20 compute correctly", () => {
    const vault = makeVault({
      salesComparison: makeApproach(1_000_000, 0.60, true),
      costApproach: makeApproach(950_000, 0.20, true),
      incomeApproach: makeApproach(1_050_000, 0.20, true),
    });
    const result = computeReconciliation(vault);
    // 1,000,000*0.6 + 950,000*0.2 + 1,050,000*0.2 = 600,000 + 190,000 + 210,000 = 1,000,000
    expect(result.weightedValue).toBe(1_000_000);
  });

  test("R-08: finalValueRounded is rounded to nearest $500", () => {
    const vault = makeVault({
      salesComparison: makeApproach(1_234_567, 1.0, true),
      costApproach: makeApproach(null, 0, false),
      incomeApproach: makeApproach(null, 0, false),
    });
    const result = computeReconciliation(vault);
    expect(result.finalValueRounded! % 500).toBe(0);
  });

  test("R-09: rangeMin and rangeMax are set when multiple approaches developed", () => {
    const vault = makeVault({
      salesComparison: makeApproach(1_000_000, 0.6, true),
      costApproach: makeApproach(900_000, 0.2, true),
      incomeApproach: makeApproach(1_100_000, 0.2, true),
    });
    const result = computeReconciliation(vault);
    expect(result.rangeMin).toBe(900_000);
    expect(result.rangeMax).toBe(1_100_000);
  });

  test("R-10: rangeSpreadPct is calculated correctly", () => {
    const vault = makeVault({
      salesComparison: makeApproach(1_000_000, 0.6, true),
      costApproach: makeApproach(900_000, 0.4, true),
      incomeApproach: makeApproach(null, 0, false),
    });
    const result = computeReconciliation(vault);
    // Spread = (1,000,000 - 900,000) / 950,000 * 100 ≈ 10.53%
    expect(result.rangeSpreadPct).toBeGreaterThan(0);
    expect(result.rangeSpreadPct).toBeLessThan(20);
  });

  test("R-11: USPAP SR 1-6(c) compliant when point value is set", () => {
    const vault = makeVault({
      salesComparison: makeApproach(1_000_000, 1.0, true),
      costApproach: makeApproach(null, 0, false),
      incomeApproach: makeApproach(null, 0, false),
    });
    const result = computeReconciliation(vault);
    expect(result.uspap.sr16c).toBe(true);
  });

  test("R-12: USPAP SR 1-6(a) requires at least one developed approach", () => {
    const vault = makeVault({
      salesComparison: makeApproach(null, 0, false),
      costApproach: makeApproach(null, 0, false),
      incomeApproach: makeApproach(null, 0, false),
    });
    const result = computeReconciliation(vault);
    expect(result.uspap.sr16a).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SECTION 3: emitReconciliationEvidence (4 tests)
// ---------------------------------------------------------------------------

describe("emitReconciliationEvidence", () => {
  const vault = makeVault({
    salesComparison: makeApproach(1_000_000, 0.6, true),
    costApproach: makeApproach(950_000, 0.2, true),
    incomeApproach: makeApproach(1_050_000, 0.2, true),
  });
  const result = computeReconciliation(vault);
  const runId = newRunId();
  const corrId = newCorrelationId();

  test("R-13: evidence has REC_FINAL_VALUE field", () => {
    const evidence = emitReconciliationEvidence(vault, result, runId, corrId);
    const finalRef = evidence.evidenceRefs.find((r) => r.fieldCode === "REC_FINAL_VALUE");
    expect(finalRef).toBeDefined();
  });

  test("R-14: evidence has REC_WEIGHTED_VALUE field", () => {
    const evidence = emitReconciliationEvidence(vault, result, runId, corrId);
    const wRef = evidence.evidenceRefs.find((r) => r.fieldCode === "REC_WEIGHTED_VALUE");
    expect(wRef).toBeDefined();
  });

  test("R-15: evidence includes all three approach field codes", () => {
    const evidence = emitReconciliationEvidence(vault, result, runId, corrId);
    const codes = evidence.evidenceRefs.map((r) => r.fieldCode);
    expect(codes).toContain("REC_COST_VALUE");
    expect(codes).toContain("REC_SALES_VALUE");
    expect(codes).toContain("REC_INCOME_VALUE");
  });

  test("R-16: evidence uspapCompliant matches result.uspap.compliant", () => {
    const evidence = emitReconciliationEvidence(vault, result, runId, corrId);
    expect(evidence.uspapCompliant).toBe(result.uspap.compliant);
  });
});

// ---------------------------------------------------------------------------
// SECTION 4: suggestWeights by property type (4 tests)
// ---------------------------------------------------------------------------

describe("suggestWeights — property type defaults", () => {
  test("R-17: commercial office gives income approach primary weight", () => {
    const w = suggestWeights("office");
    expect(w.incomeWeight).toBeGreaterThan(w.salesWeight);
    expect(w.incomeWeight).toBeGreaterThan(w.costWeight);
  });

  test("R-18: single-family residential gives sales comparison primary weight", () => {
    const w = suggestWeights("single_family");
    expect(w.salesWeight).toBeGreaterThan(w.incomeWeight);
    expect(w.salesWeight).toBeGreaterThan(w.costWeight);
  });

  test("R-19: vacant land gives sales comparison 100% weight", () => {
    const w = suggestWeights("vacant land");
    expect(w.salesWeight).toBe(1.0);
    expect(w.costWeight).toBe(0);
    expect(w.incomeWeight).toBe(0);
  });

  test("R-20: weights always sum to 1.0 for any property type", () => {
    const types = ["office", "retail", "industrial", "single_family", "vacant land", "apartment", "proposed construction"];
    for (const t of types) {
      const w = suggestWeights(t);
      expect(w.costWeight + w.salesWeight + w.incomeWeight).toBeCloseTo(1.0, 5);
    }
  });
});

// ---------------------------------------------------------------------------
// SECTION 5: Persistence Layer — graceful degradation (6 tests)
// ---------------------------------------------------------------------------

describe("Persistence Layer — graceful degradation (no Supabase)", () => {
  test("P-01: checkSupabaseConnection returns connected=false when not configured", async () => {
    const result = await checkSupabaseConnection();
    expect(result.connected).toBe(false);
    expect(typeof result.message).toBe("string");
  });

  test("P-02: loadOrders returns empty array", async () => {
    const orders = await loadOrders();
    expect(Array.isArray(orders)).toBe(true);
    expect(orders).toHaveLength(0);
  });

  test("P-03: saveOrder returns null", async () => {
    const subject = {
      ...DEFAULT_SUBJECT_CONTEXT,
      fileNumber: "TF-TEST-001",
      address: "123 Main St",
      city: "Austin",
      state: "TX",
      effectiveDate: "2026-03-18",
      intendedUse: "Mortgage Finance" as const,
      propertyRights: "Fee Simple" as const,
    };
    const result = await saveOrder(subject);
    expect(result).toBeNull();
  });

  test("P-04: loadRunHistory returns empty array", async () => {
    const runs = await loadRunHistory("TF-TEST-001");
    expect(Array.isArray(runs)).toBe(true);
    expect(runs).toHaveLength(0);
  });

  test("P-05: saveRun resolves without throwing", async () => {
    const run = {
      runId: newRunId(),
      runType: "cost" as const,
      fileNumber: "TF-TEST-001",
      propertyId: null,
      triggeredBy: "appraiser",
      reasonCode: "Test run",
      correlationId: newCorrelationId(),
      status: "complete" as const,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      inputSnapshot: {},
      outputSnapshot: {},
      evidenceRefs: [],
      narrativeReady: false,
    };
    await expect(saveRun("order-id", run)).resolves.toBeUndefined();
  });

  test("P-06: loadAppraiserProfile returns null", async () => {
    const profile = await loadAppraiserProfile();
    expect(profile).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// SECTION 6: Subject Context Governance (4 tests)
// ---------------------------------------------------------------------------

describe("SubjectContext — governance helpers", () => {
  test("G-01: DEFAULT_SUBJECT_CONTEXT is not ready", () => {
    expect(isSubjectReady(DEFAULT_SUBJECT_CONTEXT)).toBe(false);
  });

  test("G-02: getMissingSubjectFields lists all required fields when empty", () => {
    const missing = getMissingSubjectFields(DEFAULT_SUBJECT_CONTEXT);
    expect(missing.length).toBeGreaterThanOrEqual(5);
  });

  test("G-03: isSubjectReady returns true when all required fields set", () => {
    const ctx = {
      ...DEFAULT_SUBJECT_CONTEXT,
      fileNumber: "TF-26-0042",
      address: "1847 Oak Ridge Drive",
      city: "Austin",
      state: "TX",
      effectiveDate: "2026-03-18",
      intendedUse: "Mortgage Finance" as const,
      propertyRights: "Fee Simple" as const,
    };
    expect(isSubjectReady(ctx)).toBe(true);
  });

  test("G-04: newRunId and newCorrelationId generate unique values", () => {
    const ids = new Set(Array.from({ length: 10 }, () => newRunId()));
    expect(ids.size).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// SECTION 7: Governance Audit — No M&S References (4 tests)
// ---------------------------------------------------------------------------

describe("Governance Audit — No Marshall & Swift references", () => {
  const fs = require("fs");
  const path = require("path");

  function hasMSRef(filePath: string): boolean {
    const content = fs.readFileSync(filePath, "utf-8");
    // Exclude lines that are governance comments explicitly prohibiting M&S references
    const lines = content.split("\n").filter((line: string) => {
      const isComment = line.trim().startsWith("//") || line.trim().startsWith("*");
      const isProhibition = /no marshall|prohibit|references.*anywhere/i.test(line);
      return !(isComment && isProhibition);
    });
    return /marshall\s*&\s*swift|marshall\s+swift|m\s*&\s*s\s+cost/i.test(lines.join("\n"));
  }

  test("MS-01: reconciliation-vault.ts has no M&S reference", () => {
    expect(hasMSRef(path.join(__dirname, "../lib/reconciliation-vault.ts"))).toBe(false);
  });

  test("MS-02: persistence.ts has no M&S reference", () => {
    expect(hasMSRef(path.join(__dirname, "../lib/persistence.ts"))).toBe(false);
  });

  test("MS-03: income-vault.ts has no M&S reference", () => {
    expect(hasMSRef(path.join(__dirname, "../lib/income-vault.ts"))).toBe(false);
  });

  test("MS-04: all lib/*.ts files have no M&S references", () => {
    const libDir = path.join(__dirname, "../lib");
    const files = fs.readdirSync(libDir)
      .filter((f: string) => f.endsWith(".ts"))
      .map((f: string) => path.join(libDir, f));
    const violations = files.filter(hasMSRef);
    expect(violations).toHaveLength(0);
  });
});
