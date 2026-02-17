import { cn } from "@/lib/utils";
import type { RiskAssessment, RiskLevel } from "@/lib/types";
import { ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";

const riskConfig: Record<
  RiskLevel,
  { color: string; bgColor: string; Icon: typeof ShieldCheck }
> = {
  Low: { color: "text-primary", bgColor: "bg-primary/10", Icon: ShieldCheck },
  Medium: {
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
    Icon: ShieldAlert,
  },
  High: {
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    Icon: ShieldX,
  },
};

interface RiskGaugeProps {
  assessment: RiskAssessment;
}

export function RiskGauge({ assessment }: RiskGaugeProps) {
  const config = riskConfig[assessment.riskLevel];
  const scorePct = Math.round(assessment.riskScore * 100);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <config.Icon className={cn("h-4 w-4", config.color)} />
        <h4 className="font-mono text-xs font-medium tracking-wider text-foreground">
          RISK ASSESSMENT
        </h4>
      </div>

      {/* Risk Level Badge */}
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "rounded-md px-3 py-1.5 font-mono text-xs font-bold tracking-wider",
            config.bgColor,
            config.color
          )}
        >
          {assessment.riskLevel.toUpperCase()} RISK
        </span>
        <span className="font-mono text-lg font-bold text-foreground">
          {scorePct}%
        </span>
      </div>

      {/* Risk bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            assessment.riskLevel === "Low"
              ? "bg-primary"
              : assessment.riskLevel === "Medium"
                ? "bg-chart-2"
                : "bg-destructive"
          )}
          style={{ width: `${Math.max(scorePct, 5)}%` }}
        />
      </div>

      {/* Factors */}
      <div className="flex flex-col gap-1.5 border-t border-border pt-3">
        <p className="font-mono text-[10px] text-muted-foreground">
          RISK FACTORS
        </p>
        <ul className="flex flex-col gap-1">
          {assessment.factors.map((factor, i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-xs text-foreground/80"
            >
              <span className="h-1 w-1 rounded-full bg-muted-foreground" />
              {factor}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
