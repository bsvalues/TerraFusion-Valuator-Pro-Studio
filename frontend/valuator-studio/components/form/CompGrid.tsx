"use client";

import { WorkfileComp, UadQuality, UadCondition, computeNetAdj, computeAdjSalePrice } from "@/lib/workfile-types";

interface Props {
  comparables: WorkfileComp[];
  onChange: (updated: WorkfileComp[]) => void;
}

const UAD_QUALITY: UadQuality[] = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"];
const UAD_CONDITION: UadCondition[] = ["C1", "C2", "C3", "C4", "C5", "C6"];

const inputCls =
  "h-7 w-full rounded border border-slate-300 bg-white px-1.5 text-xs text-slate-900 " +
  "focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100";
const selectCls = inputCls + " cursor-pointer";
const adjCls =
  "h-7 w-full rounded border border-slate-200 bg-white px-1.5 text-xs text-slate-700 text-right " +
  "focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-300";
const computedCls =
  "h-7 w-full rounded border border-slate-100 bg-slate-50 px-1.5 text-xs text-slate-500 text-right dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400";

function numOrNull(s: string): number | null {
  const n = parseFloat(s);
  return s === "" || isNaN(n) ? null : n;
}

function fmt(v: number | null): string {
  if (v === null) return "";
  return v >= 0 ? `+${v.toLocaleString()}` : v.toLocaleString();
}

interface AdjRowProps {
  label: string;
  compKey: keyof WorkfileComp;
  comp: WorkfileComp;
  onSet: (val: number | null) => void;
}

function AdjRow({ label, compKey, comp, onSet }: AdjRowProps) {
  const val = comp[compKey] as number | null;
  return (
    <input
      type="number"
      className={adjCls}
      title={label}
      placeholder={`${label} adj`}
      value={val ?? ""}
      onChange={(e) => onSet(numOrNull(e.target.value))}
    />
  );
}

