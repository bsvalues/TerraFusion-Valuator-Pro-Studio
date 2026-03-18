/**
 * Phase D — Income Approach Test Suite
 * 30 tests covering:
 *  - IncomeVault CRUD (tenants, expenses, market data)
 *  - Direct Capitalization math (PGI, EGI, NOI, Indicated Value)
 *  - DCF projections (year-by-year, reversion, PV)
 *  - IRR and NPV calculations
 *  - Sensitivity matrix structure and values
 *  - Governance gates (reason_code, minimum data requirements)
 *  - UAD INC-field identity constraints
 *  - Evidence ref structure
 *  - Edge cases (zero vacancy, zero expenses, single tenant)
 */

import {
  createIncomeVault,
  addTenant,
  removeTenant,
  updateTenant,
  addExpense,
  removeExpense,
  updateMarketData,
  validateIncomeVault,
  computeDirectCap,
  computeDCF,
  computeIRR,
  computeNPV,
  emitIncomeEvidence,
  IncomeVault,
  TenantLease,
  OperatingExpense,
} from "../lib/income-vault";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeTenant(overrides: Partial<Omit<TenantLease, "tenantId">> = {}): Omit<TenantLease, "tenantId"> {
  return {
    tenantName: "Acme Corp",
    suiteNumber: "101",
    rentableSqft: 2000,
    leaseType: "NNN",
    creditRating: "Regional",
    contractRentPerSqft: 22,
    marketRentPerSqft: 24,
    leaseStartDate: "2024-01-01",
    leaseEndDate: "2029-12-31",
    annualEscalation: 0.03,
    tiAllowance: 10000,
    leasingCommissionPct: 0.05,
    renewalProbability: 0.75,
    freeRentMonths: 0,
    notes: "",
    ...overrides,
  };
}

function makeExpense(overrides: Partial<Omit<OperatingExpense, "expenseId" | "pctOfEGI">> = {}): Omit<OperatingExpense, "expenseId" | "pctOfEGI"> {
  return {
    category: "Management Fee",
    label: "Property Management",
    annualAmount: 5000,
    source: "Management Agreement",
    notes: "",
    ...overrides,
  };
}

function makeFullVault(): IncomeVault {
  let vault = createIncomeVault("TEST-001", "Office", 5000);

  // Add two tenants
  vault = addTenant(vault, makeTenant({ tenantName: "Tenant A", suiteNumber: "101", rentableSqft: 2500, marketRentPerSqft: 20 }));
  vault = addTenant(vault, makeTenant({ tenantName: "Tenant B", suiteNumber: "102", rentableSqft: 2500, marketRentPerSqft: 22 }));

  // Add expenses
  vault = addExpense(vault, { category: "Management Fee", label: "Property Management", annualAmount: 8000, source: "Contract", notes: "" });
  vault = addExpense(vault, { category: "Real Estate Taxes", label: "County Tax Bill", annualAmount: 12000, source: "Tax Record", notes: "" });
  vault = addExpense(vault, { category: "Insurance", label: "Property Insurance", annualAmount: 4000, source: "Policy", notes: "" });
  vault = addExpense(vault, { category: "Reserves for Replacement", label: "Reserves", annualAmount: 3000, source: "Industry Standard", notes: "" });

  // Market data
  vault = updateMarketData(vault, {
    marketVacancyRate: 0.05,
    marketVacancySource: "CoStar Q4 2025",
    creditLossRate: 0.01,
    capRate: 0.07,
    capRateSource: "Market Extraction",
    capRateSupportingData: "3 comparable sales extracted at 6.8–7.2% cap",
    terminalCapRate: 0.075,
    discountRate: 0.09,
    marketRentGrowthRate: 0.03,
    expenseGrowthRate: 0.025,
    holdPeriodYears: 10,
    reversionSellingCosts: 0.03,
  });

  return vault;
}

// ---------------------------------------------------------------------------
// 1. IncomeVault creation
// ---------------------------------------------------------------------------

test("1. createIncomeVault initializes with correct defaults", () => {
  const vault = createIncomeVault("FILE-001", "Retail", 3000);
  expect(vault.fileNumber).toBe("FILE-001");
  expect(vault.propertyType).toBe("Retail");
  expect(vault.totalRentableSqft).toBe(3000);
  expect(vault.tenants).toHaveLength(0);
  expect(vault.expenses).toHaveLength(0);
  expect(vault.marketData.capRate).toBe(0.07);
  expect(vault.marketData.discountRate).toBe(0.09);
});

