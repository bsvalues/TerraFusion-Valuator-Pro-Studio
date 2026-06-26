// ============================================================================
// TerraFusion Valuator Pro Studio — Commercial Fee Appraiser Engines
// Implements the Three Approaches to Value for USPAP-compliant appraisal
// ============================================================================

import type {
  Property,
  Valuation,
  MarketData,
  RiskAssessment,
  ComparableSale,
  IncomeApproachInputs,
  IncomeApproachResult,
  CostApproachInputs,
  CostApproachResult,
  ApproachReconciliation,
  PropertyType,
  PropertyCondition,
  SaleCondition,
  FinancingType,
  SaleAdjustment,
} from "./types";

// ── Market Data Engine ────────────────────────────────────────────────────────

export const AVAILABLE_REGIONS = [
  "Downtown Core",
  "Midtown",
  "Suburbs North",
  "Suburbs South",
  "East Side",
  "West Side",
  "Rural County",
  "Urban Core",
  "Waterfront",
  "Airport Corridor",
];

const MARKET_DATA_TABLE: Record<string, Omit<MarketData, "region">> = {
  "Downtown Core":    { medianPrice: 850000, averagePricePerSqft: 425, marketTrend: "Rising",   averageDaysOnMarket: 18, listToSaleRatio: 1.02, averageCapRate: 0.055, vacancyRate: 0.06, dataAsOf: new Date().toISOString().slice(0,10) },
  "Midtown":          { medianPrice: 680000, averagePricePerSqft: 340, marketTrend: "Stable",   averageDaysOnMarket: 28, listToSaleRatio: 0.99, averageCapRate: 0.065, vacancyRate: 0.08, dataAsOf: new Date().toISOString().slice(0,10) },
  "Suburbs North":    { medianPrice: 520000, averagePricePerSqft: 260, marketTrend: "Rising",   averageDaysOnMarket: 22, listToSaleRatio: 1.01, averageCapRate: 0.07,  vacancyRate: 0.05, dataAsOf: new Date().toISOString().slice(0,10) },
  "Suburbs South":    { medianPrice: 480000, averagePricePerSqft: 240, marketTrend: "Stable",   averageDaysOnMarket: 35, listToSaleRatio: 0.98, averageCapRate: 0.072, vacancyRate: 0.07, dataAsOf: new Date().toISOString().slice(0,10) },
  "East Side":        { medianPrice: 390000, averagePricePerSqft: 195, marketTrend: "Declining",averageDaysOnMarket: 55, listToSaleRatio: 0.96, averageCapRate: 0.08,  vacancyRate: 0.12, dataAsOf: new Date().toISOString().slice(0,10) },
  "West Side":        { medianPrice: 610000, averagePricePerSqft: 305, marketTrend: "Rising",   averageDaysOnMarket: 20, listToSaleRatio: 1.03, averageCapRate: 0.062, vacancyRate: 0.05, dataAsOf: new Date().toISOString().slice(0,10) },
  "Rural County":     { medianPrice: 280000, averagePricePerSqft: 140, marketTrend: "Stable",   averageDaysOnMarket: 75, listToSaleRatio: 0.97, averageCapRate: 0.085, vacancyRate: 0.09, dataAsOf: new Date().toISOString().slice(0,10) },
  "Urban Core":       { medianPrice: 920000, averagePricePerSqft: 460, marketTrend: "Rising",   averageDaysOnMarket: 14, listToSaleRatio: 1.04, averageCapRate: 0.05,  vacancyRate: 0.04, dataAsOf: new Date().toISOString().slice(0,10) },
  "Waterfront":       { medianPrice: 1250000,averagePricePerSqft: 625, marketTrend: "Rising",   averageDaysOnMarket: 30, listToSaleRatio: 1.01, averageCapRate: 0.048, vacancyRate: 0.03, dataAsOf: new Date().toISOString().slice(0,10) },
  "Airport Corridor": { medianPrice: 420000, averagePricePerSqft: 210, marketTrend: "Stable",   averageDaysOnMarket: 45, listToSaleRatio: 0.99, averageCapRate: 0.075, vacancyRate: 0.10, dataAsOf: new Date().toISOString().slice(0,10) },
};

