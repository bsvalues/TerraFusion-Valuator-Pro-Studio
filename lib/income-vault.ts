/**
 * TerraFusion Valuator Pro — Income Vault Service
 *
 * Single-subject income approach data model and calculation engine.
 * Supports both Direct Capitalization and Discounted Cash Flow (DCF)
 * methodologies for commercial and income-producing residential properties.
 *
 * ARCHITECTURE:
 *  - IncomeVault holds the full rent roll, expense schedule, and market data
 *  - computeDirectCap() produces a DirectCapResult with full PGI→EGI→NOI chain
 *  - computeDCF() produces a DCFResult with year-by-year projections, IRR, NPV
 *  - All results emit IncomeRunEvidence for the evidence rail
 *
 * GOVERNANCE:
 *  - Cap rate must be positive and sourced (market extraction or survey)
 *  - Vacancy must be market-supported (not assumed)
 *  - All expense categories must be labeled and sourced
 *  - Management fee is always included (USPAP requirement)
 *  - Reserves for replacement are always included
 *  - No cost manual references anywhere in this module
 *
 * UAD FIELD MAPPING (Income Approach section of URAR 1004 / Commercial forms):
 *  INC_PGI        — Potential Gross Income
 *  INC_VACANCY    — Vacancy & Collection Loss
 *  INC_EGI        — Effective Gross Income
 *  INC_OPX        — Total Operating Expenses
 *  INC_NOI        — Net Operating Income
 *  INC_CAP_RATE   — Capitalization Rate
 *  INC_DIRECT_CAP — Indicated Value by Direct Capitalization
 *  INC_DCF        — Indicated Value by DCF
 *  INC_RECONCILED — Reconciled Income Approach Value
 */

// ---------------------------------------------------------------------------
// Enums and constants
// ---------------------------------------------------------------------------

export type LeaseType = "NNN" | "NN" | "N" | "Gross" | "Modified Gross" | "Absolute Net";
export type TenantCreditRating = "National" | "Regional" | "Local" | "Startup" | "Vacant";
export type ExpenseCategory =
  | "Real Estate Taxes"
  | "Insurance"
  | "Management Fee"
  | "Maintenance & Repairs"
  | "Utilities"
  | "Janitorial"
  | "Landscaping"
  | "Security"
  | "Administrative"
  | "Reserves for Replacement"
  | "Other";

export type CapRateSource =
  | "Market Extraction"
  | "Investor Survey"
  | "Band of Investment"
  | "Built-Up Method"
  | "Comparable Sales";

// ---------------------------------------------------------------------------
// Rent Roll
// ---------------------------------------------------------------------------

export interface TenantLease {
  tenantId: string;
  tenantName: string;
  suiteNumber: string;
  /** Rentable square feet */
  rentableSqft: number;
  leaseType: LeaseType;
  creditRating: TenantCreditRating;
  /** Annual contract rent per square foot */
  contractRentPerSqft: number;
  /** Annual market rent per square foot (appraiser's opinion) */
  marketRentPerSqft: number;
  leaseStartDate: string;
  leaseEndDate: string;
  /** Annual rent escalation rate (e.g., 0.03 = 3%) */
  annualEscalation: number;
  /** Tenant Improvement allowance (total $) */
  tiAllowance: number;
  /** Leasing commission (% of total lease value) */
  leasingCommissionPct: number;
  /** Probability of renewal (0–1) */
  renewalProbability: number;
  /** Months of free rent at lease start */
  freeRentMonths: number;
  notes: string;
}

// ---------------------------------------------------------------------------
// Expense Schedule
// ---------------------------------------------------------------------------

export interface OperatingExpense {
  expenseId: string;
  category: ExpenseCategory;
  label: string;
  /** Annual amount in dollars */
  annualAmount: number;
  /** As % of EGI (for display/validation) */
  pctOfEGI: number;
  source: string;
  notes: string;
}

