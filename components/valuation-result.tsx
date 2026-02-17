import type { Valuation } from "@/lib/types";
import { DollarSign, Target } from "lucide-react";

interface ValuationResultProps {
  valuation: Valuation;
}

export function ValuationResult({ valuation }: ValuationResultProps) {
  const confidencePct = Math.round(valuation.confidenceLevel * 100);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-primary" />
        <h4 className="font-mono text-xs font-medium tracking-wider text-foreground">
          VALUATION RESULT
        </h4>
      </div>

      <div className="flex flex-col gap-1">
        <p className="font-mono text-[10px] text-muted-foreground">
          ESTIMATED VALUE
        </p>
        <p className="font-mono text-2xl font-bold text-primary">
          ${valuation.estimatedValue.toLocaleString()}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Target className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-[10px] text-muted-foreground">
            CONFIDENCE
          </span>
        </div>
        <div className="flex flex-1 items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <span className="font-mono text-xs font-semibold text-foreground">
            {confidencePct}%
          </span>
        </div>
      </div>

      <div className="border-t border-border pt-3">
        <p className="font-mono text-[10px] text-muted-foreground">
          {valuation.methodology}
        </p>
        <p className="font-mono text-[10px] text-muted-foreground/60">
          Property ID: {valuation.propertyId}
        </p>
      </div>
    </div>
  );
}