export function analyzeMarket(region: string): MarketData {
  const data = MARKET_DATA_TABLE[region] ?? MARKET_DATA_TABLE["Suburbs North"];
  return { region, ...data };
}

// ── Sales Comparison Approach ─────────────────────────────────────────────────

const CONDITION_ADJUSTMENT: Record<PropertyCondition, number> = {
  Excellent: 15000,
  Good: 7500,
  Average: 0,
  Fair: -10000,
  Poor: -25000,
};

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  single_family: "Single Family",
  condo: "Condominium",
  multi_family_2_4: "2-4 Family",
  multi_family_5plus: "5+ Unit Multi-Family",
  office: "Office",
  retail: "Retail",
  industrial: "Industrial",
  mixed_use: "Mixed Use",
  hospitality: "Hospitality",
  land: "Land",
  special_purpose: "Special Purpose",
};

export function getPropertyTypeLabel(type: PropertyType): string {
  return PROPERTY_TYPE_LABELS[type] ?? type;
}

export function generateComparableSales(property: Property, market: MarketData): ComparableSale[] {
  const basePrice = property.squareFeet * market.averagePricePerSqft;
  const streetNames = ["Oak Ave", "Elm St", "Pine Rd", "Maple Dr", "Cedar Ln", "Birch Way", "Walnut Ct", "Spruce Blvd", "Hickory Ln", "Magnolia Dr"];
  const conditions: PropertyCondition[] = ["Excellent", "Good", "Average", "Fair", "Poor"];
  const saleConditions: SaleCondition[] = ["Arms Length", "Arms Length", "Arms Length", "Arms Length", "Foreclosure"];
  const financingTypes: FinancingType[] = ["Conventional", "Cash", "Conventional", "Cash", "FHA"];
  const comps: ComparableSale[] = [];
  const seed = property.squareFeet + (property.bedrooms ?? 3) * 1000 + (property.bathrooms ?? 2) * 100;

  for (let i = 0; i < 5; i++) {
    const sqftVariance = Math.round((((seed * (i + 7)) % 800) - 400));
    const compSqft = Math.max(800, property.squareFeet + sqftVariance);
    const compCondition = conditions[Math.abs((seed * (i + 2)) % conditions.length)] as PropertyCondition;
    const saleCondition = saleConditions[i % saleConditions.length];
    const financingType = financingTypes[i % financingTypes.length];
    const adjustments: SaleAdjustment[] = [];
    let adjustedPrice = compSqft * market.averagePricePerSqft;

    // Market Conditions (time) adjustment — 0.3% per month
    const daysAgo = 30 + ((seed * (i + 13)) % 365);
    const monthsAgo = daysAgo / 30;
    const timeAdj = Math.round(adjustedPrice * 0.003 * monthsAgo);
    if (timeAdj !== 0) {
      adjustedPrice += timeAdj;
      adjustments.push({ category: "market_conditions", description: `Time adj. (${Math.round(monthsAgo)} months)`, dollarAmount: timeAdj });
    }

    // GLA adjustment
    const sqftDiff = compSqft - property.squareFeet;
    if (sqftDiff !== 0) {
      const adj = -Math.round(sqftDiff * market.averagePricePerSqft * 0.5);
      adjustedPrice += adj;
      adjustments.push({ category: "above_grade_area", description: `GLA ${sqftDiff > 0 ? "+" : ""}${sqftDiff} sqft`, dollarAmount: adj });
    }

    // Condition adjustment
    const condAdj = CONDITION_ADJUSTMENT[property.condition] - CONDITION_ADJUSTMENT[compCondition];
    if (condAdj !== 0) {
      adjustedPrice += condAdj;
      adjustments.push({ category: "age_condition", description: `Condition: ${compCondition} vs ${property.condition}`, dollarAmount: condAdj });
    }

    // Bedroom adjustment (residential)
    if (property.bedrooms && property.bedrooms > 0) {
      const bedVariance = ((seed * (i + 3)) % 3) - 1;
      const compBeds = Math.max(1, property.bedrooms + bedVariance);
      if (bedVariance !== 0) {
        const adj = -bedVariance * 12000;
        adjustedPrice += adj;
        adjustments.push({ category: "functional_utility", description: `Bedrooms: ${compBeds} vs ${property.bedrooms}`, dollarAmount: adj });
      }
    }

    // Financing adjustment
    if (financingType === "Seller Financed") {
      const adj = Math.round(adjustedPrice * -0.02);
      adjustedPrice += adj;
      adjustments.push({ category: "financing_terms", description: "Seller financing concession", dollarAmount: adj });
    }

    const salePrice = Math.round(compSqft * market.averagePricePerSqft * (0.9 + Math.random() * 0.2));
    const finalAdjustedPrice = Math.round(adjustedPrice);
    const totalAdjustments = adjustments.reduce((s, a) => s + a.dollarAmount, 0);
    const netAdjPct = (totalAdjustments / salePrice) * 100;
    const grossAdjPct = (adjustments.reduce((s, a) => s + Math.abs(a.dollarAmount), 0) / salePrice) * 100;

    const distance = parseFloat((0.2 + ((seed * (i + 11)) % 50) / 10).toFixed(1));
    const saleDate = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
    const streetNum = 100 + ((seed * (i + 2)) % 900);
    const street = streetNames[i % streetNames.length];

    comps.push({
      id: `COMP-${(i + 1).toString().padStart(3, "0")}`,
      address: `${streetNum} ${street}`,
      city: property.city || "Anytown",
      state: property.state || "TX",
      propertyType: property.propertyType,
      squareFeet: compSqft,
      yearBuilt: property.yearBuilt ? property.yearBuilt - ((seed * (i + 4)) % 15) : undefined,
      condition: compCondition,
      bedrooms: property.bedrooms ? Math.max(1, property.bedrooms + (((seed * (i + 3)) % 3) - 1)) : undefined,
      bathrooms: property.bathrooms ? Math.max(1, property.bathrooms + (((seed * (i + 5)) % 3) - 1)) : undefined,
      salePrice,
      saleDate,
      saleCondition,
      financingType,
      daysOnMarket: 15 + ((seed * (i + 6)) % 90),
      distance,
      pricePerSqFt: Math.round(salePrice / compSqft),
      adjustments,
      adjustedPrice: finalAdjustedPrice,
      netAdjustmentPct: Math.round(netAdjPct * 10) / 10,
      grossAdjustmentPct: Math.round(grossAdjPct * 10) / 10,
    });
  }
  return comps;
}