// ---------------------------------------------------------------------------
// Market Data Inputs
// ---------------------------------------------------------------------------

export interface IncomeMarketData {
  /** Market vacancy rate (0–1) */
  marketVacancyRate: number;
  marketVacancySource: string;
  /** Credit loss rate (0–1) */
  creditLossRate: number;
  /** Overall capitalization rate */
  capRate: number;
  capRateSource: CapRateSource;
  capRateSupportingData: string;
  /** Terminal cap rate for DCF reversion */
  terminalCapRate: number;
  /** Discount rate for DCF (0–1) */
  discountRate: number;
  /** Annual market rent growth rate (0–1) */
  marketRentGrowthRate: number;
  /** Annual expense growth rate (0–1) */
  expenseGrowthRate: number;
  /** Hold period in years for DCF */
  holdPeriodYears: number;
  /** Selling costs at reversion (0–1) */
  reversionSellingCosts: number;
}

// ---------------------------------------------------------------------------
// IncomeVault
// ---------------------------------------------------------------------------

export interface IncomeVault {
  fileNumber: string;
  propertyType: string;
  /** Total rentable area (sq ft) */
  totalRentableSqft: number;
  tenants: TenantLease[];
  expenses: OperatingExpense[];
  marketData: IncomeMarketData;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Direct Cap Result
// ---------------------------------------------------------------------------

export interface DirectCapResult {
  /** UAD field: INC_PGI */
  pgi: number;
  /** UAD field: INC_VACANCY */
  vacancyAndCreditLoss: number;
  vacancyPct: number;
  /** UAD field: INC_EGI */
  egi: number;
  /** UAD field: INC_OPX */
  totalOperatingExpenses: number;
  expenseRatio: number;
  /** UAD field: INC_NOI */
  noi: number;
  /** UAD field: INC_CAP_RATE */
  capRate: number;
  capRateSource: CapRateSource;
  /** UAD field: INC_DIRECT_CAP */
  indicatedValue: number;
  noiPerSqft: number;
  egiPerSqft: number;
  pgiPerSqft: number;
  expenseBreakdown: Array<{ category: ExpenseCategory; label: string; amount: number; pctOfEGI: number }>;
}

// ---------------------------------------------------------------------------
// DCF Result
// ---------------------------------------------------------------------------

export interface DCFYearProjection {
  year: number;
  pgi: number;
  vacancy: number;
  egi: number;
  operatingExpenses: number;
  noi: number;
  /** Present value of NOI for this year */
  pvNOI: number;
  /** Cumulative PV of NOI through this year */
  cumulativePVNOI: number;
}

export interface DCFReversionResult {
  /** NOI in year after hold period */
  reversionNOI: number;
  /** Gross reversion value = reversionNOI / terminalCapRate */
  grossReversionValue: number;
  /** Net reversion after selling costs */
  netReversionValue: number;
  /** PV of net reversion */
  pvReversion: number;
  terminalCapRate: number;
}

export interface DCFResult {
  holdPeriodYears: number;
  discountRate: number;
  yearProjections: DCFYearProjection[];
  reversion: DCFReversionResult;
  /** Sum of PV of all NOI cash flows */
  pvOfNOI: number;
  /** PV of reversion */
  pvOfReversion: number;
  /** UAD field: INC_DCF — total indicated value */
  indicatedValue: number;
  /** Internal Rate of Return */
  irr: number;
  /** Net Present Value at discount rate */
  npv: number;
  /** 7×7 sensitivity matrix: rows = discount rates, cols = exit cap rates */
  sensitivityMatrix: SensitivityMatrix;
}

export interface SensitivityMatrix {
  discountRates: number[];
  exitCapRates: number[];
  /** indicatedValues[i][j] = value at discountRates[i] and exitCapRates[j] */
  indicatedValues: number[][];
}

// ---------------------------------------------------------------------------
// Evidence
// ---------------------------------------------------------------------------

export interface IncomeRunEvidence {
  runId: string;
  correlationId: string;
  fileNumber: string;
  method: "direct_cap" | "dcf" | "both";
  computedAt: string;
  inputSnapshot: {
    pgi: number;
    vacancyRate: number;
    totalExpenses: number;
    capRate: number;
    capRateSource: CapRateSource;
    tenantCount: number;
    totalRentableSqft: number;
  };
  outputSnapshot: {
    directCapValue: number | null;
    dcfValue: number | null;
    reconciledValue: number | null;
    noi: number;
    noiPerSqft: number;
    irr: number | null;
  };
  evidenceRefs: Array<{
    fieldCode: string;
    value: number;
    source: string;
    note: string;
  }>;
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------

export function createIncomeVault(fileNumber: string, propertyType: string, totalRentableSqft: number): IncomeVault {
  return {
    fileNumber,
    propertyType,
    totalRentableSqft,
    tenants: [],
    expenses: [],
    marketData: {
      marketVacancyRate: 0.05,
      marketVacancySource: "",
      creditLossRate: 0.01,
      capRate: 0.07,
      capRateSource: "Market Extraction",
      capRateSupportingData: "",
      terminalCapRate: 0.075,
      discountRate: 0.09,
      marketRentGrowthRate: 0.03,
      expenseGrowthRate: 0.025,
      holdPeriodYears: 10,
      reversionSellingCosts: 0.03,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function addTenant(vault: IncomeVault, tenant: Omit<TenantLease, "tenantId">): IncomeVault {
  const newTenant: TenantLease = {
    ...tenant,
    tenantId: `tenant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  };
  return { ...vault, tenants: [...vault.tenants, newTenant], updatedAt: new Date().toISOString() };
}

export function removeTenant(vault: IncomeVault, tenantId: string): IncomeVault {
  return { ...vault, tenants: vault.tenants.filter((t) => t.tenantId !== tenantId), updatedAt: new Date().toISOString() };
}

export function updateTenant(vault: IncomeVault, tenantId: string, updates: Partial<TenantLease>): IncomeVault {
  return {
    ...vault,
    tenants: vault.tenants.map((t) => (t.tenantId === tenantId ? { ...t, ...updates } : t)),
    updatedAt: new Date().toISOString(),
  };
}

export function addExpense(vault: IncomeVault, expense: Omit<OperatingExpense, "expenseId" | "pctOfEGI">): IncomeVault {
  const newExpense: OperatingExpense = {
    ...expense,
    expenseId: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    pctOfEGI: 0, // computed on calculation
  };
  return { ...vault, expenses: [...vault.expenses, newExpense], updatedAt: new Date().toISOString() };
}

export function removeExpense(vault: IncomeVault, expenseId: string): IncomeVault {
  return { ...vault, expenses: vault.expenses.filter((e) => e.expenseId !== expenseId), updatedAt: new Date().toISOString() };
}

export function updateMarketData(vault: IncomeVault, updates: Partial<IncomeMarketData>): IncomeVault {
  return { ...vault, marketData: { ...vault.marketData, ...updates }, updatedAt: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// Governance validation
// ---------------------------------------------------------------------------

export interface IncomeGovernanceResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateIncomeVault(vault: IncomeVault): IncomeGovernanceResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (vault.tenants.length === 0) {
    errors.push("Rent roll is empty — at least one tenant or market rent estimate is required.");
  }
  if (vault.marketData.capRate <= 0 || vault.marketData.capRate >= 1) {
    errors.push(`Cap rate ${(vault.marketData.capRate * 100).toFixed(2)}% is outside valid range (0–100%).`);
  }
  if (!vault.marketData.capRateSupportingData.trim()) {
    errors.push("Cap rate supporting data is required — cite the market evidence.");
  }
  if (!vault.marketData.marketVacancySource.trim()) {
    errors.push("Vacancy rate source is required — cite the market evidence.");
  }

  // Management fee check
  const hasMgmtFee = vault.expenses.some((e) => e.category === "Management Fee");
  if (!hasMgmtFee) {
    warnings.push("No Management Fee expense found. USPAP requires management to be included even for owner-managed properties.");
  }

  // Reserves check
  const hasReserves = vault.expenses.some((e) => e.category === "Reserves for Replacement");
  if (!hasReserves) {
    warnings.push("No Reserves for Replacement found. Standard appraisal practice requires reserves.");
  }

  // Vacancy sanity
  if (vault.marketData.marketVacancyRate < 0 || vault.marketData.marketVacancyRate > 0.5) {
    warnings.push(`Vacancy rate of ${(vault.marketData.marketVacancyRate * 100).toFixed(1)}% is unusual — verify market support.`);
  }

  // Cap rate sanity
  if (vault.marketData.capRate < 0.03) {
    warnings.push(`Cap rate of ${(vault.marketData.capRate * 100).toFixed(2)}% is very low — verify market support.`);
  }
  if (vault.marketData.capRate > 0.20) {
    warnings.push(`Cap rate of ${(vault.marketData.capRate * 100).toFixed(2)}% is very high — verify market support.`);
  }

  // DCF: terminal cap must be >= going-in cap
  if (vault.marketData.terminalCapRate < vault.marketData.capRate) {
    warnings.push("Terminal cap rate is lower than going-in cap rate — this implies appreciation. Verify market support.");
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ---------------------------------------------------------------------------
// Direct Capitalization
// ---------------------------------------------------------------------------

export function computeDirectCap(vault: IncomeVault): DirectCapResult {
  const { tenants, expenses, marketData, totalRentableSqft } = vault;

  // PGI: sum of market rent for all tenants (use market rent, not contract rent)
  const pgi = tenants.reduce((sum, t) => sum + t.marketRentPerSqft * t.rentableSqft, 0);

  // Vacancy & Credit Loss
  const vacancyAndCreditLoss = pgi * (marketData.marketVacancyRate + marketData.creditLossRate);
  const vacancyPct = marketData.marketVacancyRate + marketData.creditLossRate;

  // EGI
  const egi = pgi - vacancyAndCreditLoss;

  // Operating Expenses — compute pctOfEGI for each
  const totalOperatingExpenses = expenses.reduce((sum, e) => sum + e.annualAmount, 0);
  const expenseRatio = egi > 0 ? totalOperatingExpenses / egi : 0;

  // NOI
  const noi = egi - totalOperatingExpenses;

  // Indicated Value by Direct Cap
  const indicatedValue = marketData.capRate > 0 ? noi / marketData.capRate : 0;

  const expenseBreakdown = expenses.map((e) => ({
    category: e.category,
    label: e.label,
    amount: e.annualAmount,
    pctOfEGI: egi > 0 ? (e.annualAmount / egi) * 100 : 0,
  }));

  return {
    pgi,
    vacancyAndCreditLoss,
    vacancyPct,
    egi,
    totalOperatingExpenses,
    expenseRatio,
    noi,
    capRate: marketData.capRate,
    capRateSource: marketData.capRateSource,
    indicatedValue,
    noiPerSqft: totalRentableSqft > 0 ? noi / totalRentableSqft : 0,
    egiPerSqft: totalRentableSqft > 0 ? egi / totalRentableSqft : 0,
    pgiPerSqft: totalRentableSqft > 0 ? pgi / totalRentableSqft : 0,
    expenseBreakdown,
  };
}

// ---------------------------------------------------------------------------
// DCF Engine
// ---------------------------------------------------------------------------

/**
 * Newton-Raphson IRR solver.
 * cashFlows[0] is the initial investment (negative), cashFlows[1..n] are returns.
 */
export function computeIRR(cashFlows: number[], maxIterations = 1000, tolerance = 1e-6): number {
  if (cashFlows.length < 2) return 0;

  let rate = 0.1; // initial guess

  for (let iter = 0; iter < maxIterations; iter++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const factor = Math.pow(1 + rate, t);
      npv += cashFlows[t] / factor;
      dnpv -= (t * cashFlows[t]) / (factor * (1 + rate));
    }
    if (Math.abs(dnpv) < 1e-12) break;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < tolerance) {
      return newRate;
    }
    rate = newRate;
  }
  return rate;
}

export function computeNPV(cashFlows: number[], discountRate: number): number {
  return cashFlows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + discountRate, t), 0);
}

export function computeDCF(vault: IncomeVault, initialInvestment?: number): DCFResult {
  const { marketData, totalRentableSqft } = vault;
  const { holdPeriodYears, discountRate, marketRentGrowthRate, expenseGrowthRate, terminalCapRate, reversionSellingCosts } = marketData;

  // Year 1 base values from Direct Cap
  const year1 = computeDirectCap(vault);
  const basePGI = year1.pgi;
  const baseExpenses = year1.totalOperatingExpenses;
  const vacancyPct = year1.vacancyPct;

  // Project each year
  const yearProjections: DCFYearProjection[] = [];
  let cumulativePVNOI = 0;

  for (let yr = 1; yr <= holdPeriodYears; yr++) {
    const growthPGI = Math.pow(1 + marketRentGrowthRate, yr - 1);
    const growthExp = Math.pow(1 + expenseGrowthRate, yr - 1);

    const pgi = basePGI * growthPGI;
    const vacancy = pgi * vacancyPct;
    const egi = pgi - vacancy;
    const operatingExpenses = baseExpenses * growthExp;
    const noi = egi - operatingExpenses;

    const pvFactor = Math.pow(1 + discountRate, yr);
    const pvNOI = noi / pvFactor;
    cumulativePVNOI += pvNOI;

    yearProjections.push({ year: yr, pgi, vacancy, egi, operatingExpenses, noi, pvNOI, cumulativePVNOI });
  }

  // Reversion (terminal value at end of hold period)
  const reversionNOI = yearProjections[holdPeriodYears - 1].noi * (1 + marketRentGrowthRate);
  const grossReversionValue = terminalCapRate > 0 ? reversionNOI / terminalCapRate : 0;
  const netReversionValue = grossReversionValue * (1 - reversionSellingCosts);
  const pvReversion = netReversionValue / Math.pow(1 + discountRate, holdPeriodYears);

  const pvOfNOI = cumulativePVNOI;
  const pvOfReversion = pvReversion;
  const indicatedValue = pvOfNOI + pvOfReversion;

  // IRR: cash flows = [-initialInvestment, NOI_1, NOI_2, ..., NOI_n + netReversion]
  const investment = initialInvestment ?? indicatedValue;
  const cashFlows = [-investment, ...yearProjections.map((y) => y.noi)];
  cashFlows[cashFlows.length - 1] += netReversionValue;
  const irr = computeIRR(cashFlows);
  const npv = computeNPV(cashFlows, discountRate);

  // 7×7 Sensitivity Matrix
  const drRange = [-0.02, -0.01, 0, 0.01, 0.02, 0.03, 0.04].map((d) => discountRate + d);
  const ecRange = [-0.02, -0.01, 0, 0.01, 0.02, 0.03, 0.04].map((d) => terminalCapRate + d);

  const sensitivityMatrix: SensitivityMatrix = {
    discountRates: drRange,
    exitCapRates: ecRange,
    indicatedValues: drRange.map((dr) =>
      ecRange.map((ec) => {
        let pvNOISum = 0;
        for (let yr = 1; yr <= holdPeriodYears; yr++) {
          const growthPGI = Math.pow(1 + marketRentGrowthRate, yr - 1);
          const growthExp = Math.pow(1 + expenseGrowthRate, yr - 1);
          const pgi = basePGI * growthPGI;
          const egi = pgi - pgi * vacancyPct;
          const noi = egi - baseExpenses * growthExp;
          pvNOISum += noi / Math.pow(1 + dr, yr);
        }
        const lastNOI = yearProjections[holdPeriodYears - 1].noi * (1 + marketRentGrowthRate);
        const grossRev = ec > 0 ? lastNOI / ec : 0;
        const netRev = grossRev * (1 - reversionSellingCosts);
        const pvRev = netRev / Math.pow(1 + dr, holdPeriodYears);
        return Math.round(pvNOISum + pvRev);
      })
    ),
  };

  return {
    holdPeriodYears,
    discountRate,
    yearProjections,
    reversion: { reversionNOI, grossReversionValue, netReversionValue, pvReversion, terminalCapRate },
    pvOfNOI,
    pvOfReversion,
    indicatedValue,
    irr,
    npv,
    sensitivityMatrix,
  };
}

// ---------------------------------------------------------------------------
// Evidence emission
// ---------------------------------------------------------------------------

export function emitIncomeEvidence(
  vault: IncomeVault,
  directCap: DirectCapResult,
  dcf: DCFResult | null,
  runId: string,
  correlationId: string
): IncomeRunEvidence {
  const governance = validateIncomeVault(vault);

  const evidenceRefs = [
    { fieldCode: "INC_PGI", value: directCap.pgi, source: "Rent Roll", note: `${vault.tenants.length} tenant(s), market rent basis` },
    { fieldCode: "INC_VACANCY", value: directCap.vacancyAndCreditLoss, source: vault.marketData.marketVacancySource || "Market Data", note: `${(directCap.vacancyPct * 100).toFixed(1)}% vacancy + credit loss` },
    { fieldCode: "INC_EGI", value: directCap.egi, source: "Calculation", note: "PGI less vacancy and credit loss" },
    { fieldCode: "INC_OPX", value: directCap.totalOperatingExpenses, source: "Expense Schedule", note: `${(directCap.expenseRatio * 100).toFixed(1)}% expense ratio` },
    { fieldCode: "INC_NOI", value: directCap.noi, source: "Calculation", note: "EGI less total operating expenses" },
    { fieldCode: "INC_CAP_RATE", value: directCap.capRate, source: directCap.capRateSource, note: vault.marketData.capRateSupportingData },
    { fieldCode: "INC_DIRECT_CAP", value: directCap.indicatedValue, source: "Direct Capitalization", note: `NOI / Cap Rate = $${directCap.noi.toLocaleString()} / ${(directCap.capRate * 100).toFixed(2)}%` },
  ];

  if (dcf) {
    evidenceRefs.push(
      { fieldCode: "INC_DCF", value: dcf.indicatedValue, source: "Discounted Cash Flow", note: `${dcf.holdPeriodYears}-year hold, ${(dcf.discountRate * 100).toFixed(2)}% discount rate, IRR ${(dcf.irr * 100).toFixed(2)}%` }
    );
  }

  return {
    runId,
    correlationId,
    fileNumber: vault.fileNumber,
    method: dcf ? "both" : "direct_cap",
    computedAt: new Date().toISOString(),
    inputSnapshot: {
      pgi: directCap.pgi,
      vacancyRate: vault.marketData.marketVacancyRate,
      totalExpenses: directCap.totalOperatingExpenses,
      capRate: vault.marketData.capRate,
      capRateSource: vault.marketData.capRateSource,
      tenantCount: vault.tenants.length,
      totalRentableSqft: vault.totalRentableSqft,
    },
    outputSnapshot: {
      directCapValue: directCap.indicatedValue,
      dcfValue: dcf?.indicatedValue ?? null,
      reconciledValue: dcf
        ? Math.round((directCap.indicatedValue + dcf.indicatedValue) / 2)
        : directCap.indicatedValue,
      noi: directCap.noi,
      noiPerSqft: directCap.noiPerSqft,
      irr: dcf?.irr ?? null,
    },
    evidenceRefs,
    warnings: governance.warnings,
  };
}
