"use client";

/**
 * ReconciliationPanel
 *
 * Governed value reconciliation UI for TerraFusion Valuator Pro.
 * Reads approach values from the workbench run history, allows the appraiser
 * to assign weights and applicability, and produces the final opinion of value.
 *
 * USPAP SR 1-6 compliance is enforced:
 *  - All developed approaches must have rationale statements
 *  - Weights must sum to 1.0 for developed approaches
 *  - A point value must be stated
 *  - A reconciliation narrative of at least 50 characters is required
 */

import { useState, useEffect, useCallback } from "react";
import { useSubjectWorkbench } from "@/lib/subject-workbench-context";
import {
  ReconciliationVault,
  ReconciliationResult,
  ReconciliationEvidence,
  ApproachApplicability,
  createReconciliationVault,
  computeReconciliation,
  emitReconciliationEvidence,
  suggestWeights,
} from "@/lib/reconciliation-vault";
import { newRunId, newCorrelationId } from "@/lib/subject-context";
import { CheckCircle, AlertCircle, Scale } from "lucide-react";

function fmt$(n: number | null) {
  if (n === null) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const APPLICABILITY_OPTIONS: ApproachApplicability[] = [
  "Primary",
  "Secondary",
  "Supporting",
  "Not Applicable",
];

export function ReconciliationPanel() {
  const { subject, runHistory, dispatchRun, addRunRecord } = useSubjectWorkbench();

  // Extract latest approach values from run history
  const latestCostRun = [...runHistory].reverse().find((r) => r.runType === "cost");
  const latestSalesRun = [...runHistory].reverse().find((r) => r.runType === "sales_comparison");
  const latestIncomeRun = [...runHistory].reverse().find(
    (r) => r.runType === "income_direct_cap" || r.runType === "income_dcf"
  );

  const costValue = latestCostRun
    ? (latestCostRun.outputSnapshot?.indicatedValue as number | null) ?? null
    : null;
  const salesValue = latestSalesRun
    ? (latestSalesRun.outputSnapshot?.reconciledValue as number | null) ?? null
    : null;
  const incomeValue = latestIncomeRun
    ? (latestIncomeRun.outputSnapshot?.directCapValue as number | null) ?? null
    : null;

  const propertyType = subject.propertyType ?? "Residential";
  const suggested = suggestWeights(propertyType);

  const [vault, setVault] = useState<ReconciliationVault>(() => {
    const v = createReconciliationVault(
      subject.fileNumber ?? "DRAFT",
      subject.effectiveDate ?? new Date().toISOString().slice(0, 10),
      propertyType
    );
    return {
      ...v,
      costApproach: {
        ...v.costApproach,
        indicatedValue: costValue,
        developed: costValue !== null,
        weight: suggested.costWeight,
        rationale: suggested.rationale,
      },
      salesComparison: {
        ...v.salesComparison,
        indicatedValue: salesValue,
        developed: salesValue !== null,
        weight: suggested.salesWeight,
        rationale: suggested.rationale,
      },
      incomeApproach: {
        ...v.incomeApproach,
        indicatedValue: incomeValue,
        developed: incomeValue !== null,
        weight: suggested.incomeWeight,
        rationale: suggested.rationale,
      },
    };
  });

  // Sync approach values from run history when they change
  useEffect(() => {
    setVault((prev) => ({
      ...prev,
      costApproach: {
        ...prev.costApproach,
        indicatedValue: costValue,
        developed: costValue !== null,
      },
      salesComparison: {
        ...prev.salesComparison,
        indicatedValue: salesValue,
        developed: salesValue !== null,
      },
      incomeApproach: {
        ...prev.incomeApproach,
        indicatedValue: incomeValue,
        developed: incomeValue !== null,
      },
    }));
  }, [costValue, salesValue, incomeValue]);

  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [evidence, setEvidence] = useState<ReconciliationEvidence | null>(null);
  const [reasonCode, setReasonCode] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  // Live preview — recompute on every vault change
  const liveResult = computeReconciliation(vault);

  const handleRun = useCallback(async () => {
    if (!reasonCode || reasonCode.trim().length < 3) {
      setRunError("Reason code is required (min 3 chars).");
      return;
    }
    setIsRunning(true);
    setRunError(null);

    const runId = newRunId();
    const correlationId = newCorrelationId();

    try {
      const resp = await fetch("/api/reconciliation/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vault, reason_code: reasonCode, correlation_id: correlationId, run_id: runId }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setRunError(data.error ?? "Reconciliation failed.");
        return;
      }
      setResult(data.result);
      setEvidence(data.evidence);

      // Record the finalized reconciliation as its own run in the governance
      // spine (NOT a sales_comparison run — that bug let the reconciliation
      // overwrite the sales approach value). `finalValue` carries the opinion.
      const pending = dispatchRun(
        "reconciliation",
        reasonCode,
        data.evidence.inputSnapshot as Record<string, unknown>
      );
      if (pending) {
        addRunRecord({
          ...pending,
          status: "complete",
          completedAt: new Date().toISOString(),
          outputSnapshot: {
            finalValue:
              data.result?.finalValueRounded ??
              data.result?.weightedValue ??
              vault.finalValue ??
              null,
          },
          narrativeReady: true,
        });
      }
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRunning(false);
    }
  }, [vault, reasonCode, dispatchRun, addRunRecord]);

  const totalWeight = (vault.costApproach.developed ? vault.costApproach.weight : 0)
    + (vault.salesComparison.developed ? vault.salesComparison.weight : 0)
    + (vault.incomeApproach.developed ? vault.incomeApproach.weight : 0);
  const weightsOk = Math.abs(totalWeight - 1.0) < 0.001;

  const approaches = [
    { key: "costApproach" as const, label: "Cost Approach", uad: "REC_COST_VALUE", color: "text-blue-400" },
    { key: "salesComparison" as const, label: "Sales Comparison Approach", uad: "REC_SALES_VALUE", color: "text-emerald-400" },
    { key: "incomeApproach" as const, label: "Income Approach", uad: "REC_INCOME_VALUE", color: "text-amber-400" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-[hsl(var(--tf-transcend-cyan))]" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Value Reconciliation</h2>
            <p className="text-xs text-muted-foreground">USPAP SR 1-6 — Final Opinion of Value</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Reason code (min 3 chars)…"
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value)}
            className="h-8 px-3 text-xs rounded-md border border-border bg-background w-52"
          />
          <button
            onClick={handleRun}
            disabled={isRunning || !weightsOk}
            className="h-8 px-4 text-xs rounded-md bg-[hsl(var(--tf-transcend-cyan))] text-background font-medium disabled:opacity-50"
          >
            {isRunning ? "Running…" : "Finalize Reconciliation"}
          </button>
        </div>
      </div>

      {runError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {runError}
        </div>
      )}

      {/* Weight warning */}
      {!weightsOk && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Weights for developed approaches must sum to 100%. Current total: {(totalWeight * 100).toFixed(0)}%.
        </div>
      )}

      <div className="grid grid-cols-5 gap-4">
        {/* Left: Approach inputs */}
        <div className="col-span-3 space-y-3">
          {approaches.map(({ key, label, uad, color }) => {
            const ap = vault[key];
            return (
              <div key={key} className="rounded-md border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${color}`}>{label}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{uad}</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ap.developed}
                      onChange={(e) =>
                        setVault((v) => ({
                          ...v,
                          [key]: { ...v[key], developed: e.target.checked },
                        }))
                      }
                      className="w-3 h-3"
                    />
                    Developed
                  </label>
                </div>

                {ap.developed && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Indicated Value</label>
                      <input
                        type="number"
                        step="500"
                        value={ap.indicatedValue ?? ""}
                        onChange={(e) =>
                          setVault((v) => ({
                            ...v,
                            [key]: { ...v[key], indicatedValue: e.target.value ? +e.target.value : null },
                          }))
                        }
                        className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background font-mono"
                        placeholder="$0"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Weight (0–1)</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={ap.weight}
                        onChange={(e) =>
                          setVault((v) => ({
                            ...v,
                            [key]: { ...v[key], weight: +e.target.value },
                          }))
                        }
                        className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Applicability</label>
                      <select
                        value={ap.applicability}
                        onChange={(e) =>
                          setVault((v) => ({
                            ...v,
                            [key]: { ...v[key], applicability: e.target.value as ApproachApplicability },
                          }))
                        }
                        className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                      >
                        {APPLICABILITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] text-muted-foreground">Rationale (SR 1-6)</label>
                      <textarea
                        rows={2}
                        value={ap.rationale}
                        onChange={(e) =>
                          setVault((v) => ({
                            ...v,
                            [key]: { ...v[key], rationale: e.target.value },
                          }))
                        }
                        className="mt-0.5 w-full px-2 py-1 text-xs rounded border border-border bg-background resize-none"
                        placeholder="State why this approach was given this weight…"
                      />
                    </div>
                  </div>
                )}

                {!ap.developed && (
                  <p className="text-xs text-muted-foreground italic">Not developed for this assignment.</p>
                )}
              </div>
            );
          })}

          {/* Reconciliation narrative */}
          <div className="rounded-md border border-border p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Reconciliation Narrative (USPAP SR 1-6)</p>
            <textarea
              rows={4}
              value={vault.reconciliationNarrative}
              onChange={(e) => setVault((v) => ({ ...v, reconciliationNarrative: e.target.value }))}
              className="w-full px-2 py-1.5 text-xs rounded border border-border bg-background resize-none"
              placeholder="The appraiser has considered the three approaches to value. The Sales Comparison Approach is given primary weight as it best reflects the actions of buyers and sellers in the subject market area…"
            />
            <p className="text-[10px] text-muted-foreground">{vault.reconciliationNarrative.length} chars (min 50 required)</p>
          </div>

          {/* H&BU, Exposure, Marketing */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3">
              <label className="text-xs text-muted-foreground">Highest & Best Use</label>
              <input
                type="text"
                value={vault.highestBestUse}
                onChange={(e) => setVault((v) => ({ ...v, highestBestUse: e.target.value }))}
                className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                placeholder="e.g., Continued use as a single-tenant NNN retail building"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Exposure Time</label>
              <input
                type="text"
                value={vault.exposureTime}
                onChange={(e) => setVault((v) => ({ ...v, exposureTime: e.target.value }))}
                className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Marketing Time</label>
              <input
                type="text"
                value={vault.marketingTime}
                onChange={(e) => setVault((v) => ({ ...v, marketingTime: e.target.value }))}
                className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
              />
            </div>
          </div>
        </div>

        {/* Right: Live result panel */}
        <div className="col-span-2 space-y-3">
          {/* Live preview */}
          <div className="rounded-md border border-[hsl(var(--tf-transcend-cyan)/0.3)] bg-[hsl(var(--tf-transcend-cyan)/0.05)] p-4 space-y-2">
            <p className="text-[10px] font-semibold text-[hsl(var(--tf-transcend-cyan))] uppercase tracking-wide">Live Preview</p>

            {liveResult.developedApproaches.map((a) => (
              <div key={a.name} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{a.name}</span>
                <span className="font-mono">{fmt$(a.value)} × {(a.weight * 100).toFixed(0)}%</span>
              </div>
            ))}

            {liveResult.developedApproaches.length > 0 && (
              <div className="border-t border-border/40 pt-2 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Weighted Average</span>
                  <span className="font-mono font-semibold">{fmt$(liveResult.weightedValue)}</span>
                </div>
                {liveResult.rangeSpreadPct !== null && (
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-muted-foreground">Range Spread</span>
                    <span className="font-mono">{liveResult.rangeSpreadPct.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Final value override */}
            <div className="border-t border-border/40 pt-3 mt-2">
              <label className="text-[10px] text-muted-foreground">Final Opinion of Value (override)</label>
              <input
                type="number"
                step="500"
                value={vault.finalValue ?? ""}
                onChange={(e) =>
                  setVault((v) => ({
                    ...v,
                    finalValue: e.target.value ? +e.target.value : null,
                  }))
                }
                placeholder={liveResult.weightedValue ? String(Math.round((liveResult.weightedValue ?? 0) / 500) * 500) : "Enter final value…"}
                className="mt-1 h-8 w-full px-2 text-sm rounded border border-[hsl(var(--tf-transcend-cyan)/0.4)] bg-background font-mono font-semibold text-[hsl(var(--tf-transcend-cyan))]"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Rounded to nearest $500</p>
            </div>

            {/* Final value display */}
            {liveResult.finalValueRounded && (
              <div className="rounded-md border-2 border-[hsl(var(--tf-transcend-cyan)/0.5)] bg-[hsl(var(--tf-transcend-cyan)/0.1)] p-3 text-center mt-2">
                <p className="text-[10px] text-[hsl(var(--tf-transcend-cyan))] uppercase tracking-wider">Market Value Opinion</p>
                <p className="text-2xl font-bold font-mono text-[hsl(var(--tf-transcend-cyan))] mt-1">
                  {fmt$(liveResult.finalValueRounded)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  As of {vault.effectiveDate}
                </p>
              </div>
            )}
          </div>

          {/* USPAP compliance */}
          <div className="rounded-md border border-border p-3 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">USPAP SR 1-6 Compliance</p>
            {[
              { label: "SR 1-6(a) Data quality reconciled", ok: liveResult.uspap.sr16a },
              { label: "SR 1-6(b) Approach applicability stated", ok: liveResult.uspap.sr16b },
              { label: "SR 1-6(c) Point value stated", ok: liveResult.uspap.sr16c },
              { label: "Narrative ≥ 50 chars", ok: vault.reconciliationNarrative.length >= 50 },
              { label: "Weights sum to 100%", ok: weightsOk },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                {ok ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
              </div>
            ))}
          </div>

          {/* Suggest weights button */}
          <button
            onClick={() => {
              const s = suggestWeights(propertyType);
              setVault((v) => ({
                ...v,
                costApproach: { ...v.costApproach, weight: s.costWeight, rationale: s.rationale },
                salesComparison: { ...v.salesComparison, weight: s.salesWeight, rationale: s.rationale },
                incomeApproach: { ...v.incomeApproach, weight: s.incomeWeight, rationale: s.rationale },
              }));
            }}
            className="w-full h-7 text-xs rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
          >
            Suggest Weights for {propertyType}
          </button>

          {/* Evidence summary */}
          {evidence && (
            <div className="rounded-md border border-border p-3 space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Evidence Trail</p>
              <p className="text-[10px] font-mono text-muted-foreground">Run: {evidence.runId.slice(-12)}</p>
              <p className="text-[10px] font-mono text-muted-foreground">Corr: {evidence.correlationId.slice(-12)}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {evidence.uspapCompliant ? (
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                )}
                <span className="text-[10px] text-muted-foreground">
                  {evidence.uspapCompliant ? "USPAP Compliant" : "Review Required"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
