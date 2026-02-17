"use client";

import { cn } from "@/lib/utils";
import type { SwarmPipelineResult } from "@/lib/types";
import { ValuationResult } from "./valuation-result";
import { RiskGauge } from "./risk-gauge";
import { MarketChart } from "./market-chart";
import { Network, ArrowRight, CheckCircle2, Clock } from "lucide-react";

interface SwarmOrchestratorProps {
  result: SwarmPipelineResult | null;
  isRunning: boolean;
}

const pipelineSteps = [
  { label: "VALUATION", agent: "Valuation Agent" },
  { label: "MARKET", agent: "Market Agent" },
  { label: "RISK", agent: "Risk Agent" },
];

export function SwarmOrchestrator({ result, isRunning }: SwarmOrchestratorProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Pipeline visualization */}
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" />
          <h4 className="font-mono text-xs font-medium tracking-wider text-foreground">
            SWARM PIPELINE
          </h4>
          {result && (
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">
              Completed in {result.pipelineDurationMs}ms
            </span>
          )}
        </div>

        {/* Pipeline steps */}
        <div className="flex items-center justify-center gap-2">
          {pipelineSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-md border px-4 py-2.5 transition-all",
                  result
                    ? "border-primary/30 bg-primary/5"
                    : isRunning
                      ? "border-chart-2/30 bg-chart-2/5"
                      : "border-border bg-secondary/50"
                )}
              >
                {result ? (
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                ) : isRunning ? (
                  <Clock className="h-3 w-3 animate-spin text-chart-2" />
                ) : (
                  <span className="h-3 w-3 rounded-full border border-muted-foreground/30" />
                )}
                <span
                  className={cn(
                    "font-mono text-[10px] font-semibold tracking-wider",
                    result
                      ? "text-primary"
                      : isRunning
                        ? "text-chart-2"
                        : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < pipelineSteps.length - 1 && (
                <ArrowRight
                  className={cn(
                    "h-3 w-3",
                    result
                      ? "text-primary/50"
                      : "text-muted-foreground/30"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Results grid */}
      {result && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ValuationResult valuation={result.valuation} />
          <MarketChart currentMarket={result.marketData} />
          <RiskGauge assessment={result.riskAssessment} />
        </div>
      )}
    </div>
  );
}