export function calculateSalesComparisonValue(comps: ComparableSale[]): number {
  if (comps.length === 0) return 0;
  const sorted = [...comps].sort((a, b) => a.grossAdjustmentPct - b.grossAdjustmentPct);
  // Weight comps with lower gross adjustment more heavily
  const weights = sorted.map((_, i) => 1 / (i + 1));
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  return Math.round(sorted.reduce((s, c, i) => s + c.adjustedPrice * (weights[i] / totalWeight), 0));
}

// ── Income Capitalization Approach ────────────────────────────────────────────

export function calculateIncomeApproach(inputs: IncomeApproachInputs): IncomeApproachResult {
  const potentialGrossIncome = inputs.scheduledRentIncome + inputs.otherIncome;
  const vacancyAndCreditLoss = potentialGrossIncome * (inputs.vacancyRate + inputs.creditLossRate);
  const effectiveGrossIncome = potentialGrossIncome - vacancyAndCreditLoss;

  const totalOperatingExpenses =
    inputs.realEstateTaxes +
    inputs.insurance +
    inputs.utilities +
    inputs.management +
    inputs.maintenance +
    inputs.reserves +
    inputs.otherExpenses;

  const expenseRatio = totalOperatingExpenses / effectiveGrossIncome;
  const netOperatingIncome = effectiveGrossIncome - totalOperatingExpenses;

  const directCapValue = inputs.capRate > 0 ? Math.round(netOperatingIncome / inputs.capRate) : 0;

  // Simple DCF if holding period provided
  let dcfValue: number | undefined;
  let presentValueCashFlows: number | undefined;
  let presentValueReversion: number | undefined;

  if (inputs.holdingPeriodYears && inputs.discountRate && inputs.terminalCapRate) {
    const rentGrowth = inputs.annualRentGrowthRate ?? 0.02;
    const expenseGrowth = inputs.annualExpenseGrowthRate ?? 0.02;
    let pvCashFlows = 0;
    let currentNOI = netOperatingIncome;

    for (let year = 1; year <= inputs.holdingPeriodYears; year++) {
      currentNOI = currentNOI * (1 + rentGrowth);
      const pv = currentNOI / Math.pow(1 + inputs.discountRate, year);
      pvCashFlows += pv;
    }

    const terminalNOI = currentNOI * (1 + rentGrowth);
    const reversionValue = terminalNOI / inputs.terminalCapRate;
    const pvReversion = reversionValue / Math.pow(1 + inputs.discountRate, inputs.holdingPeriodYears);

    presentValueCashFlows = Math.round(pvCashFlows);
    presentValueReversion = Math.round(pvReversion);
    dcfValue = Math.round(pvCashFlows + pvReversion);
  }

  const reconciledIncomeValue = dcfValue
    ? Math.round((directCapValue * 0.6 + dcfValue * 0.4))
    : directCapValue;

  const overallCapRate = reconciledIncomeValue > 0 ? netOperatingIncome / reconciledIncomeValue : inputs.capRate;
  const grossRentMultiplier = potentialGrossIncome > 0 ? reconciledIncomeValue / potentialGrossIncome : 0;

  return {
    potentialGrossIncome: Math.round(potentialGrossIncome),
    effectiveGrossIncome: Math.round(effectiveGrossIncome),
    totalOperatingExpenses: Math.round(totalOperatingExpenses),
    expenseRatio: Math.round(expenseRatio * 1000) / 1000,
    netOperatingIncome: Math.round(netOperatingIncome),
    directCapValue,
    dcfValue,
    presentValueCashFlows,
    presentValueReversion,
    reconciledIncomeValue,
    overallCapRate: Math.round(overallCapRate * 10000) / 10000,
    grossRentMultiplier: Math.round(grossRentMultiplier * 100) / 100,
  };
}

