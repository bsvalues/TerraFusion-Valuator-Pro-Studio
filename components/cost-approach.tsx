"use client";

import { useState, useMemo } from "react";
import type { CostApproachInputs, CostApproachResult } from "@/lib/types";
import { calculateCostApproach } from "@/lib/engines";
import { HardHat, Hammer } from "lucide-react";

interface CostApproachProps {
  propertySquareFeet?: number;
  yearBuilt?: number;
  onValueChange?: (value: number) => void;
}

function getDefaultPhysicalDepreciation(yearBuilt?: number): number {
  if (!yearBuilt) return 0.15;
  const age = new Date().getFullYear() - yearBuilt;
  // Marshall & Swift: ~1% per year, max 80%
  return Math.min(age * 0.01, 0.8);
}

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString();
}
function pct(n: number) {
  return (n * 100).toFixed(1) + "%";
}

export function CostApproach({ propertySquareFeet, yearBuilt, onValueChange }: CostApproachProps) {
  const [inputs, setInputs] = useState<CostApproachInputs>({
    landValue: 75000,
    improvementType: "Residential",
    grossBuildingArea: propertySquareFeet ?? 1800,
    costPerSqFt: 175,
    entrepreneurialProfit: 0.10,
    physicalDepreciationPct: getDefaultPhysicalDepreciation(yearBuilt),
    functionalObsolescencePct: 0.0,
    externalObsolescencePct: 0.0,
    siteImprovements: 8000,
  });

  const set = <K extends keyof CostApproachInputs>(key: K, val: CostApproachInputs[K]) =>
    setInputs((p) => ({ ...p, [key]: val }));

  const result: CostApproachResult = useMemo(() => {
    const r = calculateCostApproach(inputs);
    onValueChange?.(r.indicatedValueCostApproach);
    return r;
  }, [inputs]);

  const inputCls =
    "w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary";
  const labelCls = "font-mono text-[10px] tracking-wider text-muted-foreground";
  const rowCls = "flex items-center justify-between py-1.5 border-b border-border/30";
  const totalRowCls = "flex items-center justify-between py-2 border-t-2 border-primary/30 mt-1";

  const totalDepreciationPct =
    inputs.physicalDepreciationPct +
    inputs.functionalObsolescencePct +
    inputs.externalObsolescencePct;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <HardHat className="h-4 w-4 text-primary" />
        <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground">
          COST APPROACH
        </h3>
        <span className="ml-auto rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
          USPAP SR 1-4(c)
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Inputs ── */}
        <div>
          <p className="mb-3 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground">
            COST APPROACH INPUTS
          </p>

          {/* Land Value */}
          <div className="mb-3 rounded border border-border/50 bg-background/50 p-3">
            <p className="mb-2 font-mono text-[9px] tracking-widest text-primary">LAND VALUATION</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>LAND VALUE (AS IF VACANT)</label>
                <input type="number" min={0} value={inputs.landValue}
                  onChange={(e) => set("landValue", Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>SITE IMPROVEMENTS</label>
                <input type="number" min={0} value={inputs.siteImprovements ?? 0}
                  onChange={(e) => set("siteImprovements", Number(e.target.value))} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Replacement Cost New */}
          <div className="mb-3 rounded border border-border/50 bg-background/50 p-3">
            <p className="mb-2 font-mono text-[9px] tracking-widest text-primary">REPLACEMENT COST NEW (RCN)</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>IMPROVEMENT TYPE</label>
                <select value={inputs.improvementType}
                  onChange={(e) => set("improvementType", e.target.value as CostApproachInputs["improvementType"])}
                  className={inputCls}>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>GBA (SQFT)</label>
                <input type="number" min={1} value={inputs.grossBuildingArea}
                  onChange={(e) => set("grossBuildingArea", Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>COST PER SQFT ($)</label>
                <input type="number" min={1} step={5} value={inputs.costPerSqFt}
                  onChange={(e) => set("costPerSqFt", Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>ENTREPRENEURIAL PROFIT (%)</label>
                <input type="number" min={0} max={50} step={1}
                  value={(inputs.entrepreneurialProfit * 100).toFixed(0)}
                  onChange={(e) => set("entrepreneurialProfit", Number(e.target.value) / 100)} className={inputCls} />
              </div>
            </div>
            <div className="mt-2 rounded bg-primary/5 px-3 py-2 flex justify-between">
              <span className={labelCls}>RCN (incl. profit)</span>
              <span className="font-mono text-xs font-semibold text-primary">
                {fmt(result.replacementCostNew + result.entrepreneurialProfit)}
              </span>
            </div>
          </div>

          {/* Depreciation */}
          <div className="mb-3 rounded border border-border/50 bg-background/50 p-3">
            <p className="mb-2 font-mono text-[9px] tracking-widest text-primary">ACCRUED DEPRECIATION</p>
            {yearBuilt && (
              <p className="mb-2 font-mono text-[9px] text-muted-foreground">
                Effective Age: {new Date().getFullYear() - yearBuilt} years
              </p>
            )}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between mb-1">
                  <label className={labelCls}>PHYSICAL DEPRECIATION (%)</label>
                  <span className="font-mono text-[10px] text-muted-foreground">{pct(inputs.physicalDepreciationPct)}</span>
                </div>
                <input type="range" min={0} max={80} step={1}
                  value={(inputs.physicalDepreciationPct * 100).toFixed(0)}
                  onChange={(e) => set("physicalDepreciationPct", Number(e.target.value) / 100)}
                  className="w-full accent-primary" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className={labelCls}>FUNCTIONAL OBSOLESCENCE (%)</label>
                  <span className="font-mono text-[10px] text-muted-foreground">{pct(inputs.functionalObsolescencePct)}</span>
                </div>
                <input type="range" min={0} max={50} step={1}
                  value={(inputs.functionalObsolescencePct * 100).toFixed(0)}
                  onChange={(e) => set("functionalObsolescencePct", Number(e.target.value) / 100)}
                  className="w-full accent-primary" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className={labelCls}>EXTERNAL OBSOLESCENCE (%)</label>
                  <span className="font-mono text-[10px] text-muted-foreground">{pct(inputs.externalObsolescencePct)}</span>
                </div>
                <input type="range" min={0} max={50} step={1}
                  value={(inputs.externalObsolescencePct * 100).toFixed(0)}
                  onChange={(e) => set("externalObsolescencePct", Number(e.target.value) / 100)}
                  className="w-full accent-primary" />
              </div>
              <div className="flex justify-between pt-1 border-t border-border/30">
                <span className={labelCls}>TOTAL DEPRECIATION</span>
                <span className={`font-mono text-xs font-semibold ${totalDepreciationPct > 0.5 ? "text-red-400" : "text-yellow-400"}`}>
                  {pct(totalDepreciationPct)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Results ── */}
        <div>
          <p className="mb-3 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground">
            COST APPROACH SUMMARY
          </p>

          <div className="rounded border border-border/50 bg-background/50 p-4 space-y-0">
            <div className={rowCls}>
              <span className="font-mono text-[11px] text-muted-foreground">Replacement Cost New (RCN)</span>
              <span className="font-mono text-[11px] text-foreground">{fmt(result.replacementCostNew)}</span>
            </div>
            <div className={rowCls}>
              <span className="font-mono text-[11px] text-muted-foreground pl-4">+ Entrepreneurial Profit</span>
              <span className="font-mono text-[11px] text-foreground">{fmt(result.entrepreneurialProfit)}</span>
            </div>
            <div className={`${rowCls} font-semibold`}>
              <span className="font-mono text-[11px] text-foreground">RCN + Profit</span>
              <span className="font-mono text-[11px] text-foreground">{fmt(result.replacementCostNew + result.entrepreneurialProfit)}</span>
            </div>

            <div className="mt-2">
              <div className={rowCls}>
                <span className="font-mono text-[11px] text-muted-foreground pl-4">Physical Depreciation</span>
                <span className="font-mono text-[11px] text-red-400">({fmt(result.physicalDepreciation)})</span>
              </div>
              <div className={rowCls}>
                <span className="font-mono text-[11px] text-muted-foreground pl-4">Functional Obsolescence</span>
                <span className="font-mono text-[11px] text-red-400">({fmt(result.functionalObsolescence)})</span>
              </div>
              <div className={rowCls}>
                <span className="font-mono text-[11px] text-muted-foreground pl-4">External Obsolescence</span>
                <span className="font-mono text-[11px] text-red-400">({fmt(result.externalObsolescence)})</span>
              </div>
              <div className={rowCls}>
                <span className="font-mono text-[11px] text-muted-foreground">Total Accrued Depreciation</span>
                <span className="font-mono text-[11px] text-red-400">({fmt(result.totalDepreciation)})</span>
              </div>
            </div>

            <div className={totalRowCls}>
              <span className="font-mono text-[11px] font-semibold text-foreground">Depreciated Improvement Value</span>
              <span className="font-mono text-[11px] font-semibold text-foreground">{fmt(result.depreciatedImprovementValue)}</span>
            </div>

            <div className={rowCls}>
              <span className="font-mono text-[11px] text-muted-foreground">+ Land Value (as if vacant)</span>
              <span className="font-mono text-[11px] text-foreground">{fmt(result.landValue)}</span>
            </div>
            <div className={rowCls}>
              <span className="font-mono text-[11px] text-muted-foreground">+ Site Improvements</span>
              <span className="font-mono text-[11px] text-foreground">{fmt(result.siteImprovements)}</span>
            </div>

            {/* Indicated Value */}
            <div className="mt-4 rounded-lg border-2 border-primary/40 bg-primary/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] tracking-wider text-primary">INDICATED VALUE — COST APPROACH</p>
                  <p className="font-mono text-[9px] text-muted-foreground mt-0.5">
                    Depreciated Improvements + Land + Site Improvements
                  </p>
                </div>
                <p className="font-mono text-xl font-bold text-primary">{fmt(result.indicatedValueCostApproach)}</p>
              </div>
            </div>

            {/* Cost breakdown bar */}
            <div className="mt-4">
              <p className={`${labelCls} mb-2`}>VALUE COMPOSITION</p>
              <div className="flex h-4 rounded overflow-hidden">
                <div
                  className="bg-primary/70"
                  style={{ width: `${(result.landValue / result.indicatedValueCostApproach) * 100}%` }}
                  title="Land Value"
                />
                <div
                  className="bg-chart-2/70"
                  style={{ width: `${(result.depreciatedImprovementValue / result.indicatedValueCostApproach) * 100}%` }}
                  title="Improvements"
                />
                <div
                  className="bg-chart-3/70"
                  style={{ width: `${(result.siteImprovements / result.indicatedValueCostApproach) * 100}%` }}
                  title="Site Improvements"
                />
              </div>
              <div className="flex gap-4 mt-1">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-primary/70" />
                  <span className="font-mono text-[9px] text-muted-foreground">Land</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-chart-2/70" />
                  <span className="font-mono text-[9px] text-muted-foreground">Improvements</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-chart-3/70" />
                  <span className="font-mono text-[9px] text-muted-foreground">Site Impr.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
