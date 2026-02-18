"use client";

import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { AgentStatus, SwarmPipelineResult } from "@/lib/types";
import { Zap } from "lucide-react";

interface LiveTickerProps {
  agents: AgentStatus[];
  lastResult: SwarmPipelineResult | null;
  totalRuns: number;
  uptime: number;
}

interface TickerItem {
  id: string;
  text: string;
  color: string;
}

export function LiveTicker({
  agents,
  lastResult,
  totalRuns,
  uptime,
}: LiveTickerProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((p) => p + 1), 3000);
    return () => clearInterval(interval);
  }, []);

  const items: TickerItem[] = useMemo(() => {
    const base: TickerItem[] = [
      {
        id: "swarm",
        text: `SWARM: ${agents.filter((a) => a.status === "online" || a.status === "processing").length}/3 AGENTS ONLINE`,
        color: "text-primary",
      },
      {
        id: "runs",
        text: `PIPELINE RUNS: ${totalRuns}`,
        color: "text-foreground",
      },
    ];

    agents.forEach((a) => {
      const codenames: Record<string, string> = {
        "Valuation Agent": "APPRAISER-1",
        "Market Agent": "ANALYST-2",
        "Risk Agent": "SENTINEL-3",
      };
      base.push({
        id: `agent-${a.name}`,
        text: `${codenames[a.name] ?? a.name}: ${a.status.toUpperCase()} | HP ${a.health}% | ${a.taskCount} TASKS`,
        color:
          a.status === "online"
            ? "text-primary"
            : a.status === "processing"
              ? "text-chart-2"
              : a.status === "error"
                ? "text-destructive"
                : "text-muted-foreground",
      });
    });

    if (lastResult) {
      base.push({
        id: "val",
        text: `LAST VALUATION: $${lastResult.valuation.estimatedValue.toLocaleString()} | ${lastResult.marketData.marketTrend.toUpperCase()} MARKET | ${lastResult.riskAssessment.riskLevel.toUpperCase()} RISK`,
        color: "text-chart-3",
      });
    }

    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = uptime % 60;
    base.push({
      id: "uptime",
      text: `UPTIME: ${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`,
      color: "text-muted-foreground",
    });

    return base;
  }, [agents, lastResult, totalRuns, uptime]);

  const visibleIndex = tick % items.length;

  return (
    <div className="flex items-center gap-3 overflow-hidden border-b border-border bg-card/50 px-4 py-2">
      <div className="flex shrink-0 items-center gap-1.5">
        <Zap className="h-3 w-3 text-primary" />
        <span className="font-mono text-[10px] font-semibold tracking-wider text-primary">
          LIVE
        </span>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="relative flex-1 overflow-hidden">
        <p
          key={items[visibleIndex].id + tick}
          className={cn(
            "animate-slide-in font-mono text-[10px] tracking-wider",
            items[visibleIndex].color
          )}
        >
          {items[visibleIndex].text}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {items.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 w-1 rounded-full transition-colors",
              i === visibleIndex ? "bg-primary" : "bg-border"
            )}
          />
        ))}
      </div>
    </div>
  );
}
