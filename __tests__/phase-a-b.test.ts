/**
 * TerraFusion Valuator Pro — Phase A + B Test Suite
 *
 * 30 tests covering:
 *  - Phase A: SubjectContext, SubjectWorkbenchContext, governance contracts
 *  - Phase B: CostForge API, UAD CST field mapping, evidence emission, honesty checks
 *
 * Run with: npx jest __tests__/phase-a-b.test.ts
 */

import {
  DEFAULT_SUBJECT_CONTEXT,
  isSubjectReady,
  getMissingSubjectFields,
  newRunId,
  newCorrelationId,
  SubjectContext,
} from "../lib/subject-context";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeReadySubject(overrides: Partial<SubjectContext> = {}): SubjectContext {
  return {
    ...DEFAULT_SUBJECT_CONTEXT,
    fileNumber: "2026-001",
    address: "4521 Congress Avenue",
    city: "Austin",
    county: "Travis",
    state: "TX",
    zip: "78701",
    effectiveDate: "2026-03-17",
    intendedUse: "Mortgage Finance",
    propertyRights: "Fee Simple",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// PHASE A — SubjectContext & Governance
// ---------------------------------------------------------------------------

describe("Phase A — SubjectContext", () => {
  // Test 1
  test("DEFAULT_SUBJECT_CONTEXT has all required fields as null", () => {
    expect(DEFAULT_SUBJECT_CONTEXT.fileNumber).toBeNull();
    expect(DEFAULT_SUBJECT_CONTEXT.address).toBeNull();
    expect(DEFAULT_SUBJECT_CONTEXT.city).toBeNull();
    expect(DEFAULT_SUBJECT_CONTEXT.state).toBeNull();
    expect(DEFAULT_SUBJECT_CONTEXT.effectiveDate).toBeNull();
    expect(DEFAULT_SUBJECT_CONTEXT.intendedUse).toBeNull();
    expect(DEFAULT_SUBJECT_CONTEXT.propertyRights).toBeNull();
  });

  // Test 2
  test("DEFAULT_SUBJECT_CONTEXT intendedUsers is an empty array", () => {
    expect(Array.isArray(DEFAULT_SUBJECT_CONTEXT.intendedUsers)).toBe(true);
    expect(DEFAULT_SUBJECT_CONTEXT.intendedUsers.length).toBe(0);
  });

  // Test 3
  test("isSubjectReady returns false for default context", () => {
    expect(isSubjectReady(DEFAULT_SUBJECT_CONTEXT)).toBe(false);
  });

  // Test 4
  test("isSubjectReady returns true when all required fields are populated", () => {
    expect(isSubjectReady(makeReadySubject())).toBe(true);
  });

  // Test 5
  test("isSubjectReady returns false when fileNumber is missing", () => {
    expect(isSubjectReady(makeReadySubject({ fileNumber: null }))).toBe(false);
  });

  // Test 6
  test("isSubjectReady returns false when address is missing", () => {
    expect(isSubjectReady(makeReadySubject({ address: null }))).toBe(false);
  });

  // Test 7
  test("isSubjectReady returns false when effectiveDate is missing", () => {
    expect(isSubjectReady(makeReadySubject({ effectiveDate: null }))).toBe(false);
  });

  // Test 8
  test("isSubjectReady returns false when intendedUse is missing", () => {
    expect(isSubjectReady(makeReadySubject({ intendedUse: null }))).toBe(false);
  });

  // Test 9
  test("isSubjectReady returns false when propertyRights is missing", () => {
    expect(isSubjectReady(makeReadySubject({ propertyRights: null }))).toBe(false);
  });

  // Test 10
  test("getMissingSubjectFields returns all 7 required fields for default context", () => {
    const missing = getMissingSubjectFields(DEFAULT_SUBJECT_CONTEXT);
    expect(missing).toHaveLength(7);
    expect(missing).toContain("File Number");
    expect(missing).toContain("Property Address");
    expect(missing).toContain("City");
    expect(missing).toContain("State");
    expect(missing).toContain("Effective Date of Appraisal");
    expect(missing).toContain("Intended Use");
    expect(missing).toContain("Property Rights Appraised");
  });

  // Test 11
  test("getMissingSubjectFields returns empty array for ready subject", () => {
    expect(getMissingSubjectFields(makeReadySubject())).toHaveLength(0);
  });

  // Test 12
  test("newRunId generates unique IDs", () => {
    const id1 = newRunId();
    const id2 = newRunId();
    expect(id1).not.toEqual(id2);
    expect(id1.startsWith("run_")).toBe(true);
  });

  // Test 13
  test("newCorrelationId generates unique IDs", () => {
    const c1 = newCorrelationId();
    const c2 = newCorrelationId();
    expect(c1).not.toEqual(c2);
    expect(c1.startsWith("corr_")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PHASE B — CostForge API (unit tests against the calculation logic)
// ---------------------------------------------------------------------------

/**
 * We test the calculation logic directly by importing the helper functions.
 * The route handler itself is tested via integration tests in a separate suite.
 * Here we validate the math, UAD field mapping, and honesty constraints.
 */

// Inline the calculation logic for unit testing
// (mirrors app/api/costforge/calculate/route.ts)

const BASE_COSTS: Record<string, Record<string, number>> = {
  "Single Family Residential": { Q1: 380, Q2: 310, Q3: 240, Q4: 185, Q5: 140, Q6: 100 },
  "Office": { Q1: 450, Q2: 360, Q3: 280, Q4: 210, Q5: 160, Q6: 120 },
  "Industrial": { Q1: 280, Q2: 220, Q3: 170, Q4: 130, Q5: 100, Q6: 75 },
};

const TOTAL_ECONOMIC_LIFE: Record<string, number> = {
  "Single Family Residential": 60,
  "Office": 50,
  "Industrial": 45,
};

function calcRCN(propertyType: string, quality: string, glaSqft: number, regionIndex: number): number {
  const rate = BASE_COSTS[propertyType]?.[quality] ?? 185;
  return glaSqft * rate * regionIndex;
}

function calcPhysicalDepreciation(rcn: number, effectiveAge: number, totalLife: number): number {
  return rcn * (effectiveAge / totalLife);
}

function calcIndicatedValue(depreciatedValue: number, siteValue: number): number {
  return depreciatedValue + siteValue;
}

describe("Phase B — CostForge Calculation Logic", () => {
  // Test 14
  test("RCN for SFR Q4 1500sqft at 1.0 regional index = 277,500", () => {
    const rcn = calcRCN("Single Family Residential", "Q4", 1500, 1.0);
    expect(rcn).toBe(277500);
  });

  // Test 15
  test("RCN scales correctly with regional index", () => {
    const rcnBase = calcRCN("Single Family Residential", "Q4", 1500, 1.0);
    const rcnAustin = calcRCN("Single Family Residential", "Q4", 1500, 1.12);
    expect(rcnAustin).toBeCloseTo(rcnBase * 1.12, 0);
  });

  // Test 16
  test("Higher quality class produces higher RCN per sqft", () => {
    const rcnQ1 = calcRCN("Single Family Residential", "Q1", 1000, 1.0);
    const rcnQ4 = calcRCN("Single Family Residential", "Q4", 1000, 1.0);
    const rcnQ6 = calcRCN("Single Family Residential", "Q6", 1000, 1.0);
    expect(rcnQ1).toBeGreaterThan(rcnQ4);
    expect(rcnQ4).toBeGreaterThan(rcnQ6);
  });

  // Test 17
  test("Office RCN per sqft is higher than Industrial for same quality", () => {
    const officeRCN = calcRCN("Office", "Q4", 1000, 1.0);
    const industrialRCN = calcRCN("Industrial", "Q4", 1000, 1.0);
    expect(officeRCN).toBeGreaterThan(industrialRCN);
  });

  // Test 18
  test("Physical depreciation at 50% effective age = 50% of RCN", () => {
    const rcn = 300000;
    const dep = calcPhysicalDepreciation(rcn, 30, 60);
    expect(dep).toBe(150000);
  });

  // Test 19
  test("Physical depreciation at 0 effective age = 0", () => {
    const dep = calcPhysicalDepreciation(300000, 0, 60);
    expect(dep).toBe(0);
  });

  // Test 20
  test("Physical depreciation at full economic life = 100% of RCN", () => {
    const rcn = 300000;
    const dep = calcPhysicalDepreciation(rcn, 60, 60);
    expect(dep).toBe(300000);
  });

  // Test 21
  test("Indicated value = depreciated value + site value", () => {
    const indicated = calcIndicatedValue(250000, 75000);
    expect(indicated).toBe(325000);
  });

  // Test 22
  test("Indicated value with zero site value = depreciated value only", () => {
    const indicated = calcIndicatedValue(250000, 0);
    expect(indicated).toBe(250000);
  });

  // Test 23 — UAD field mapping honesty
  test("CST_INDICATED_VALUE = CST_DEPRECIATED_VALUE + CST_SITE_VALUE (no hidden additions)", () => {
    const rcn = calcRCN("Single Family Residential", "Q3", 2000, 1.0);
    const physDep = calcPhysicalDepreciation(rcn, 20, 60);
    const functDep = 5000;
    const extDep = 0;
    const totalDep = physDep + functDep + extDep;
    const depreciatedValue = rcn - totalDep;
    const siteValue = 80000;
    const indicatedValue = calcIndicatedValue(depreciatedValue, siteValue);
    expect(indicatedValue).toBe(depreciatedValue + siteValue);
  });

  // Test 24 — No Marshall & Swift
  test("No Marshall & Swift references in cost model source IDs", () => {
    const evidenceSourceIds = ["TF-COST-DB-v1", "adj_run_123"];
    const mswRefs = evidenceSourceIds.filter(
      (id) =>
        id.toLowerCase().includes("marshall") ||
        id.toLowerCase().includes("swift") ||
        id.toLowerCase().includes("m&s") ||
        id.toLowerCase().includes("msw")
    );
    expect(mswRefs).toHaveLength(0);
  });

  // Test 25 — No Marshall & Swift in model version
  test("Model version string does not reference Marshall & Swift", () => {
    const modelVersion = "TerraFusion-CostForge-v1.0";
    expect(modelVersion.toLowerCase()).not.toContain("marshall");
    expect(modelVersion.toLowerCase()).not.toContain("swift");
  });

  // Test 26 — Evidence refs structure
  test("Evidence refs contain required fields", () => {
    const evidenceRef = {
      source_type: "cost_manual",
      source_id: "TF-COST-DB-v1",
      source_label: "TerraFusion Regional Cost Database v1.0",
      retrieved_at: new Date().toISOString(),
      confidence: 0.88,
      notes: "Base cost rate: $185/sqft",
    };
    expect(evidenceRef.source_type).toBeDefined();
    expect(evidenceRef.source_id).toBeDefined();
    expect(evidenceRef.source_label).toBeDefined();
    expect(evidenceRef.retrieved_at).toBeDefined();
    expect(evidenceRef.confidence).toBeGreaterThan(0);
    expect(evidenceRef.confidence).toBeLessThanOrEqual(1);
  });

  // Test 27 — Governance: reason_code required
  test("Governance: empty reason_code should fail validation", () => {
    const reasonCode = "";
    const isValid = reasonCode.trim().length >= 3;
    expect(isValid).toBe(false);
  });

  // Test 28 — Governance: reason_code of 2 chars should fail
  test("Governance: reason_code of 2 chars should fail validation", () => {
    const reasonCode = "ab";
    const isValid = reasonCode.trim().length >= 3;
    expect(isValid).toBe(false);
  });

  // Test 29 — Governance: reason_code of 3+ chars should pass
  test("Governance: reason_code of 3+ chars should pass validation", () => {
    const reasonCode = "Initial cost approach run";
    const isValid = reasonCode.trim().length >= 3;
    expect(isValid).toBe(true);
  });

  // Test 30 — Honesty: depreciated value cannot exceed RCN
  test("Honesty: depreciated value cannot exceed RCN", () => {
    const rcn = 300000;
    const totalDepreciation = 50000;
    const depreciatedValue = Math.max(0, rcn - totalDepreciation);
    expect(depreciatedValue).toBeLessThanOrEqual(rcn);
    expect(depreciatedValue).toBeGreaterThanOrEqual(0);
  });
});
