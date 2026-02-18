"use client";

import { cn } from "@/lib/utils";
import type { RiskAssessment } from "@/lib/types";

interface RiskHeatmapProps {
  assessment: RiskAssessment;
}

/**
 * A visual risk factor heatmap that shows each factor as a weighted cell.
 * Factors are mapped to intensity based on the overall risk level.
 */

const RISK_CATEGORIES = [
  { label: "Size", key: "size" },
  { label: "Bedrooms", key: "bedrooms" },
  { label: "Bath Ratio", key: "bath" },
  { label: "Market", key: "market" },
  { label: "Deviation", key: "deviation" },
  { label: "Volatility", key: "volatility" },
] as const;

function getFactorIntensity(
  factors: string[],
  categoryKey: string
): number {
  const keywords: Record<string, string[]> = {
    size: ["property size", "sqft", "large"],
    bedrooms: ["bedroom"],
    bath: ["bath"],
    market: ["market trend", "declining"],
    deviation: ["deviat"],
    volatility: ["volatility"],
  };

  const keys = keywords[categoryKey] ?? [];
  const matched = factors.some((f) =>
    keys.some((k) => f.toLowerCase().includes(k))
  );
  return matched ? 1 : 0;
}

function getHeatColor(intensity: number, riskLevel: string): string {
  if (intensity === 0) return "bg-secondary";
  switch (riskLevel) {
    case "Low":
      return "bg-primary/40";
    case "Medium":
      return "bg-chart-2/50";
    case "High":
      return "bg-destructive/50";
    default:
      return "bg-secondary";
  }
}

function getHeatBorder(intensity: number, riskLevel: string): string {
  if (intensity === 0) return "border-border/30";
  switch (riskLevel) {
    case "Low":
      return "border-primary/30";
    case "Medium":
      return "border-chart-2/30";
    case "High":
      return "border-destructive/30";
    default:
      return "border-border/30";
  }
}

export function RiskHeatmap({ assessment }: RiskHeatmapProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-xs font-medium tracking-wider text-foreground">
          RISK FACTOR HEATMAP
        </h4>
        <span
          className={cn(
            "rounded-sm px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider",
            assessment.riskLevel === "Low"
              ? "bg-primary/10 text-primary"
              : assessment.riskLevel === "Medium"
                ? "bg-chart-2/10 text-chart-2"
                : "bg-destructive/10 text-destructive"
          )}
        >
          {assessment.riskLevel.toUpperCase()}
        </span>
      </div>

      {/* Heatmap grid */}
      <div className="grid grid-cols-3 gap-2">
        {RISK_CATEGORIES.map((cat) => {
          const intensity = getFactorIntensity(
            assessment.factors,
            cat.key
          );
          return (
            <div
              key={cat.key}
              className={cn(
                "flex flex-col items-center justify-center rounded-md border px-3 py-3 transition-colors",
                getHeatColor(intensity, assessment.riskLevel),
                getHeatBorder(intensity, assessment.riskLevel)
              )}
            >
              <span
                className={cn(
                  "font-mono text-[10px] font-semibold tracking-wider",
                  intensity > 0 ? "text-foreground" : "text-muted-foreground/50"
                )}
              >
                {cat.label.toUpperCase()}
              </span>
              <span
                className={cn(
                  "font-mono text-[9px]",
                  intensity > 0 ? "text-foreground/70" : "text-muted-foreground/30"
                )}
              >
                {intensity > 0 ? "FLAGGED" : "CLEAR"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Score bar */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-muted-foreground">
          0%
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              assessment.riskLevel === "Low"
                ? "bg-primary"
                : assessment.riskLevel === "Medium"
                  ? "bg-chart-2"
                  : "bg-destructive"
            )}
            style={{ width: `${Math.max(assessment.riskScore * 100, 3)}%` }}
          />
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          100%
        </span>
      </div>
    </div>
  );
}
