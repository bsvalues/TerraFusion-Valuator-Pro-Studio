// ============================================================================
// TerraFusion Valuator Pro Studio — Commercial Fee Appraiser Types
// Pivoted from county assessment AVM to USPAP-compliant fee appraisal
// ============================================================================

// ── Property Types ────────────────────────────────────────────────────────────

export type PropertyType =
  | "single_family"
  | "condo"
  | "multi_family_2_4"
  | "multi_family_5plus"
  | "office"
  | "retail"
  | "industrial"
  | "mixed_use"
  | "hospitality"
  | "land"
  | "special_purpose";

export type PropertyCondition = "Excellent" | "Good" | "Average" | "Fair" | "Poor";
export type ApproachToValue = "income" | "sales_comparison" | "cost" | "all_three";

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  propertyType: PropertyType;
  squareFeet: number;
  landAreaSqFt?: number;
  landAreaAcres?: number;
  yearBuilt?: number;
  effectiveAge?: number;
  condition: PropertyCondition;
  bedrooms?: number;
  bathrooms?: number;
  stories?: number;
  garageSpaces?: number;
  numberOfUnits?: number;
  numberOfStories?: number;
  parkingSpaces?: number;
  zoning?: string;
  legalDescription?: string;
  assessedValue?: number;
  lastSalePrice?: number;
  lastSaleDate?: string;
  latitude?: number;
  longitude?: number;
}

// ── Appraisal Order Management (Flat / UI-friendly) ───────────────────────────

export type OrderStatus =
  | "intake"
  | "inspection"
  | "research"
  | "analysis"
  | "draft"
  | "review"
  | "delivered"
  | "invoiced"
  | "paid"
  | "on_hold"
  | "cancelled";

export type AppraisalFormType =
  | "URAR_1004"
  | "1073_Condo"
  | "1025_Multi"
  | "2055_Exterior"
  | "1004D_Update"
  | "Commercial_Narrative"
  | "Restricted_Appraisal"
  | "Summary_Appraisal"
  | "Desktop_1004";

/** Flat order record used by the Order Management UI */
export interface AppraisalOrder {
  id: string;
  fileNumber: string;
  status: OrderStatus;
  propertyAddress: string;
  city: string;
  state: string;
  zip?: string;
  county?: string;
  propertyType: PropertyType;
  clientName: string;
  clientEmail?: string;
  lenderName?: string;
  borrowerName?: string;
  loanNumber?: string;
  loanType?: "Conventional" | "FHA" | "VA" | "USDA" | "Commercial" | "Cash" | "Other";
  purpose?: "Purchase" | "Refinance" | "HELOC" | "Estate" | "Divorce" | "Tax Appeal" | "Other";
  fee?: number;
  feeStatus?: "pending" | "invoiced" | "paid";
  orderedDate?: string;
  inspectionDate?: string;
  dueDate?: string;
  deliveredDate?: string;
  appraiserName?: string;
  appraiserLicense?: string;
  supervisingAppraiser?: string;
  formType?: AppraisalFormType;
  notes?: string;
  priority?: "normal" | "rush" | "super_rush";
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  address?: string;
  clientType: "lender" | "attorney" | "estate" | "private" | "amc" | "government";
  intendedUse: string;
}

// ── Comparable Sales ──────────────────────────────────────────────────────────

export type SaleCondition = "Arms Length" | "Foreclosure" | "REO" | "Related Party" | "Estate" | "Short Sale";
export type FinancingType = "Conventional" | "Cash" | "Seller Financed" | "FHA" | "VA" | "Assumed";

export interface SaleAdjustment {
  category: string;
  description: string;
  dollarAmount: number;
  percentAmount?: number;
}

export interface ComparableSale {
  id: string;
  address: string;
  city: string;
  state: string;
  propertyType: PropertyType;
  squareFeet: number;
  landAreaSqFt?: number;
  yearBuilt?: number;
  condition: PropertyCondition;
  bedrooms?: number;
  bathrooms?: number;
  numberOfUnits?: number;
  salePrice: number;
  saleDate: string;
  saleCondition: SaleCondition;
  financingType: FinancingType;
  daysOnMarket?: number;
  distance: number;
  pricePerSqFt: number;
  pricePerUnit?: number;
  capRate?: number;
  adjustments: SaleAdjustment[];
  adjustedPrice: number;
  netAdjustmentPct: number;
  grossAdjustmentPct: number;
}

// ── Income Approach ───────────────────────────────────────────────────────────

export interface TenantLease {
  id: string;
  tenantName: string;
  suite?: string;
  leasedSqFt: number;
  leaseType: "NNN" | "NN" | "Gross" | "Modified_Gross";
  monthlyRent: number;
  annualRent: number;
  rentPerSqFt: number;
  leaseStartDate: string;
  leaseEndDate: string;
  options?: string;
  tenantCreditRating?: "National" | "Regional" | "Local" | "Startup";
}

export interface IncomeApproachInputs {
  scheduledRentIncome: number;
  otherIncome: number;
  vacancyRate: number;
  creditLossRate: number;
  realEstateTaxes: number;
  insurance: number;
  utilities: number;
  management: number;
  maintenance: number;
  reserves: number;
  otherExpenses: number;
  capRate: number;
  holdingPeriodYears?: number;
  terminalCapRate?: number;
  discountRate?: number;
  annualRentGrowthRate?: number;
  annualExpenseGrowthRate?: number;
}