// ── Cost Approach ─────────────────────────────────────────────────────────────

const COST_PER_SQFT_DEFAULTS: Record<string, number> = {
  Residential: 175,
  Commercial: 225,
  Industrial: 145,
};

export function calculateCostApproach(inputs: CostApproachInputs): CostApproachResult {
  const costPerSqFt = inputs.costPerSqFt || COST_PER_SQFT_DEFAULTS[inputs.improvementType] || 175;
  const replacementCostNew = Math.round(inputs.grossBuildingArea * costPerSqFt);
  const entrepreneurialProfit = Math.round(replacementCostNew * inputs.entrepreneurialProfit);
  const rcnWithProfit = replacementCostNew + entrepreneurialProfit;

  const physicalDepreciation = Math.round(rcnWithProfit * inputs.physicalDepreciationPct);
  const functionalObsolescence = Math.round(rcnWithProfit * inputs.functionalObsolescencePct);
  const externalObsolescence = Math.round(rcnWithProfit * inputs.externalObsolescencePct);
  const totalDepreciation = physicalDepreciation + functionalObsolescence + externalObsolescence;

  const depreciatedImprovementValue = Math.max(0, rcnWithProfit - totalDepreciation);
  const siteImprovements = inputs.siteImprovements ?? 0;
  const indicatedValueCostApproach = Math.round(inputs.landValue + depreciatedImprovementValue + siteImprovements);

  return {
    replacementCostNew,
    entrepreneurialProfit,
    totalDepreciation,
    depreciatedImprovementValue,
    siteImprovements,
    landValue: inputs.landValue,
    indicatedValueCostApproach,
    physicalDepreciation,
    functionalObsolescence,
    externalObsolescence,
  };
}

// ── Primary AVM Valuation (Sales Comparison) ──────────────────────────────────

