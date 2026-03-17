"use client";

import { cn } from "@/lib/utils";
import type { PipelineRun } from "@/lib/types";
import { Clock, TrendingUp, TrendingDown, Minus, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

interface PipelineHistoryProps {
  history: PipelineRun[];
}

const trendIcons = {
  Rising: TrendingUp,
  Stable: Minus,
  Declining: TrendingDown,
};

const riskIcons = {
  Low: ShieldCheck,
  Medium: ShieldAlert,
  High: ShieldX,
};

const riskColors = {
  Low: "text-primary",
  Medium: "text-chart-2",
  High: "text-destructive",
};

const trendColors = {
  Rising: "text-primary",
  Stable: "text-chart-2",
  Declining: "text-destructive",
};

export function PipelineHistory({ history }: PipelineHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="font-mono text-xs font-medium tracking-wider text-foreground">
            PIPELINE HISTORY
          </h3>
        </div>
        <div className="flex h-48 items-center justify-center">
          <p className="font-mono text-xs text-muted-foreground">
            No pipeline runs recorded yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="font-mono text-xs font-medium tracking-wider text-foreground">
          PIPELINE HISTORY
        </h3>
        <span className="font-mono text-[10px] text-muted-foreground">
          {history.length} run{history.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="max-h-72 overflow-y-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-secondary/30">
              <th className="px-4 py-2 text-left font-mono text-[10px] font-medium tracking-wider text-muted-foreground">
                PROPERTY
              </th>
              <th className="px-4 py-2 text-left font-mono text-[10px] font-medium tracking-wider text-muted-foreground">
                VALUE
              </th>
              <th className="px-4 py-2 text-left font-mono text-[10px] font-medium tracking-wider text-muted-foreground">
                RISK
              </th>
              <th className="px-4 py-2 text-left font-mono text-[10px] font-medium tracking-wider text-muted-foreground">
                TREND
              </th>
              <th className="px-4 py-2 text-right font-mono text-[10px] font-medium tracking-wider text-muted-foreground">
                SPEED
              </th>
            </tr>
          </thead>
          <tbody>
            {history.map((run) => {
              const RiskIcon = riskIcons[run.riskLevel as keyof typeof riskIcons] ?? ShieldCheck;
              const TrendIcon = trendIcons[run.marketTrend as keyof typeof trendIcons] ?? Minus;
              return (
                <tr
                  key={run.id}
                  className="border-b border-border/30 transition-colors hover:bg-secondary/20"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-foreground">
                        {run.propertyId}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {run.address.length > 20 ? run.address.slice(0, 20) + "..." : run.address}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs font-semibold text-primary">
                      ${run.estimatedValue.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <RiskIcon className={cn("h-3 w-3", riskColors[run.riskLevel as keyof typeof riskColors])} />
                      <span className={cn("font-mono text-[10px] font-semibold", riskColors[run.riskLevel as keyof typeof riskColors])}>
                        {run.riskLevel.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <TrendIcon className={cn("h-3 w-3", trendColors[run.marketTrend as keyof typeof trendColors])} />
                      <span className={cn("font-mono text-[10px]", trendColors[run.marketTrend as keyof typeof trendColors])}>
                        {run.marketTrend}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {run.durationMs}ms
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
