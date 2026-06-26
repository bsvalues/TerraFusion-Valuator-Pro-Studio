"use client";

import { useState } from "react";
import { Scale, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";

interface ApproachValue {
  approach: "sales_comparison" | "income" | "cost";
  label: string;
  indicatedValue: number | null;
  weight: number;
  applicable: boolean;
  rationale: string;
}

interface ValueReconciliationProps {
  salesCompValue?: number;
  incomeValue?: number;
  costValue?: number;
  propertyType?: string;
  onFinalValueChange?: (value: number) => void;
}

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

const APPROACH_RATIONALE: Record<string, { sales: string; income: string; cost: string }> = {
  single_family: {
    sales: "Primary approach for residential properties. Most reliable indicator of market value for owner-occupied housing.",
    income: "Given secondary consideration. Single-family homes are typically owner-occupied and not primarily valued on income.",
    cost: "Considered but given less weight in established markets. Most applicable for new construction or unique properties.",
  },
  condo: {
    sales: "Primary approach. Condo market is data-rich and sales comparison is most reliable.",
    income: "Secondary consideration for investor-owned units. Rental market data may be limited.",
    cost: "Limited applicability. Difficult to allocate land value in condominium projects.",
  },
  office: {
    sales: "Secondary approach. Sales data for commercial properties can be limited.",
    income: "Primary approach for income-producing commercial properties. Investors make decisions based on income potential.",
    cost: "Considered for newer properties or special-use buildings where income data is limited.",
  },
  retail: {
    sales: "Secondary approach. Supports income approach conclusion.",
    income: "Primary approach. Retail properties are valued based on their income-generating capacity.",
    cost: "Considered for newer retail construction. Less reliable for established properties.",
  },
  industrial: {
    sales: "Co-primary approach. Industrial sales data is often available.",
    income: "Co-primary approach. Industrial properties are frequently investment grade.",
    cost: "Considered, particularly for specialized industrial improvements.",
  },
};

export function ValueReconciliation({
  salesCompValue,
  incomeValue,
  costValue,
  propertyType = "single_family",
  onFinalValueChange,
}: ValueReconciliationProps) {
  const rationale = APPROACH_RATIONALE[propertyType] ?? APPROACH_RATIONALE["single_family"];

  const [approaches, setApproaches] = useState<ApproachValue[]>([
    {
      approach: "sales_comparison",
      label: "Sales Comparison Approach",
      indicatedValue: salesCompValue ?? null,
      weight: propertyType === "single_family" || propertyType === "condo" ? 0.70 : 0.30,
      applicable: true,
      rationale: rationale.sales,
    },
    {
      approach: "income",
      label: "Income Capitalization Approach",
      indicatedValue: incomeValue ?? null,
      weight: ["office", "retail", "industrial", "multi_family_5plus"].includes(propertyType) ? 0.50 : 0.15,
      applicable: ["office", "retail", "industrial", "multi_family_5plus", "multi_family_2_4", "hospitality"].includes(propertyType),
      rationale: rationale.income,
    },
    {
      approach: "cost",
      label: "Cost Approach",
      indicatedValue: costValue ?? null,
      weight: 0.15,
      applicable: true,
      rationale: rationale.cost,
    },
  ]);

  const [finalValue, setFinalValue] = useState<number | null>(null);
  const [reconciliationNarrative, setReconciliationNarrative] = useState("");

  const setWeight = (approach: string, weight: number) => {
    setApproaches((prev) => prev.map((a) => a.approach === approach ? { ...a, weight } : a));
  };

  const setApplicable = (approach: string, applicable: boolean) => {
    setApproaches((prev) => prev.map((a) => a.approach === approach ? { ...a, applicable } : a));
  };

  const setIndicatedValue = (approach: string, value: number | null) => {
    setApproaches((prev) => prev.map((a) => a.approach === approach ? { ...a, indicatedValue: value } : a));
  };

  const applicableApproaches = approaches.filter((a) => a.applicable && a.indicatedValue !== null);
  const totalWeight = applicableApproaches.reduce((s, a) => s + a.weight, 0);

  const weightedValue = totalWeight > 0
    ? Math.round(applicableApproaches.reduce((s, a) => s + (a.indicatedValue! * (a.weight / totalWeight)), 0))
    : null;

  const weightsPctOk = Math.abs(totalWeight - 1.0) < 0.001;

  const handleSetFinal = () => {
    const val = finalValue ?? weightedValue;
    if (val) onFinalValueChange?.(val);
  };

  const inputCls = "w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary";
  const labelCls = "font-mono text-[10px] tracking-wider text-muted-foreground";

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Scale className="h-4 w-4 text-primary" />
        <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground">
          VALUE RECONCILIATION
        </h3>
        <span className="ml-auto rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
          USPAP SR 1-6
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left: Approach Weights */}
        <div>
          <p className="mb-3 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground">
            APPROACH WEIGHTING
          </p>

          {approaches.map((a) => (
            <div key={a.approach} className={`mb-3 rounded border p-3 transition-colors ${
              a.applicable ? "border-border/50 bg-background/50" : "border-border/20 bg-background/20 opacity-50"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={a.applicable}
                    onChange={(e) => setApplicable(a.approach, e.target.checked)}
                    className="accent-primary"
                  />
                  <span className="font-mono text-[11px] font-semibold text-foreground">{a.label}</span>
                </div>
                {a.applicable && (
                  <span className="font-mono text-[10px] text-primary font-bold">
                    {(a.weight * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              {a.applicable && (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className={labelCls}>INDICATED VALUE</label>
                      <input
                        type="number" min={0}
                        value={a.indicatedValue ?? ""}
                        onChange={(e) => setIndicatedValue(a.approach, e.target.value ? Number(e.target.value) : null)}
                        className={inputCls}
                        placeholder="Enter value..."
                      />
                    </div>
                    <div>
                      <label className={labelCls}>WEIGHT (%)</label>
                      <input
                        type="number" min={0} max={100} step={5}
                        value={(a.weight * 100).toFixed(0)}
                        onChange={(e) => setWeight(a.approach, Number(e.target.value) / 100)}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div className="mt-1">
                    <div className="h-1.5 rounded-full bg-border/30 overflow-hidden">
                      <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${a.weight * 100}%` }} />
                    </div>
                  </div>
                  <p className="mt-1.5 font-mono text-[9px] text-muted-foreground/70 leading-relaxed">{a.rationale}</p>
                </>
              )}
            </div>
          ))}

          {!weightsPctOk && applicableApproaches.length > 0 && (
            <div className="flex items-center gap-2 rounded border border-yellow-500/30 bg-yellow-500/5 px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
              <p className="font-mono text-[10px] text-yellow-500">
                Weights total {(totalWeight * 100).toFixed(0)}% — must equal 100%
              </p>
            </div>
          )}
        </div>

        {/* Right: Reconciliation Summary */}
        <div>
          <p className="mb-3 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground">
            RECONCILIATION SUMMARY
          </p>

          {/* Value Range */}
          {applicableApproaches.length > 0 && (
            <div className="mb-4 rounded border border-border/50 bg-background/50 p-3">
              <p className="mb-2 font-mono text-[9px] tracking-widest text-muted-foreground">INDICATED VALUE RANGE</p>
              <div className="space-y-1.5">
                {applicableApproaches.map((a) => (
                  <div key={a.approach} className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground">{a.label}</span>
                    <span className="font-mono text-[11px] text-foreground">
                      {a.indicatedValue ? fmt(a.indicatedValue) : "—"}
                    </span>
                  </div>
                ))}
              </div>
              {applicableApproaches.length > 1 && applicableApproaches.every((a) => a.indicatedValue) && (
                <div className="mt-2 pt-2 border-t border-border/30">
                  <div className="flex justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground">Range</span>
                    <span className="font-mono text-[10px] text-foreground">
                      {fmt(Math.min(...applicableApproaches.map((a) => a.indicatedValue!)))} —{" "}
                      {fmt(Math.max(...applicableApproaches.map((a) => a.indicatedValue!)))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Weighted Value */}
          {weightedValue && weightsPctOk && (
            <div className="mb-4 rounded border border-primary/20 bg-primary/5 p-3">
              <p className="mb-1 font-mono text-[9px] tracking-widest text-primary">WEIGHTED AVERAGE</p>
              <p className="font-mono text-2xl font-bold text-primary">{fmt(weightedValue)}</p>
              <p className="font-mono text-[9px] text-muted-foreground mt-1">
                Based on appraiser-assigned weights
              </p>
            </div>
          )}

          {/* Final Opinion of Value */}
          <div className="mb-4 rounded border border-primary/30 bg-primary/5 p-3">
            <p className="mb-2 font-mono text-[9px] tracking-widest text-primary">FINAL OPINION OF VALUE</p>
            <p className="mb-2 font-mono text-[9px] text-muted-foreground">
              Override weighted average with appraiser&apos;s final judgment (round to nearest $500)
            </p>
            <div className="flex gap-2">
              <input
                type="number" min={0} step={500}
                placeholder={weightedValue ? String(Math.round(weightedValue / 500) * 500) : "Enter final value..."}
                value={finalValue ?? ""}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : null;
                  setFinalValue(v);
                  if (v) onFinalValueChange?.(v);
                }}
                className="flex-1 rounded border border-primary/30 bg-background px-3 py-2 font-mono text-sm font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {weightedValue && !finalValue && (
                <button
                  onClick={() => {
                    const rounded = Math.round(weightedValue / 500) * 500;
                    setFinalValue(rounded);
                    onFinalValueChange?.(rounded);
                  }}
                  className="rounded border border-primary/30 px-3 py-2 font-mono text-[10px] text-primary hover:bg-primary/10"
                >
                  USE WEIGHTED
                </button>
              )}
            </div>
          </div>

          {/* Narrative */}
          <div className="mb-4">
            <label className={labelCls}>RECONCILIATION NARRATIVE (USPAP SR 1-6)</label>
            <textarea
              rows={4}
              value={reconciliationNarrative}
              onChange={(e) => setReconciliationNarrative(e.target.value)}
              placeholder="The appraiser has considered the three approaches to value. The Sales Comparison Approach is given primary weight as it best reflects the actions of buyers and sellers in the subject market area..."
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Final Value Display */}
          {(finalValue || weightedValue) && (
            <div className="rounded-lg border-2 border-primary/40 bg-primary/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] tracking-wider text-primary">MARKET VALUE OPINION</p>
                  <p className="font-mono text-[9px] text-muted-foreground mt-0.5">As of effective date of appraisal</p>
                </div>
                <p className="font-mono text-2xl font-bold text-primary">
                  {fmt(finalValue ?? Math.round((weightedValue ?? 0) / 500) * 500)}
                </p>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                <p className="font-mono text-[10px] text-emerald-400">
                  USPAP SR 1-6 reconciliation complete
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
