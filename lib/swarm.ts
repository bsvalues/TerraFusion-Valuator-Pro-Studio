// ============================================================================
// Multi-Agent Swarm State Manager -- "Ralph Wiggum Mode" Orchestration
// ============================================================================

import type {
  AgentName,
  AgentStatus,
  SwarmEvent,
  SwarmPipelineResult,
  Property,
  EventSeverity,
} from "./types";
import { calculateValuation, analyzeMarket, assessRisk } from "./engines";

// ---- In-memory swarm state (singleton) ----

let agentRegistry: AgentStatus[] = [
  {
    name: "Valuation Agent",
    status: "online",
    lastRun: null,
    taskCount: 0,
    health: 100,
  },
  {
    name: "Market Agent",
    status: "online",
    lastRun: null,
    taskCount: 0,
    health: 100,
  },
  {
    name: "Risk Agent",
    status: "online",
    lastRun: null,
    taskCount: 0,
    health: 100,
  },
];

let eventLog: SwarmEvent[] = [
  {
    id: "boot-001",
    timestamp: new Date().toISOString(),
    agent: "Valuation Agent",
    action: "SYSTEM_BOOT",
    detail: "Valuation Agent initialized -- TerraFusion AVM engine loaded",
    severity: "info",
  },
  {
    id: "boot-002",
    timestamp: new Date().toISOString(),
    agent: "Market Agent",
    action: "SYSTEM_BOOT",
    detail:
      "Market Agent initialized -- regional data feeds connected",
    severity: "info",
  },
  {
    id: "boot-003",
    timestamp: new Date().toISOString(),
    agent: "Risk Agent",
    action: "SYSTEM_BOOT",
    detail:
      "Risk Agent initialized -- factor analysis engine ready",
    severity: "info",
  },
];

/** Pipeline run history record */
export interface PipelineRun {
  id: string;
  timestamp: string;
  propertyId: string;
  address: string;
  region: string;
  estimatedValue: number;
  riskLevel: string;
  marketTrend: string;
  durationMs: number;
}

let pipelineHistory: PipelineRun[] = [];

let eventCounter = 3;

// ---- Helpers ----

function generateEventId(): string {
  eventCounter++;
  return `evt-${eventCounter.toString().padStart(5, "0")}`;
}

function addEvent(
  agent: AgentName,
  action: string,
  detail: string,
  severity: EventSeverity
) {
  const event: SwarmEvent = {
    id: generateEventId(),
    timestamp: new Date().toISOString(),
    agent,
    action,
    detail,
    severity,
  };
  eventLog.unshift(event); // newest first
  // Keep max 100 events
  if (eventLog.length > 100) {
    eventLog = eventLog.slice(0, 100);
  }
}

function updateAgent(
  name: AgentName,
  updates: Partial<AgentStatus>
) {
  agentRegistry = agentRegistry.map((a) =>
    a.name === name ? { ...a, ...updates } : a
  );
}

// ---- Public API ----

export function getAgentStatuses(): AgentStatus[] {
  return [...agentRegistry];
}

export function getEventLog(): SwarmEvent[] {
  return [...eventLog];
}

export function getPipelineHistory(): PipelineRun[] {
  return [...pipelineHistory];
}

/**
 * Run the full swarm pipeline: Valuation -> Market Analysis -> Risk Assessment.
 * Each agent processes sequentially, logging events along the way.
 */
export function runSwarmPipeline(
  property: Property,
  region: string
): SwarmPipelineResult {
  const startTime = Date.now();
  const now = new Date().toISOString();

  addEvent(
    "Valuation Agent",
    "PIPELINE_START",
    `Swarm pipeline initiated for property ${property.id}`,
    "info"
  );

  // Step 1: Valuation Agent
  updateAgent("Valuation Agent", { status: "processing" });
  addEvent(
    "Valuation Agent",
    "TASK_START",
    `Calculating AVM valuation for ${property.address}`,
    "info"
  );

  let valuation;
  try {
    valuation = calculateValuation(property);
    updateAgent("Valuation Agent", {
      status: "online",
      lastRun: now,
      taskCount: agentRegistry.find((a) => a.name === "Valuation Agent")!
        .taskCount + 1,
    });
    addEvent(
      "Valuation Agent",
      "TASK_COMPLETE",
      `Valuation: $${valuation.estimatedValue.toLocaleString()} (${(valuation.confidenceLevel * 100).toFixed(0)}% confidence)`,
      "success"
    );
  } catch (err) {
    updateAgent("Valuation Agent", { status: "error", health: 50 });
    addEvent(
      "Valuation Agent",
      "TASK_ERROR",
      `Valuation failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      "error"
    );
    throw err;
  }

  // Step 2: Market Agent
  updateAgent("Market Agent", { status: "processing" });
  addEvent(
    "Market Agent",
    "TASK_START",
    `Analyzing market data for region: ${region}`,
    "info"
  );

  let marketData;
  try {
    marketData = analyzeMarket(region);
    updateAgent("Market Agent", {
      status: "online",
      lastRun: now,
      taskCount: agentRegistry.find((a) => a.name === "Market Agent")!
        .taskCount + 1,
    });
    addEvent(
      "Market Agent",
      "TASK_COMPLETE",
      `Market trend: ${marketData.marketTrend} | Median: $${marketData.medianPrice.toLocaleString()}`,
      "success"
    );
  } catch (err) {
    updateAgent("Market Agent", { status: "error", health: 50 });
    addEvent(
      "Market Agent",
      "TASK_ERROR",
      `Market analysis failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      "error"
    );
    throw err;
  }

  // Step 3: Risk Agent (enhanced -- receives market + valuation data for correlation)
  updateAgent("Risk Agent", { status: "processing" });
  addEvent(
    "Risk Agent",
    "TASK_START",
    `Assessing risk factors for property ${property.id} (market-correlated)`,
    "info"
  );

  let riskAssessment;
  try {
    riskAssessment = assessRisk(property, marketData, valuation);
    updateAgent("Risk Agent", {
      status: "online",
      lastRun: now,
      taskCount: agentRegistry.find((a) => a.name === "Risk Agent")!.taskCount +
        1,
    });
    addEvent(
      "Risk Agent",
      "TASK_COMPLETE",
      `Risk level: ${riskAssessment.riskLevel} (score: ${riskAssessment.riskScore.toFixed(2)}) -- ${riskAssessment.factors.length} factors analyzed`,
      "success"
    );
  } catch (err) {
    updateAgent("Risk Agent", { status: "error", health: 50 });
    addEvent(
      "Risk Agent",
      "TASK_ERROR",
      `Risk assessment failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      "error"
    );
    throw err;
  }

  const pipelineDurationMs = Date.now() - startTime;

  addEvent(
    "Valuation Agent",
    "PIPELINE_COMPLETE",
    `Swarm pipeline completed in ${pipelineDurationMs}ms -- all agents nominal`,
    "success"
  );

  // Record in pipeline history
  const run: PipelineRun = {
    id: `run-${Date.now()}`,
    timestamp: now,
    propertyId: property.id,
    address: property.address,
    region,
    estimatedValue: valuation.estimatedValue,
    riskLevel: riskAssessment.riskLevel,
    marketTrend: marketData.marketTrend,
    durationMs: pipelineDurationMs,
  };
  pipelineHistory.unshift(run);
  if (pipelineHistory.length > 50) {
    pipelineHistory = pipelineHistory.slice(0, 50);
  }

  return {
    valuation,
    marketData,
    riskAssessment,
    pipelineDurationMs,
  };
}