export interface IncomeApproachResult {
  potentialGrossIncome: number;
  effectiveGrossIncome: number;
  totalOperatingExpenses: number;
  expenseRatio: number;
  netOperatingIncome: number;
  directCapValue: number;
  dcfValue?: number;
  presentValueCashFlows?: number;
  presentValueReversion?: number;
  reconciledIncomeValue: number;
  overallCapRate: number;
  grossRentMultiplier: number;
}

// ── Cost Approach ─────────────────────────────────────────────────────────────

export interface CostApproachInputs {
  landValue: number;
  improvementType: "Residential" | "Commercial" | "Industrial";
  grossBuildingArea: number;
  costPerSqFt: number;
  entrepreneurialProfit: number;
  physicalDepreciationPct: number;
  functionalObsolescencePct: number;
  externalObsolescencePct: number;
  siteImprovements?: number;
}

export interface CostApproachResult {
  replacementCostNew: number;
  entrepreneurialProfit: number;
  totalDepreciation: number;
  depreciatedImprovementValue: number;
  siteImprovements: number;
  landValue: number;
  indicatedValueCostApproach: number;
  physicalDepreciation: number;
  functionalObsolescence: number;
  externalObsolescence: number;
}

// ── Valuation & Reconciliation ────────────────────────────────────────────────

export interface ApproachReconciliation {
  salesComparisonValue?: number;
  salesComparisonWeight?: number;
  incomeApproachValue?: number;
  incomeApproachWeight?: number;
  costApproachValue?: number;
  costApproachWeight?: number;
  reconciledValue: number;
  pointEstimate: number;
  rangeMin?: number;
  rangeMax?: number;
  reconciliationNarrative: string;
}

export interface Valuation {
  propertyId: string;
  orderId?: string;
  effectiveDate?: string;
  estimatedValue: number;
  confidenceLevel: number;
  methodology: string;
  approachReconciliation?: ApproachReconciliation;
  incomeResult?: IncomeApproachResult;
  costResult?: CostApproachResult;
  comps?: ComparableSale[];
}

// ── Market Data ───────────────────────────────────────────────────────────────

export type MarketTrend = "Rising" | "Stable" | "Declining";
export type MarketDemandSupply = "Shortage" | "In Balance" | "Over Supply";

export interface MarketData {
  region: string;
  submarket?: string;
  medianPrice: number;
  averagePricePerSqft: number;
  marketTrend: MarketTrend;
  demandSupply?: MarketDemandSupply;
  averageDaysOnMarket?: number;
  listToSaleRatio?: number;
  averageCapRate?: number;
  vacancyRate?: number;
  absorptionRate?: number;
  dataAsOf?: string;
}

// ── Risk Assessment ───────────────────────────────────────────────────────────

export type RiskLevel = "Low" | "Moderate" | "Elevated" | "High";

export interface RiskFactor {
  category: "market" | "property" | "income" | "legal" | "environmental";
  description: string;
  severity: "low" | "moderate" | "high";
  impact: number;
}

export interface RiskAssessment {
  propertyId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  factors: string[];
  detailedFactors?: RiskFactor[];
}

// ── Multi-Agent Swarm (Repurposed for Fee Appraisal) ─────────────────────────

export type AgentName =
  | "Market Intelligence Agent"
  | "Comparable Sales Agent"
  | "Income Analysis Agent"
  | "Risk Assessment Agent"
  | "Narrative Drafting Agent";

export type AgentStatusCode = "online" | "processing" | "error" | "idle";

export interface AgentStatus {
  name: AgentName;
  status: AgentStatusCode;
  lastRun: string | null;
  taskCount: number;
  health: number;
}

export type EventSeverity = "info" | "success" | "warning" | "error";

export interface SwarmEvent {
  id: string;
  timestamp: string;
  agent: AgentName;
  action: string;
  detail: string;
  severity: EventSeverity;
}

export interface PipelineRun {
  id: string;
  timestamp: string;
  orderId?: string;
  propertyId?: string;
  address: string;
  region: string;
  estimatedValue: number;
  riskLevel: RiskLevel;
  marketTrend: MarketTrend;
  durationMs: number;
}

export interface SwarmPipelineResult {
  valuation: Valuation;
  marketData: MarketData;
  riskAssessment: RiskAssessment;
  pipelineDurationMs: number;
}

// ── USPAP Compliance ──────────────────────────────────────────────────────────

export interface USPAPCertificationData {
  appraiserName: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiration: string;
  designations?: string[];
  supervisingAppraiserName?: string;
  supervisingLicenseNumber?: string;
  certificationStatements: string[];
  signatureDate: string;
  effectiveDate: string;
  reportDate: string;
}

export interface WorkfileDocument {
  id: string;
  orderId: string;
  documentType:
    | "engagement_letter"
    | "inspection_photos"
    | "plat_map"
    | "flood_map"
    | "market_data"
    | "comp_data"
    | "appraisal_report"
    | "addendum"
    | "correspondence";
  fileName: string;
  uploadedAt: string;
  notes?: string;
}

// ── API Error ─────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code: string;
}
