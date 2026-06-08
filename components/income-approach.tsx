"use client";

import { useState, useMemo } from "react";
import type { IncomeApproachInputs, IncomeApproachResult } from "@/lib/types";
import { calculateIncomeApproach } from "@/lib/engines";
import { TrendingUp, DollarSign, Percent, Calculator } from "lucide-react";

interface IncomeApproachProps {
  propertySquareFeet?: number;
  onValueChange?: (value: number) => void;
}

const DEFAULT_INPUTS: IncomeApproachInputs = {
  scheduledRentIncome: 120000,
  otherIncome: 5000,
  vacancyRate: 0.05,
  creditLossRate: 0.01,
  realEstateTaxes: 12000,
  insurance: 4000,
  utilities: 3000,
  management: 8400,
  maintenance: 6000,
  reserves: 4000,
  otherExpenses: 2000,
  capRate: 0.065,
  holdingPeriodYears: undefined,
  terminalCapRate: undefined,
  discountRate: undefined,
  annualRentGrowthRate: 0.02,
  annualExpenseGrowthRate: 0.02,
};

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString();
}
function pct(n: number) {
  return (n * 100).toFixed(2) + "%";
}

export function IncomeApproach({ propertySquareFeet, onValueChange }: IncomeApproachProps) {
  const [inputs, setInputs] = useState<IncomeApproachInputs>(DEFAULT_INPUTS);
  const [showDCF, setShowDCF] = useState(false);

  const set = <K extends keyof IncomeApproachInputs>(key: K, val: IncomeApproachInputs[K]) =>
    setInputs((p) => {
      const next = { ...p, [key]: val };
      return next;
    });

  const result: IncomeApproachResult = useMemo(() => {
    const r = calculateIncomeApproach(inputs);
    onValueChange?.(r.reconciledIncomeValue);
    return r;
  }, [inputs]);

  const inputCls =
    "w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary";
  const labelCls = "font-mono text-[10px] tracking-wider text-muted-foreground";
  const rowCls = "flex items-center justify-between py-1.5 border-b border-border/30";
  const totalRowCls = "flex items-center justify-between py-2 border-t-2 border-primary/30 mt-1";

  const riskColor =
    result.expenseRatio < 0.35 ? "text-cyan-400" :
    result.expenseRatio < 0.5  ? "text-yellow-400" : "text-red-400";

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground">
          INCOME CAPITALIZATION APPROACH
        </h3>
        <span className="ml-auto rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
          USPAP SR 1-4(b)
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Inputs ── */}
        <div>
          <p className="mb-3 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground">
            INCOME & EXPENSE INPUTS
          </p>

          {/* PGI */}
          <div className="mb-3 rounded border border-border/50 bg-background/50 p-3">
            <p className="mb-2 font-mono text-[9px] tracking-widest text-primary">POTENTIAL GROSS INCOME</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>SCHEDULED RENT</label>
                <input type="number" min={0} value={inputs.scheduledRentIncome}
                  onChange={(e) => set("scheduledRentIncome", Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>OTHER INCOME</label>
                <input type="number" min={0} value={inputs.otherIncome}
                  onChange={(e) => set("otherIncome", Number(e.target.value))} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Vacancy */}
          <div className="mb-3 rounded border border-border/50 bg-background/50 p-3">
            <p className="mb-2 font-mono text-[9px] tracking-widest text-primary">VACANCY & CREDIT LOSS</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>VACANCY RATE (%)</label>
                <input type="number" min={0} max={100} step={0.5}
                  value={(inputs.vacancyRate * 100).toFixed(1)}
                  onChange={(e) => set("vacancyRate", Number(e.target.value) / 100)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>CREDIT LOSS (%)</label>
                <input type="number" min={0} max={100} step={0.5}
                  value={(inputs.creditLossRate * 100).toFixed(1)}
                  onChange={(e) => set("creditLossRate", Number(e.target.value) / 100)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Operating Expenses */}
          <div className="mb-3 rounded border border-border/50 bg-background/50 p-3">
            <p className="mb-2 font-mono text-[9px] tracking-widest text-primary">OPERATING EXPENSES</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "realEstateTaxes", label: "RE TAXES" },
                { key: "insurance",       label: "INSURANCE" },
                { key: "utilities",       label: "UTILITIES" },
                { key: "management",      label: "MANAGEMENT" },
                { key: "maintenance",     label: "MAINTENANCE" },
                { key: "reserves",        label: "RESERVES" },
                { key: "otherExpenses",   label: "OTHER" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input type="number" min={0}
                    value={(inputs as unknown as Record<string, number>)[key]}
                    onChange={(e) => set(key as keyof IncomeApproachInputs, Number(e.target.value) as never)}
                    className={inputCls} />
                </div>
              ))}
            </div>
          </div>

          {/* Capitalization */}
          <div className="mb-3 rounded border border-border/50 bg-background/50 p-3">
            <p className="mb-2 font-mono text-[9px] tracking-widest text-primary">CAPITALIZATION</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>OVERALL CAP RATE (%)</label>
                <input type="number" min={0.1} max={30} step={0.05}
                  value={(inputs.capRate * 100).toFixed(2)}
                  onChange={(e) => set("capRate", Number(e.target.value) / 100)} className={inputCls} />
              </div>
              {propertySquareFeet && (
                <div className="flex flex-col justify-end">
                  <p className={labelCls}>RENT / SQFT</p>
                  <p className="font-mono text-xs text-foreground">
                    ${(inputs.scheduledRentIncome / propertySquareFeet).toFixed(2)}/sqft/yr
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* DCF Toggle */}
          <button
            type="button"
            onClick={() => setShowDCF(!showDCF)}
            className="mb-3 w-full rounded border border-primary/30 bg-primary/5 px-3 py-2 font-mono text-[10px] tracking-wider text-primary hover:bg-primary/10 transition-colors"
          >
            {showDCF ? "▲ HIDE DCF ANALYSIS" : "▼ ADD DCF ANALYSIS (OPTIONAL)"}
          </button>

          {showDCF && (
            <div className="mb-3 rounded border border-primary/20 bg-primary/5 p-3">
              <p className="mb-2 font-mono text-[9px] tracking-widest text-primary">DISCOUNTED CASH FLOW</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>HOLDING PERIOD (YRS)</label>
                  <input type="number" min={1} max={30}
                    value={inputs.holdingPeriodYears ?? ""}
                    onChange={(e) => set("holdingPeriodYears", e.target.value ? Number(e.target.value) : undefined)}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>DISCOUNT RATE (%)</label>
                  <input type="number" min={0.1} max={30} step={0.25}
                    value={inputs.discountRate ? (inputs.discountRate * 100).toFixed(2) : ""}
                    onChange={(e) => set("discountRate", e.target.value ? Number(e.target.value) / 100 : undefined)}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>TERMINAL CAP RATE (%)</label>
                  <input type="number" min={0.1} max={30} step={0.05}
                    value={inputs.terminalCapRate ? (inputs.terminalCapRate * 100).toFixed(2) : ""}
                    onChange={(e) => set("terminalCapRate", e.target.value ? Number(e.target.value) / 100 : undefined)}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>RENT GROWTH/YR (%)</label>
                  <input type="number" min={-10} max={20} step={0.25}
                    value={((inputs.annualRentGrowthRate ?? 0.02) * 100).toFixed(2)}
                    onChange={(e) => set("annualRentGrowthRate", Number(e.target.value) / 100)}
                    className={inputCls} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Results ── */}
        <div>
          <p className="mb-3 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground">
            INCOME APPROACH SUMMARY
          </p>

          <div className="rounded border border-border/50 bg-background/50 p-4 space-y-0">
            {/* PGI */}
            <div className={rowCls}>
              <span className="font-mono text-[11px] text-muted-foreground">Potential Gross Income (PGI)</span>
              <span className="font-mono text-[11px] text-foreground">{fmt(result.potentialGrossIncome)}</span>
            </div>
            <div className={rowCls}>
              <span className="font-mono text-[11px] text-muted-foreground pl-4">
                Less: Vacancy & Credit Loss ({pct(inputs.vacancyRate + inputs.creditLossRate)})
              </span>
              <span className="font-mono text-[11px] text-red-400">
                ({fmt(result.potentialGrossIncome - result.effectiveGrossIncome)})
              </span>
            </div>
            <div className={`${rowCls} font-semibold`}>
              <span className="font-mono text-[11px] text-foreground">Effective Gross Income (EGI)</span>
              <span className="font-mono text-[11px] text-foreground">{fmt(result.effectiveGrossIncome)}</span>
            </div>

            {/* Expenses */}
            <div className={`${rowCls} mt-2`}>
              <span className="font-mono text-[11px] text-muted-foreground">Total Operating Expenses</span>
              <span className="font-mono text-[11px] text-red-400">({fmt(result.totalOperatingExpenses)})</span>
            </div>
            <div className={rowCls}>
              <span className="font-mono text-[11px] text-muted-foreground pl-4">Expense Ratio</span>
              <span className={`font-mono text-[11px] ${riskColor}`}>{pct(result.expenseRatio)}</span>
            </div>

            {/* NOI */}
            <div className={totalRowCls}>
              <span className="font-mono text-sm font-bold text-foreground">Net Operating Income (NOI)</span>
              <span className="font-mono text-sm font-bold text-primary">{fmt(result.netOperatingIncome)}</span>
            </div>

            {/* Direct Cap */}
            <div className="mt-4 rounded border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-wider text-primary">DIRECT CAPITALIZATION</span>
                <span className="font-mono text-[10px] text-muted-foreground">NOI ÷ Cap Rate</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {fmt(result.netOperatingIncome)} ÷ {pct(inputs.capRate)}
                </span>
                <span className="font-mono text-base font-bold text-primary">
                  {fmt(result.directCapValue)}
                </span>
              </div>
            </div>

            {/* DCF Results */}
            {result.dcfValue && (
              <div className="mt-3 rounded border border-chart-2/20 bg-chart-2/5 p-3">
                <p className="mb-2 font-mono text-[10px] tracking-wider text-chart-2">DISCOUNTED CASH FLOW</p>
                <div className={rowCls}>
                  <span className="font-mono text-[11px] text-muted-foreground">PV of Cash Flows</span>
                  <span className="font-mono text-[11px] text-foreground">{fmt(result.presentValueCashFlows ?? 0)}</span>
                </div>
                <div className={rowCls}>
                  <span className="font-mono text-[11px] text-muted-foreground">PV of Reversion</span>
                  <span className="font-mono text-[11px] text-foreground">{fmt(result.presentValueReversion ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-mono text-[11px] font-semibold text-foreground">DCF Value</span>
                  <span className="font-mono text-sm font-bold text-chart-2">{fmt(result.dcfValue)}</span>
                </div>
              </div>
            )}

            {/* Reconciled Income Value */}
            <div className="mt-4 rounded-lg border-2 border-primary/40 bg-primary/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] tracking-wider text-primary">RECONCILED INCOME VALUE</p>
                  <p className="font-mono text-[9px] text-muted-foreground mt-0.5">
                    {result.dcfValue ? "60% Direct Cap + 40% DCF" : "Direct Capitalization"}
                  </p>
                </div>
                <p className="font-mono text-xl font-bold text-primary">{fmt(result.reconciledIncomeValue)}</p>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded border border-border/50 bg-background/50 p-2 text-center">
                <p className={labelCls}>OVERALL CAP RATE</p>
                <p className="font-mono text-sm font-bold text-foreground">{pct(result.overallCapRate)}</p>
              </div>
              <div className="rounded border border-border/50 bg-background/50 p-2 text-center">
                <p className={labelCls}>GROSS RENT MULT.</p>
                <p className="font-mono text-sm font-bold text-foreground">{result.grossRentMultiplier.toFixed(2)}x</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
