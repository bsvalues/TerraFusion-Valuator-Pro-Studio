// ============================================================================
// TerraFusion Core Types -- TypeScript port of valuator-core/src/models.rs
// ============================================================================

/** Represents a property being valued (mirrors Rust Property struct) */
export interface Property {
  id: string;
  address: string;
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
}

/** Represents a valuation result (mirrors Rust Valuation struct) */
export interface Valuation {
  propertyId: string;
  estimatedValue: number;
  confidenceLevel: number;
  methodology: string;
}

/** Market data for analysis (mirrors Rust MarketData struct) */
export interface MarketData {
  region: string;
  medianPrice: number;
  averagePricePerSqft: number;
  marketTrend: MarketTrend;
}

/** Market trend indicator (mirrors Rust MarketTrend enum) */
export type MarketTrend = "Rising" | "Stable" | "Declining";

/** Risk assessment result (mirrors Rust RiskAssessment struct) */
export interface RiskAssessment {
  propertyId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  factors: string[];
}

/** Risk level classification (mirrors Rust RiskLevel enum) */
export type RiskLevel = "Low" | "Medium" | "High";

// ============================================================================
// Multi-Agent Swarm Types -- Cloud Coach extensions
// ============================================================================

export type AgentName = "Valuation Agent" | "Market Agent" | "Risk Agent";

export type AgentStatusCode = "online" | "processing" | "error" | "idle";

/** Individual agent status in the swarm */
export interface AgentStatus {
  name: AgentName;
  status: AgentStatusCode;
  lastRun: string | null;
  taskCount: number;
  health: number; // 0-100
}

export type EventSeverity = "info" | "success" | "warning" | "error";

/** A single event in the swarm activity log */
export interface SwarmEvent {
  id: string;
  timestamp: string;
  agent: AgentName;
  action: string;
  detail: string;
  severity: EventSeverity;
}

/** Full swarm pipeline result */
export interface SwarmPipelineResult {
  valuation: Valuation;
  marketData: MarketData;
  riskAssessment: RiskAssessment;
  pipelineDurationMs: number;
}

/** API error response */
export interface ApiError {
  error: string;
  code: string;
}