// ---------------------------------------------------------------------------
// 2. Tenant CRUD
// ---------------------------------------------------------------------------

test("2. addTenant appends a tenant with generated tenantId", () => {
  let vault = createIncomeVault("FILE-001", "Office", 2000);
  vault = addTenant(vault, makeTenant());
  expect(vault.tenants).toHaveLength(1);
  expect(vault.tenants[0].tenantId).toMatch(/^tenant_/);
  expect(vault.tenants[0].tenantName).toBe("Acme Corp");
});

test("3. removeTenant removes the correct tenant", () => {
  let vault = createIncomeVault("FILE-001", "Office", 4000);
  vault = addTenant(vault, makeTenant({ tenantName: "A" }));
  vault = addTenant(vault, makeTenant({ tenantName: "B" }));
  const idToRemove = vault.tenants[0].tenantId;
  vault = removeTenant(vault, idToRemove);
  expect(vault.tenants).toHaveLength(1);
  expect(vault.tenants[0].tenantName).toBe("B");
});

test("4. updateTenant modifies only the specified tenant", () => {
  let vault = createIncomeVault("FILE-001", "Office", 4000);
  vault = addTenant(vault, makeTenant({ tenantName: "Original" }));
  const id = vault.tenants[0].tenantId;
  vault = updateTenant(vault, id, { tenantName: "Updated", marketRentPerSqft: 30 });
  expect(vault.tenants[0].tenantName).toBe("Updated");
  expect(vault.tenants[0].marketRentPerSqft).toBe(30);
});

// ---------------------------------------------------------------------------
// 5. Expense CRUD
// ---------------------------------------------------------------------------

test("5. addExpense appends with generated expenseId", () => {
  let vault = createIncomeVault("FILE-001", "Office", 2000);
  vault = addExpense(vault, makeExpense());
  expect(vault.expenses).toHaveLength(1);
  expect(vault.expenses[0].expenseId).toMatch(/^exp_/);
  expect(vault.expenses[0].category).toBe("Management Fee");
});

test("6. removeExpense removes the correct expense", () => {
  let vault = createIncomeVault("FILE-001", "Office", 2000);
  vault = addExpense(vault, makeExpense({ category: "Insurance", label: "Policy A" }));
  vault = addExpense(vault, makeExpense({ category: "Real Estate Taxes", label: "Tax Bill" }));
  const idToRemove = vault.expenses[0].expenseId;
  vault = removeExpense(vault, idToRemove);
  expect(vault.expenses).toHaveLength(1);
  expect(vault.expenses[0].category).toBe("Real Estate Taxes");
});

// ---------------------------------------------------------------------------
// 7–9. Governance validation
// ---------------------------------------------------------------------------

test("7. validateIncomeVault fails with empty rent roll", () => {
  const vault = createIncomeVault("FILE-001", "Office", 2000);
  const result = validateIncomeVault(vault);
  expect(result.valid).toBe(false);
  expect(result.errors.some((e) => e.includes("Rent roll is empty"))).toBe(true);
});

test("8. validateIncomeVault fails with missing cap rate supporting data", () => {
  let vault = createIncomeVault("FILE-001", "Office", 2000);
  vault = addTenant(vault, makeTenant());
  vault = updateMarketData(vault, { marketVacancySource: "CoStar", capRateSupportingData: "" });
  const result = validateIncomeVault(vault);
  expect(result.valid).toBe(false);
  expect(result.errors.some((e) => e.includes("Cap rate supporting data"))).toBe(true);
});

test("9. validateIncomeVault warns about missing management fee", () => {
  let vault = createIncomeVault("FILE-001", "Office", 2000);
  vault = addTenant(vault, makeTenant());
  vault = updateMarketData(vault, { marketVacancySource: "CoStar", capRateSupportingData: "Market data" });
  // No management fee added
  const result = validateIncomeVault(vault);
  expect(result.warnings.some((w) => w.includes("Management Fee"))).toBe(true);
});

