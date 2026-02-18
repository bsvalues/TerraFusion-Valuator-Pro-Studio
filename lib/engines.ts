// ============================================================================
// TerraFusion Service Engines -- TypeScript ports of Rust service crates
// ============================================================================

import type {
  Property,
  Valuation,
  MarketData,
  MarketTrend,
  RiskAssessment,
  RiskLevel,
} from "./types";
import { validateProperty } from "./validation";

// ---- Valuation Engine (port of services/valuation-service/src/lib.rs) ------

/**
 * Calculate valuation for a property.
 * Mirrors ValuationEngine::calculate_valuation exactly:
 *   base = sqft * 200
 *   bedroom_adj = bedrooms * 25000
 *   bathroom_adj = bathrooms * 15000
 *   confidence = 0.85
 */
export function calculateValuation(property: Property): Valuation {
  const validation = validateProperty(property);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
  }

  const baseValue = property.squareFeet * 200.0;
  const bedroomAdjustment = property.bedrooms * 25000.0;
  const bathroomAdjustment = property.bathrooms * 15000.0;

  const estimatedValue = baseValue + bedroomAdjustment + bathroomAdjustment;

  return {
    propertyId: property.id,
    estimatedValue,
    confidenceLevel: 0.85,
    methodology: "TerraFusion Automated Valuation Model",
  };
}

// ---- Market Analyzer (port of services/market-analyzer/src/lib.rs) ---------

/** Region-specific market data presets for realistic demo data */
const REGION_DATA: Record<
  string,
  { medianPrice: number; avgPricePerSqft: number; trend: MarketTrend }
> = {
  Downtown: { medianPrice: 625000, avgPricePerSqft: 310, trend: "Rising" },
  Suburbs: { medianPrice: 385000, avgPricePerSqft: 185, trend: "Stable" },
  "Urban Core": { medianPrice: 550000, avgPricePerSqft: 275, trend: "Rising" },
  "Rural County": {
    medianPrice: 225000,
    avgPricePerSqft: 125,
    trend: "Declining",
  },
  "Waterfront District": {
    medianPrice: 875000,
    avgPricePerSqft: 425,
    trend: "Rising",
  },
};

/**
 * Analyze market data for a region.
 * Mirrors MarketAnalyzer::analyze_market with extended region data.
 */
export function analyzeMarket(region: string): MarketData {
  if (!region || region.trim() === "") {
    throw new Error("Region cannot be empty");
  }

  const preset = REGION_DATA[region];

  if (preset) {
    return {
      region,
      medianPrice: preset.medianPrice,
      averagePricePerSqft: preset.avgPricePerSqft,
      marketTrend: preset.trend,
    };
  }

  // Default fallback matching Rust implementation
  return {
    region,
    medianPrice: 425000.0,
    averagePricePerSqft: 210.0,
    marketTrend: "Rising",
  };
}

/** Available regions for UI select */
export const AVAILABLE_REGIONS = [
  "Downtown",
  "Suburbs",
  "Urban Core",
  "Rural County",
  "Waterfront District",
];

// ---- Comparable Sales Engine (Cloud Coach extension) -----------------------

/** A comparable property sale */
export interface ComparableSale {
  id: string;
  address: string;
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  salePrice: number;
  saleDate: string;
  distance: number; // miles from subject
  adjustedPrice: number;
  adjustmentFactors: string[];
}

/**
 * Generate comparable sales for a subject property in a given region.
 * Produces 3-5 comps with realistic adjustments based on the subject property
 * and region market data. This emulates what a certified appraiser would pull
 * from MLS data, adjusted for differences in GLA, bedroom count, and location.
 */