export function calculateValuation(property: Property, market?: MarketData): Valuation {
  const mkt = market ?? analyzeMarket("Suburbs North");
  const comps = generateComparableSales(property, mkt);
  const salesCompValue = calculateSalesComparisonValue(comps);

  // Simple AVM as a cross-check
  const avmValue = Math.round(
    property.squareFeet * mkt.averagePricePerSqft +
    (property.bedrooms ?? 3) * 15000 +
    (property.bathrooms ?? 2) * 10000
  );

  // Reconcile: weight comps 70%, AVM 30%
  const reconciledValue = Math.round(salesCompValue * 0.7 + avmValue * 0.3);
  const confidenceLevel = comps.length >= 3 ? 0.88 : 0.72;

  const reconciliation: ApproachReconciliation = {
    salesComparisonValue: salesCompValue,
    salesComparisonWeight: 0.7,
    reconciledValue,
    pointEstimate: reconciledValue,
    rangeMin: Math.round(reconciledValue * 0.95),
    rangeMax: Math.round(reconciledValue * 1.05),
    reconciliationNarrative:
      "The Sales Comparison Approach is given primary weight as it directly reflects current market behavior for this property type. " +
      "The automated valuation model estimate is used as a cross-check and given secondary weight. " +
      "The reconciled value reflects the appraiser's opinion of value as of the effective date.",
  };

  return {
    propertyId: property.id,
    estimatedValue: reconciledValue,
    confidenceLevel,
    methodology: "Sales Comparison Approach (Primary) + AVM Cross-Check",
    approachReconciliation: reconciliation,
    comps,
  };
}

// ── Risk Assessment Engine ────────────────────────────────────────────────────

export function assessRisk(
  property: Property,
  marketData?: MarketData,
  valuation?: Valuation
): RiskAssessment {
  let riskScore = 0.0;
  const factors: string[] = [];

  // Property-level risk factors
  if (property.squareFeet > 5000) {
    riskScore += 0.1;
    factors.push("Large property size (>5,000 sqft) — limited buyer pool");
  }
  if (property.condition === "Poor" || property.condition === "Fair") {
    riskScore += 0.15;
    factors.push(`Property condition: ${property.condition} — deferred maintenance risk`);
  }
  if (property.yearBuilt && (new Date().getFullYear() - property.yearBuilt) > 50) {
    riskScore += 0.08;
    factors.push("Property age >50 years — potential functional obsolescence");
  }
  if (property.propertyType === "special_purpose") {
    riskScore += 0.2;
    factors.push("Special purpose property — limited alternative uses");
  }
  if (property.propertyType === "hospitality") {
    riskScore += 0.12;
    factors.push("Hospitality property — high operational risk and market sensitivity");
  }

  // Market-level risk factors
  if (marketData) {
    if (marketData.marketTrend === "Declining") {
      riskScore += 0.15;
      factors.push("Declining market trend — downward price pressure");
    }
    if ((marketData.vacancyRate ?? 0) > 0.10) {
      riskScore += 0.1;
      factors.push(`High market vacancy rate (${((marketData.vacancyRate ?? 0) * 100).toFixed(1)}%)`);
    }
    if ((marketData.averageDaysOnMarket ?? 0) > 90) {
      riskScore += 0.08;
      factors.push("Extended marketing time (>90 days) — reduced liquidity");
    }

    // Valuation deviation from market
    if (valuation) {
      const expectedValue = property.squareFeet * marketData.averagePricePerSqft;
      const deviation = Math.abs(valuation.estimatedValue - expectedValue) / expectedValue;
      if (deviation > 0.3) {
        riskScore += 0.1;
        factors.push(`Valuation deviates ${(deviation * 100).toFixed(0)}% from market average — atypical property`);
      }
    }

    if (marketData.medianPrice > 1000000) {
      riskScore += 0.05;
      factors.push("High-value market segment — limited buyer pool and financing constraints");
    }
  }

  riskScore = Math.min(riskScore, 1.0);

  let riskLevel: "Low" | "Moderate" | "Elevated" | "High";
  if (riskScore < 0.2) riskLevel = "Low";
  else if (riskScore < 0.4) riskLevel = "Moderate";
  else if (riskScore < 0.65) riskLevel = "Elevated";
  else riskLevel = "High";

  if (factors.length === 0) {
    factors.push("Standard property profile — no significant risk factors identified");
  }

  return {
    propertyId: property.id,
    riskScore,
    riskLevel,
    factors,
  };
}
