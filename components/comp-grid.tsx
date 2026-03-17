"use client";

import { useState } from "react";
import type { ComparableSale } from "@/lib/types";
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Minus,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface CompGridProps {
  comps: ComparableSale[];
  subjectValue?: number;
}

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

function adjColor(amt: number) {
  if (amt > 0) return "text-emerald-400";
  if (amt < 0) return "text-red-400";
  return "text-muted-foreground";
}

function grossAdjColor(pct: number) {
  if (pct > 25) return "text-red-400";
  if (pct > 15) return "text-yellow-400";
  return "text-emerald-400";
}

export function CompGrid({ comps, subjectValue }: CompGridProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"distance" | "saleDate" | "adjustedPrice" | "grossAdjustmentPct">("distance");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = [...comps].sort((a, b) => {
    let av: number = typeof a[sortBy] === "string"
      ? new Date(a[sortBy] as string).getTime()
      : (a[sortBy] as number);
    let bv: number = typeof b[sortBy] === "string"
      ? new Date(b[sortBy] as string).getTime()
      : (b[sortBy] as number);
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("asc"); }
  };

  const avgAdjusted = comps.length > 0
    ? Math.round(comps.reduce((s, c) => s + c.adjustedPrice, 0) / comps.length)
    : 0;
  const avgGrossAdj = comps.length > 0
    ? comps.reduce((s, c) => s + c.grossAdjustmentPct, 0) / comps.length
    : 0;

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col
      ? sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      : <Minus className="h-3 w-3 opacity-30" />;

  if (comps.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground">
            SALES COMPARISON APPROACH — ADJUSTMENT GRID
          </h3>
        </div>
        <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
          USPAP SR 1-4(a)
        </span>
      </div>

      {/* Summary */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded border border-border/50 bg-background/50 p-2 text-center">
          <p className="font-mono text-[9px] tracking-wider text-muted-foreground">COMPS ANALYZED</p>
          <p className="font-mono text-lg font-bold text-foreground">{comps.length}</p>
        </div>
        <div className="rounded border border-border/50 bg-background/50 p-2 text-center">
          <p className="font-mono text-[9px] tracking-wider text-muted-foreground">AVG ADJUSTED</p>
          <p className="font-mono text-sm font-bold text-primary">{fmt(avgAdjusted)}</p>
        </div>
        <div className="rounded border border-border/50 bg-background/50 p-2 text-center">
          <p className="font-mono text-[9px] tracking-wider text-muted-foreground">AVG GROSS ADJ</p>
          <p className={`font-mono text-sm font-bold ${grossAdjColor(avgGrossAdj)}`}>
            {avgGrossAdj.toFixed(1)}%
          </p>
        </div>
        {subjectValue && (
          <div className="rounded border border-border/50 bg-background/50 p-2 text-center">
            <p className="font-mono text-[9px] tracking-wider text-muted-foreground">RECONCILED VALUE</p>
            <p className="font-mono text-sm font-bold text-primary">{fmt(subjectValue)}</p>
          </div>
        )}
      </div>

      {/* FNMA Guideline Note */}
      <div className="mb-4 flex items-center gap-2 rounded border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
        <AlertCircle className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
        <p className="font-mono text-[10px] text-yellow-500/80">
          FNMA Guidelines: Net adj. &lt;15% | Gross adj. &lt;25% per comp. Comps exceeding thresholds require additional explanation.
        </p>
      </div>

      {/* Sort Controls */}
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="font-mono text-[10px] text-muted-foreground self-center">SORT BY:</span>
        {(["distance", "saleDate", "adjustedPrice", "grossAdjustmentPct"] as const).map((col) => (
          <button key={col} onClick={() => toggleSort(col)}
            className={`flex items-center gap-1 rounded px-2 py-1 font-mono text-[10px] transition-colors ${
              sortBy === col ? "bg-primary/20 text-primary" : "bg-background text-muted-foreground hover:text-foreground"
            }`}>
            {col === "distance" ? "DISTANCE" :
             col === "saleDate" ? "SALE DATE" :
             col === "adjustedPrice" ? "ADJ. PRICE" : "GROSS ADJ."}
            <SortIcon col={col} />
          </button>
        ))}
      </div>

      {/* Comp Cards */}
      <div className="space-y-2">
        {sorted.map((comp, idx) => {
          const isExpanded = expanded === comp.id;
          const netAdjOk = Math.abs(comp.netAdjustmentPct) <= 15;
          const grossAdjOk = comp.grossAdjustmentPct <= 25;
          const totalAdj = comp.adjustments.reduce((s, a) => s + a.dollarAmount, 0);

          return (
            <div key={comp.id} className={`rounded-lg border transition-colors ${
              isExpanded ? "border-primary/40 bg-primary/5" : "border-border/50 bg-background/30 hover:border-border"
            }`}>
              <button
                onClick={() => setExpanded(isExpanded ? null : comp.id)}
                className="w-full px-4 py-3 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                      C{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-medium text-foreground truncate">{comp.address}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {comp.city}, {comp.state} · {comp.distance}mi · {comp.saleDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="font-mono text-[10px] text-muted-foreground">SALE PRICE</p>
                      <p className="font-mono text-xs text-foreground">{fmt(comp.salePrice)}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="font-mono text-[10px] text-muted-foreground">NET ADJ.</p>
                      <p className={`font-mono text-xs font-semibold ${adjColor(totalAdj)}`}>
                        {totalAdj >= 0 ? "+" : ""}{fmt(totalAdj)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[10px] text-muted-foreground">ADJ. PRICE</p>
                      <p className="font-mono text-sm font-bold text-primary">{fmt(comp.adjustedPrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[10px] text-muted-foreground">GROSS ADJ.</p>
                      <p className={`font-mono text-xs font-semibold ${grossAdjColor(comp.grossAdjustmentPct)}`}>
                        {comp.grossAdjustmentPct.toFixed(1)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {netAdjOk && grossAdjOk
                        ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        : <AlertCircle className="h-3.5 w-3.5 text-yellow-400" />
                      }
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border/30 px-4 pb-4 pt-3">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
                    <div>
                      <p className="font-mono text-[9px] tracking-wider text-muted-foreground">SQFT</p>
                      <p className="font-mono text-xs text-foreground">{comp.squareFeet.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] tracking-wider text-muted-foreground">$/SQFT</p>
                      <p className="font-mono text-xs text-foreground">{fmt(comp.pricePerSqFt)}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] tracking-wider text-muted-foreground">CONDITION</p>
                      <p className="font-mono text-xs text-foreground">{comp.condition}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] tracking-wider text-muted-foreground">SALE TYPE</p>
                      <p className="font-mono text-xs text-foreground">{comp.saleCondition}</p>
                    </div>
                    {comp.bedrooms && (
                      <div>
                        <p className="font-mono text-[9px] tracking-wider text-muted-foreground">BEDS/BATHS</p>
                        <p className="font-mono text-xs text-foreground">{comp.bedrooms}/{comp.bathrooms}</p>
                      </div>
                    )}
                    <div>
                      <p className="font-mono text-[9px] tracking-wider text-muted-foreground">FINANCING</p>
                      <p className="font-mono text-xs text-foreground">{comp.financingType}</p>
                    </div>
                    {comp.daysOnMarket && (
                      <div>
                        <p className="font-mono text-[9px] tracking-wider text-muted-foreground">DOM</p>
                        <p className="font-mono text-xs text-foreground">{comp.daysOnMarket} days</p>
                      </div>
                    )}
                    {comp.yearBuilt && (
                      <div>
                        <p className="font-mono text-[9px] tracking-wider text-muted-foreground">YEAR BUILT</p>
                        <p className="font-mono text-xs text-foreground">{comp.yearBuilt}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="mb-2 font-mono text-[9px] tracking-widest text-primary">ADJUSTMENT DETAIL</p>
                    <div className="rounded border border-border/30 overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-background/50">
                            <th className="px-3 py-1.5 text-left font-mono text-[9px] tracking-wider text-muted-foreground">CATEGORY</th>
                            <th className="px-3 py-1.5 text-left font-mono text-[9px] tracking-wider text-muted-foreground">DESCRIPTION</th>
                            <th className="px-3 py-1.5 text-right font-mono text-[9px] tracking-wider text-muted-foreground">ADJUSTMENT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comp.adjustments.map((adj, i) => (
                            <tr key={i} className="border-t border-border/20">
                              <td className="px-3 py-1.5 font-mono text-[10px] text-muted-foreground capitalize">
                                {adj.category.replace(/_/g, " ")}
                              </td>
                              <td className="px-3 py-1.5 font-mono text-[10px] text-foreground/80">{adj.description}</td>
                              <td className={`px-3 py-1.5 text-right font-mono text-[10px] font-semibold ${adjColor(adj.dollarAmount)}`}>
                                {adj.dollarAmount >= 0 ? "+" : ""}{fmt(adj.dollarAmount)}
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-primary/20 bg-primary/5">
                            <td colSpan={2} className="px-3 py-2 font-mono text-[10px] font-bold text-foreground">
                              NET ADJUSTMENT
                            </td>
                            <td className={`px-3 py-2 text-right font-mono text-[10px] font-bold ${adjColor(totalAdj)}`}>
                              {totalAdj >= 0 ? "+" : ""}{fmt(totalAdj)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded border border-primary/20 bg-primary/5 px-4 py-2">
                      <div>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {fmt(comp.salePrice)} + ({fmt(totalAdj)}) = Adjusted Price
                        </p>
                        <div className="flex gap-4 mt-0.5">
                          <p className={`font-mono text-[9px] ${netAdjOk ? "text-emerald-400" : "text-yellow-400"}`}>
                            Net: {comp.netAdjustmentPct.toFixed(1)}% {netAdjOk ? "✓" : "⚠"}
                          </p>
                          <p className={`font-mono text-[9px] ${grossAdjOk ? "text-emerald-400" : "text-yellow-400"}`}>
                            Gross: {comp.grossAdjustmentPct.toFixed(1)}% {grossAdjOk ? "✓" : "⚠"}
                          </p>
                        </div>
                      </div>
                      <p className="font-mono text-base font-bold text-primary">{fmt(comp.adjustedPrice)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {comps.length > 0 && (
        <div className="mt-4 rounded border border-border/30 bg-background/30 p-3">
          <p className="font-mono text-[9px] tracking-widest text-muted-foreground mb-1">RECONCILIATION NOTE</p>
          <p className="font-mono text-[10px] text-foreground/70 leading-relaxed">
            The adjusted sale prices range from {fmt(Math.min(...comps.map(c => c.adjustedPrice)))} to{" "}
            {fmt(Math.max(...comps.map(c => c.adjustedPrice)))}. Comps with the lowest gross adjustment
            percentages are given the most weight as they require fewer adjustments and are therefore more
            reliable indicators of value. The reconciled value of{" "}
            {subjectValue ? fmt(subjectValue) : "N/A"} reflects the appraiser&apos;s opinion of market value
            as of the effective date of appraisal.
          </p>
        </div>
      )}
    </div>
  );
}
