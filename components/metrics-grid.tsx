import { cn } from "@/lib/utils";
import type { AgentStatus, SwarmPipelineResult } from "@/lib/types";
import { Activity, DollarSign, TrendingUp, ShieldCheck } from "lucide-react";

interface MetricsGridProps {
  agents: AgentStatus[];
  lastResult: SwarmPipelineResult | null;
  totalRuns: number;
}

export function MetricsGrid({ agents, lastResult, totalRuns }: MetricsGridProps) {
  const allOnline = agents.every(
    (a) => a.status === "online" || a.status === "idle"
  );

  const metrics = [
    {
      label: "SWARM STATUS",
      value: allOnline ? "NOMINAL" : "DEGRADED",
      subValue: `${agents.filter((a) => a.status === "online").length}/3 agents online`,
      icon: Activity,
      valueColor: allOnline ? "text-primary" : "text-chart-2",
    },
    {
      label: "PIPELINE RUNS",
      value: totalRuns.toString(),
      subValue: lastResult
        ? `Last: ${lastResult.pipelineDurationMs}ms`
        : "No runs yet",
      icon: DollarSign,
      valueColor: "text-foreground",
    },
    {
      label: "MARKET TREND",
      value: lastResult?.marketData.marketTrend ?? "--",
      subValue: lastResult
        ? `$${lastResult.marketData.averagePricePerSqft}/sqft`
        : "Pending analysis",
      icon: TrendingUp,
      valueColor: lastResult?.marketData.marketTrend === "Rising"
        ? "text-primary"
        : lastResult?.marketData.marketTrend === "Declining"
          ? "text-destructive"
          : "text-chart-2",
    },
    {
      label: "RISK LEVEL",
      value: lastResult?.riskAssessment.riskLevel ?? "--",
      subValue: lastResult
        ? `Score: ${(lastResult.riskAssessment.riskScore * 100).toFixed(0)}%`
        : "Pending assessment",
      icon: ShieldCheck,
      valueColor: lastResult?.riskAssessment.riskLevel === "Low"
        ? "text-primary"
        : lastResult?.riskAssessment.riskLevel === "High"
          ? "text-destructive"
          : "text-chart-2",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
              {metric.label}
            </span>
            <metric.icon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p
            className={cn(
              "font-mono text-xl font-bold",
              metric.valueColor
            )}
          >
            {metric.value}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            {metric.subValue}
          </p>
        </div>
      ))}
    </div>
  );
}