export function generateComparables(
  property: Property,
  region: string
): ComparableSale[] {
  const market = analyzeMarket(region);
  const basePrice = property.squareFeet * market.averagePricePerSqft;

  const streetNames = [
    "Oak Ave", "Elm St", "Pine Rd", "Maple Dr", "Cedar Ln",
    "Birch Way", "Walnut Ct", "Spruce Blvd",
  ];

  const comps: ComparableSale[] = [];
  const seed = property.squareFeet + property.bedrooms * 1000 + property.bathrooms * 100;

  for (let i = 0; i < 5; i++) {
    const sqftVariance = Math.round((((seed * (i + 7)) % 800) - 400));
    const compSqft = Math.max(800, property.squareFeet + sqftVariance);
    const bedVariance = ((seed * (i + 3)) % 3) - 1;
    const compBeds = Math.max(1, property.bedrooms + bedVariance);
    const bathVariance = ((seed * (i + 5)) % 3) - 1;
    const compBaths = Math.max(1, property.bathrooms + bathVariance);

    const factors: string[] = [];
    let adjustedPrice = compSqft * market.averagePricePerSqft;

    // GLA adjustment
    const sqftDiff = compSqft - property.squareFeet;
    if (sqftDiff !== 0) {
      const adj = sqftDiff * (market.averagePricePerSqft * 0.5);
      adjustedPrice -= adj;
      factors.push(`GLA ${sqftDiff > 0 ? "+" : ""}${sqftDiff} sqft: ${sqftDiff > 0 ? "-" : "+"}$${Math.abs(Math.round(adj)).toLocaleString()}`);
    }

    // Bedroom adjustment
    const bedDiff = compBeds - property.bedrooms;
    if (bedDiff !== 0) {
      const adj = bedDiff * 15000;
      adjustedPrice -= adj;
      factors.push(`Bedrooms ${bedDiff > 0 ? "+" : ""}${bedDiff}: ${bedDiff > 0 ? "-" : "+"}$${Math.abs(adj).toLocaleString()}`);
    }

    // Bathroom adjustment
    const bathDiff = compBaths - property.bathrooms;
    if (bathDiff !== 0) {
      const adj = bathDiff * 10000;
      adjustedPrice -= adj;
      factors.push(`Bathrooms ${bathDiff > 0 ? "+" : ""}${bathDiff}: ${bathDiff > 0 ? "-" : "+"}$${Math.abs(adj).toLocaleString()}`);
    }

    const distance = parseFloat((0.2 + ((seed * (i + 11)) % 50) / 10).toFixed(1));
    const daysAgo = 30 + ((seed * (i + 13)) % 150);
    const saleDate = new Date(Date.now() - daysAgo * 86400000)
      .toISOString()
      .slice(0, 10);

    const streetNum = 100 + ((seed * (i + 2)) % 900);
    const street = streetNames[i % streetNames.length];

    comps.push({
      id: `COMP-${(i + 1).toString().padStart(3, "0")}`,
      address: `${streetNum} ${street}`,
      squareFeet: compSqft,
      bedrooms: compBeds,
      bathrooms: compBaths,
      salePrice: Math.round(compSqft * market.averagePricePerSqft),
      saleDate,
      distance,
      adjustedPrice: Math.round(adjustedPrice),
      adjustmentFactors: factors.length > 0 ? factors : ["No adjustments needed"],
    });
  }

  return comps;
}

// ---- Risk Assessor (port of services/risk-assessor/src/lib.rs) -------------
// Enhanced with market-correlated risk, valuation deviation, and location volatility

/**
 * Assess risk for a property with optional market correlation.
 * Core logic mirrors RiskAssessor::assess_risk (sqft > 5000 => +0.2, bedrooms > 5 => +0.1),
 * extended with market-aware risk factors for the Cloud Coach swarm.
 */
export function assessRisk(
  property: Property,
  marketData?: MarketData,
  valuation?: Valuation
): RiskAssessment {
  const validation = validateProperty(property);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
  }

  let riskScore = 0.0;
  const factors: string[] = [];

  // Core Rust-port factors
  if (property.squareFeet > 5000) {
    riskScore += 0.2;
    factors.push("Large property size (>5,000 sqft)");
  }

  if (property.bedrooms > 5) {
    riskScore += 0.1;
    factors.push("High bedroom count (>5)");
  }

  // Extended: bathroom-to-bedroom ratio imbalance
  const bathRatio = property.bathrooms / property.bedrooms;
  if (bathRatio < 0.5) {
    riskScore += 0.05;
    factors.push("Low bath-to-bed ratio (<0.5)");
  }

  // Extended: market-correlated risk
  if (marketData) {
    if (marketData.marketTrend === "Declining") {
      riskScore += 0.15;
      factors.push("Declining market trend in region");
    }

    // Valuation-to-market deviation
    if (valuation) {
      const expectedValue = property.squareFeet * marketData.averagePricePerSqft;
      const deviation = Math.abs(valuation.estimatedValue - expectedValue) / expectedValue;
      if (deviation > 0.3) {
        riskScore += 0.1;
        factors.push(`Valuation deviates ${(deviation * 100).toFixed(0)}% from market avg`);
      }
    }

    // Location volatility based on price range
    if (marketData.medianPrice > 750000) {
      riskScore += 0.05;
      factors.push("High-value market volatility exposure");
    }
  }

  // Cap risk score at 1.0
  riskScore = Math.min(riskScore, 1.0);

  let riskLevel: RiskLevel;
  if (riskScore < 0.3) {
    riskLevel = "Low";
  } else if (riskScore < 0.6) {
    riskLevel = "Medium";
  } else {
    riskLevel = "High";
  }

  if (factors.length === 0) {
    factors.push("Standard property profile");
  }

  return {
    propertyId: property.id,
    riskScore,
    riskLevel,
    factors,
  };
}