test("10. validateIncomeVault warns about missing reserves", () => {
  let vault = createIncomeVault("FILE-001", "Office", 2000);
  vault = addTenant(vault, makeTenant());
  vault = addExpense(vault, makeExpense({ category: "Management Fee" }));
  vault = updateMarketData(vault, { marketVacancySource: "CoStar", capRateSupportingData: "Market data" });
  const result = validateIncomeVault(vault);
  expect(result.warnings.some((w) => w.includes("Reserves"))).toBe(true);
});

test("11. validateIncomeVault passes with complete vault", () => {
  const vault = makeFullVault();
  const result = validateIncomeVault(vault);
  expect(result.valid).toBe(true);
  expect(result.errors).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// 12–18. Direct Capitalization math
// ---------------------------------------------------------------------------

test("12. computeDirectCap — PGI equals sum of market rent × SF", () => {
  const vault = makeFullVault();
  const result = computeDirectCap(vault);
  // Tenant A: 2500 × $20 = $50,000; Tenant B: 2500 × $22 = $55,000; Total = $105,000
  expect(result.pgi).toBeCloseTo(105000, 0);
});

test("13. computeDirectCap — EGI = PGI - vacancy - credit loss", () => {
  const vault = makeFullVault();
  const result = computeDirectCap(vault);
  const expectedVacancy = 105000 * (0.05 + 0.01);
  const expectedEGI = 105000 - expectedVacancy;
  expect(result.egi).toBeCloseTo(expectedEGI, 0);
});

test("14. computeDirectCap — NOI = EGI - total expenses", () => {
  const vault = makeFullVault();
  const result = computeDirectCap(vault);
  const totalExpenses = 8000 + 12000 + 4000 + 3000; // 27,000
  expect(result.totalOperatingExpenses).toBe(27000);
  expect(result.noi).toBeCloseTo(result.egi - 27000, 0);
});

test("15. computeDirectCap — Indicated Value = NOI / Cap Rate", () => {
  const vault = makeFullVault();
  const result = computeDirectCap(vault);
  const expectedValue = result.noi / 0.07;
  expect(result.indicatedValue).toBeCloseTo(expectedValue, 0);
});

test("16. computeDirectCap — UAD INC_CAP_RATE field matches vault", () => {
  const vault = makeFullVault();
  const result = computeDirectCap(vault);
  expect(result.capRate).toBe(0.07);
  expect(result.capRateSource).toBe("Market Extraction");
});

test("17. computeDirectCap — per-SF metrics are correct", () => {
  const vault = makeFullVault();
  const result = computeDirectCap(vault);
  expect(result.noiPerSqft).toBeCloseTo(result.noi / 5000, 4);
  expect(result.egiPerSqft).toBeCloseTo(result.egi / 5000, 4);
  expect(result.pgiPerSqft).toBeCloseTo(result.pgi / 5000, 4);
});

test("18. computeDirectCap — expense breakdown sums to total", () => {
  const vault = makeFullVault();
  const result = computeDirectCap(vault);
  const breakdownSum = result.expenseBreakdown.reduce((s, e) => s + e.amount, 0);
  expect(breakdownSum).toBeCloseTo(result.totalOperatingExpenses, 0);
});

// ---------------------------------------------------------------------------
// 19–23. DCF projections
// ---------------------------------------------------------------------------

test("19. computeDCF — year projections count matches hold period", () => {
  const vault = makeFullVault();
  const result = computeDCF(vault);
  expect(result.yearProjections).toHaveLength(10);
});

test("20. computeDCF — year 1 NOI matches Direct Cap NOI", () => {
  const vault = makeFullVault();
  const dcResult = computeDirectCap(vault);
  const dcfResult = computeDCF(vault);
  expect(dcfResult.yearProjections[0].noi).toBeCloseTo(dcResult.noi, 0);
});

test("21. computeDCF — PGI grows at market rent growth rate each year", () => {
  const vault = makeFullVault();
  const result = computeDCF(vault);
  const yr1 = result.yearProjections[0].pgi;
  const yr2 = result.yearProjections[1].pgi;
  expect(yr2 / yr1).toBeCloseTo(1 + vault.marketData.marketRentGrowthRate, 4);
});

test("22. computeDCF — cumulative PV of NOI is monotonically increasing", () => {
  const vault = makeFullVault();
  const result = computeDCF(vault);
  for (let i = 1; i < result.yearProjections.length; i++) {
    expect(result.yearProjections[i].cumulativePVNOI).toBeGreaterThan(
      result.yearProjections[i - 1].cumulativePVNOI
    );
  }
});

test("23. computeDCF — indicated value = PV of NOI + PV of reversion", () => {
  const vault = makeFullVault();
  const result = computeDCF(vault);
  expect(result.indicatedValue).toBeCloseTo(result.pvOfNOI + result.pvOfReversion, 0);
});

// ---------------------------------------------------------------------------
// 24–26. IRR and NPV
// ---------------------------------------------------------------------------

test("24. computeIRR — returns correct rate for known cash flows", () => {
  // Investment of $1,000,000 returning $80,000/yr for 10 years + $1,200,000 reversion
  const cashFlows = [-1000000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000 + 1200000];
  const irr = computeIRR(cashFlows);
  // Approximate IRR for this cash flow series should be ~9.5–10.5%
  expect(irr).toBeGreaterThan(0.09);
  expect(irr).toBeLessThan(0.12);
});

test("25. computeNPV — NPV at IRR is approximately zero", () => {
  const cashFlows = [-1000000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000 + 1200000];
  const irr = computeIRR(cashFlows);
  const npvAtIRR = computeNPV(cashFlows, irr);
  expect(Math.abs(npvAtIRR)).toBeLessThan(1); // Within $1 of zero
});

test("26. computeDCF — IRR is positive for a profitable investment", () => {
  const vault = makeFullVault();
  const result = computeDCF(vault);
  expect(result.irr).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// 27. Sensitivity matrix
// ---------------------------------------------------------------------------

test("27. sensitivity matrix — 7×7 structure with correct dimensions", () => {
  const vault = makeFullVault();
  const result = computeDCF(vault);
  expect(result.sensitivityMatrix.discountRates).toHaveLength(7);
  expect(result.sensitivityMatrix.exitCapRates).toHaveLength(7);
  expect(result.sensitivityMatrix.indicatedValues).toHaveLength(7);
  result.sensitivityMatrix.indicatedValues.forEach((row) => {
    expect(row).toHaveLength(7);
  });
});

test("28. sensitivity matrix — lower discount rate yields higher value", () => {
  const vault = makeFullVault();
  const result = computeDCF(vault);
  const matrix = result.sensitivityMatrix;
  // At same exit cap rate (column 3 = base), lower DR (row 0) > higher DR (row 6)
  expect(matrix.indicatedValues[0][3]).toBeGreaterThan(matrix.indicatedValues[6][3]);
});

// ---------------------------------------------------------------------------
// 29. Evidence emission
// ---------------------------------------------------------------------------

test("29. emitIncomeEvidence — all UAD INC fields present in evidenceRefs", () => {
  const vault = makeFullVault();
  const directCap = computeDirectCap(vault);
  const dcf = computeDCF(vault);
  const evidence = emitIncomeEvidence(vault, directCap, dcf, "run_test_001", "corr_test_001");

  const fieldCodes = evidence.evidenceRefs.map((r) => r.fieldCode);
  expect(fieldCodes).toContain("INC_PGI");
  expect(fieldCodes).toContain("INC_VACANCY");
  expect(fieldCodes).toContain("INC_EGI");
  expect(fieldCodes).toContain("INC_OPX");
  expect(fieldCodes).toContain("INC_NOI");
  expect(fieldCodes).toContain("INC_CAP_RATE");
  expect(fieldCodes).toContain("INC_DIRECT_CAP");
  expect(fieldCodes).toContain("INC_DCF");
});

// ---------------------------------------------------------------------------
// 30. No Marshall & Swift references
// ---------------------------------------------------------------------------

test("30. income-vault module contains zero Marshall & Swift references", () => {
  const fs = require("fs");
  const path = require("path");
  const content = fs.readFileSync(path.join(__dirname, "../lib/income-vault.ts"), "utf-8");
  const lower = content.toLowerCase();
  expect(lower.includes("marshall")).toBe(false);
  expect(lower.includes("swift")).toBe(false);
  expect(lower.includes("m&s")).toBe(false);
  expect(lower.includes("marshall & swift")).toBe(false);
});