export default function CompGrid({ comparables, onChange }: Props) {
  function setComp(idx: number, key: keyof WorkfileComp, value: unknown) {
    const updated = comparables.map((c, i) =>
      i === idx ? { ...c, [key]: value } : c
    );
    onChange(updated);
  }

  const COMP_LABELS = ["Comp 1", "Comp 2", "Comp 3"];

  function row(label: string, render: (comp: WorkfileComp, idx: number) => React.ReactNode) {
    return (
      <tr className="border-b border-slate-100 dark:border-slate-800">
        <td className="py-0.5 pr-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap w-28">
          {label}
        </td>
        {comparables.map((comp, idx) => (
          <td key={idx} className="py-0.5 px-1">
            {render(comp, idx)}
          </td>
        ))}
      </tr>
    );
  }

  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 overflow-x-auto">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-3 py-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">
          Sales Comparison — Comparables
        </h2>
      </div>

      <div className="p-3">
        <table className="w-full table-fixed min-w-[600px]">
          <colgroup>
            <col className="w-28" />
            <col />
            <col />
            <col />
          </colgroup>

          <thead>
            <tr className="border-b-2 border-slate-300 dark:border-slate-600">
              <th className="py-1 text-left text-[10px] font-semibold uppercase text-slate-400" />
              {COMP_LABELS.map((l) => (
                <th key={l} className="py-1 px-1 text-center text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  {l}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {row("Address", (comp, idx) => (
              <input className={inputCls} placeholder="Street address"
                value={comp.address ?? ""}
                onChange={(e) => setComp(idx, "address", e.target.value || null)} />
            ))}
            {row("Sale Price", (comp, idx) => (
              <input type="number" className={inputCls} placeholder="$"
                value={comp.sale_price ?? ""}
                onChange={(e) => setComp(idx, "sale_price", numOrNull(e.target.value))} />
            ))}
            {row("Sale Date", (comp, idx) => (
              <input className={inputCls} placeholder="m/d/yyyy"
                value={comp.sale_date ?? ""}
                onChange={(e) => setComp(idx, "sale_date", e.target.value || null)} />
            ))}
            {row("GLA (sqft)", (comp, idx) => (
              <input type="number" className={inputCls} placeholder="sqft"
                value={comp.gla ?? ""}
                onChange={(e) => setComp(idx, "gla", numOrNull(e.target.value))} />
            ))}
            {row("Year Built", (comp, idx) => (
              <input type="number" className={inputCls}
                value={comp.year_built ?? ""}
                onChange={(e) => setComp(idx, "year_built", numOrNull(e.target.value))} />
            ))}
            {row("Quality", (comp, idx) => (
              <select className={selectCls}
                value={comp.quality ?? ""}
                onChange={(e) => setComp(idx, "quality", (e.target.value || null) as UadQuality | null)}>
                <option value="">—</option>
                {UAD_QUALITY.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            ))}
            {row("Condition", (comp, idx) => (
              <select className={selectCls}
                value={comp.condition ?? ""}
                onChange={(e) => setComp(idx, "condition", (e.target.value || null) as UadCondition | null)}>
                <option value="">—</option>
                {UAD_CONDITION.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            ))}
            {row("View", (comp, idx) => (
              <input className={inputCls}
                value={comp.view ?? ""}
                onChange={(e) => setComp(idx, "view", e.target.value || null)} />
            ))}

            {/* Adjustment rows */}
            <tr>
              <td colSpan={4} className="pt-3 pb-1">
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Adjustments</div>
              </td>
            </tr>
            {row("Location", (comp, idx) => (
              <AdjRow label="Location" compKey="adj_location" comp={comp} onSet={(v) => setComp(idx, "adj_location", v)} />
            ))}
            {row("Site", (comp, idx) => (
              <AdjRow label="Site" compKey="adj_site" comp={comp} onSet={(v) => setComp(idx, "adj_site", v)} />
            ))}
            {row("View", (comp, idx) => (
              <AdjRow label="View" compKey="adj_view" comp={comp} onSet={(v) => setComp(idx, "adj_view", v)} />
            ))}
            {row("Quality", (comp, idx) => (
              <AdjRow label="Quality" compKey="adj_quality" comp={comp} onSet={(v) => setComp(idx, "adj_quality", v)} />
            ))}
            {row("Condition", (comp, idx) => (
              <AdjRow label="Condition" compKey="adj_condition" comp={comp} onSet={(v) => setComp(idx, "adj_condition", v)} />
            ))}
            {row("Bsmt", (comp, idx) => (
              <AdjRow label="Bsmt" compKey="adj_bsmt" comp={comp} onSet={(v) => setComp(idx, "adj_bsmt", v)} />
            ))}
            {row("Garage", (comp, idx) => (
              <AdjRow label="Garage" compKey="adj_garage" comp={comp} onSet={(v) => setComp(idx, "adj_garage", v)} />
            ))}
            {row("GLA", (comp, idx) => (
              <AdjRow label="GLA" compKey="adj_gla" comp={comp} onSet={(v) => setComp(idx, "adj_gla", v)} />
            ))}
            {row("Other", (comp, idx) => (
              <AdjRow label="Other" compKey="adj_other" comp={comp} onSet={(v) => setComp(idx, "adj_other", v)} />
            ))}

            {/* Computed totals */}
            <tr className="border-t-2 border-slate-300 dark:border-slate-600">
              <td className="py-1 pr-2 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                Net Adj
              </td>
              {comparables.map((comp, idx) => {
                const net = computeNetAdj(comp);
                return (
                  <td key={idx} className="py-1 px-1">
                    <div className={`${computedCls} font-semibold ${net >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {net === 0 ? "—" : fmt(net)}
                    </div>
                  </td>
                );
              })}
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="py-1 pr-2 text-[10px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                Adj Sale Price
              </td>
              {comparables.map((comp, idx) => {
                const adj = computeAdjSalePrice(comp);
                return (
                  <td key={idx} className="py-1 px-1">
                    <div className={`${computedCls} font-bold text-slate-800 dark:text-slate-100`}>
                      {adj !== null ? `$${adj.toLocaleString()}` : "—"}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
