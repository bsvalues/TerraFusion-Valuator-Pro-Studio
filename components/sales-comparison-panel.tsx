"use client";

/**
 * TerraFusion Valuator Pro — SalesComparisonPanel
 *
 * UAD-compliant Sales Comparison Approach panel for commercial fee appraisers.
 * Features:
 *  - Subject property column (read-only, from SubjectWorkbenchContext)
 *  - Up to 6 comparable sale columns (FNMA 1004 standard)
 *  - Full UAD GCX adjustment grid (20 adjustment lines)
 *  - Regression Extraction overlay — run OLS on comp pool to extract
 *    market-derived adjustment coefficients
 *  - FNMA guideline flags (net > 15%, gross > 25%, date > 12 months)
 *  - Evidence rail showing R², p-values, and warnings
 *  - Reconciliation panel with weighted value indicator
 *
 * GOVERNANCE:
 *  - All regression computation is server-side (POST /api/regression-extraction)
 *  - Reason code required before running extraction
 *  - Every regression-extracted adjustment is flagged with a "R" badge
 *  - Appraiser can override any adjustment — override is tracked
 */

import { useState, useCallback } from "react";
import {
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  FileText,
  Plus,
  Trash2,
  RefreshCw,
  Info,
  Award,
} from "lucide-react";
import {
  type ComparableSaleGCX,
  type CompVault,
  type FNMAGuidelineCheck,
  type SalesCompReconciliation,
  STANDARD_ADJUSTMENT_LINES,
  createCompVault,
  addCompToVault,
  updateCompAdjustment,
  removeCompFromVault,
  checkFNMAGuidelines,
  reconcileSalesComparison,
  computeCompAdjustments,
} from "@/lib/comp-vault";
import type { ExtractionResult } from "@/lib/regression-extraction";
import { useSubjectWorkbench } from "@/lib/subject-workbench-context";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (v: number, decimals = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: decimals,
  }).format(v);

const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

const adjColor = (amount: number) => {
  if (amount === 0) return "text-muted-foreground";
  return amount > 0 ? "text-cyan-400" : "text-red-400";
};

const flagColor = (flag: boolean) => (flag ? "text-amber-400" : "text-cyan-400");

// ---------------------------------------------------------------------------
// Demo comps for initial state
// ---------------------------------------------------------------------------

function buildDemoComp(
  pos: 1 | 2 | 3 | 4 | 5 | 6,
  address: string,
  salePrice: number,
  gla: number,
  saleDate: string,
  monthsAgo: number,
  condition: ComparableSaleGCX["condition"],
  quality: ComparableSaleGCX["quality"]
): Omit<ComparableSaleGCX, "compId" | "addedAt"> {
  return {
    gridPosition: pos,
    address,
    city: "Austin",
    state: "TX",
    zip: "78701",
    proximityMiles: 0.3 + pos * 0.1,
    salePrice,
    salePricePerSqft: Math.round(salePrice / gla),
    dataSource: "MLS",
    sourceCitation: `MLS#${1000000 + pos * 12345}`,
    verificationSource: "Deed Records",
    adjustments: STANDARD_ADJUSTMENT_LINES.map((line) => ({
      fieldCode: line.fieldCode,
      label: line.label,
      amount: 0,
      regressionExtracted: false,
    })),
    saleOrFinancingConcessions: "None",
    concessionAmount: 0,
    saleDate,
    monthsAgo,
    propertyRightsAppraised: "Fee Simple",
    location: "NnN",
    siteArea: 7500 + pos * 250,
    siteAreaUnit: "sqft",
    view: "Nt",
    design: "Ranch",
    quality,
    actualAge: 15 + pos * 2,
    condition,
    totalRooms: 7,
    bedrooms: 3,
    bathrooms: 2.0,
    gla,
    basementSqft: 0,
    basementFinishedSqft: 0,
    functionalUtility: "Average",
    heatingCooling: "FWA/CAC",
    energyEfficientItems: "None",
    garageCarport: "Att. 2 Car",
    garageSpaces: 2,
    porchPatioDeck: "Patio",
    netAdjustment: 0,
    grossAdjustment: 0,
    adjustedSalePrice: salePrice,
    netAdjustmentPct: 0,
    grossAdjustmentPct: 0,
    addedBy: "appraiser",
    notes: "",
  };
}

function buildInitialVault(): CompVault {
  let vault = createCompVault("DEMO-001", 1850);
  vault = addCompToVault(vault, buildDemoComp(1, "412 Maple Street", 485000, 1920, "2025-11-15", 4, "C3", "Q4"));
  vault = addCompToVault(vault, buildDemoComp(2, "789 Oak Avenue", 462000, 1780, "2025-10-02", 5, "C3", "Q4"));
  vault = addCompToVault(vault, buildDemoComp(3, "1105 Pine Drive", 510000, 2010, "2025-12-20", 3, "C2", "Q3"));
  return vault;
}

// ---------------------------------------------------------------------------
// Regression Panel
// ---------------------------------------------------------------------------

interface RegressionPanelProps {
  vault: CompVault;
  extraction: ExtractionResult | null;
  isRunning: boolean;
  onRun: (reasonCode: string) => void;
  onApply: () => void;
}

function RegressionPanel({ vault, extraction, isRunning, onRun, onApply }: RegressionPanelProps) {
  const [reasonCode, setReasonCode] = useState("");
  const [expanded, setExpanded] = useState(false);

  const canRun = vault.comps.length >= 3 && reasonCode.trim().length >= 3;

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium">Market Extraction — Regression Analysis</span>
          {extraction && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
              R² = {(extraction.rSquared * 100).toFixed(1)}%
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="p-4 border-t border-border space-y-4">
          <p className="text-xs text-muted-foreground">
            Run OLS regression on your comp pool to extract market-derived adjustment coefficients
            ($/sqft GLA, $/year age, $/condition grade, etc.). Coefficients are reported with
            R², t-statistics, and p-values. You must review and may override any extracted adjustment.
          </p>

          {vault.comps.length < 3 && (
            <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-500/10 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Add at least 3 comparable sales before running regression extraction.
            </div>
          )}

          <div className="flex gap-2">
            <input
              className="flex-1 bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Reason code (e.g. 'Market-derived GLA adjustment')"
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
            />
            <button
              disabled={!canRun || isRunning}
              onClick={() => onRun(reasonCode)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4" />
              )}
              {isRunning ? "Running..." : "Extract Adjustments"}
            </button>
          </div>

          {extraction && (
            <div className="space-y-3">
              {/* Model stats */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "R²", value: (extraction.rSquared * 100).toFixed(1) + "%" },
                  { label: "Adj. R²", value: (extraction.rSquaredAdj * 100).toFixed(1) + "%" },
                  { label: "RMSE", value: fmt(extraction.rmse) },
                  { label: "n", value: extraction.n.toString() },
                ].map((s) => (
                  <div key={s.label} className="bg-muted/30 rounded-lg p-2 text-center">
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                    <div className="text-sm font-medium">{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Coefficients table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Variable</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Coeff ($/unit)</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Std Err</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">t-stat</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">p-value</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">VIF</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Sig.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extraction.coefficients.map((c) => (
                      <tr key={c.variable} className="border-b border-border/50">
                        <td className="py-1.5 font-medium">{c.label}</td>
                        <td className={`py-1.5 text-right font-mono ${adjColor(c.coefficient)}`}>
                          {c.coefficient >= 0 ? "+" : ""}{c.coefficient.toFixed(2)}
                        </td>
                        <td className="py-1.5 text-right font-mono text-muted-foreground">
                          {c.stdError.toFixed(2)}
                        </td>
                        <td className="py-1.5 text-right font-mono text-muted-foreground">
                          {c.tStatistic.toFixed(3)}
                        </td>
                        <td className={`py-1.5 text-right font-mono ${c.significant ? "text-cyan-400" : "text-amber-400"}`}>
                          {c.pValue.toFixed(3)}
                        </td>
                        <td className={`py-1.5 text-right font-mono ${c.vif > 5 ? "text-red-400" : "text-muted-foreground"}`}>
                          {c.vif.toFixed(1)}
                        </td>
                        <td className="py-1.5 text-center">
                          {c.significant ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 inline" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 inline" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Warnings */}
              {extraction.warnings.length > 0 && (
                <div className="space-y-1">
                  {extraction.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-lg p-2">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      {w}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={onApply}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Apply Regression Adjustments to Grid
              </button>
              <p className="text-xs text-muted-foreground text-center">
                Applied adjustments will be marked with an <span className="text-blue-400 font-mono">R</span> badge.
                You may override any value in the grid.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

export function SalesComparisonPanel() {
  const { subject, dispatchRun } = useSubjectWorkbench();
  const [vault, setVault] = useState<CompVault>(buildInitialVault);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [isRunningRegression, setIsRunningRegression] = useState(false);
  const [reconciliation, setReconciliation] = useState<SalesCompReconciliation | null>(null);
  const [fnmaFlags, setFnmaFlags] = useState<FNMAGuidelineCheck[]>([]);
  const [showAddComp, setShowAddComp] = useState(false);
  const [newCompAddress, setNewCompAddress] = useState("");
  const [newCompPrice, setNewCompPrice] = useState("");
  const [newCompGLA, setNewCompGLA] = useState("");
  const [newCompDate, setNewCompDate] = useState("");
  const [activeTab, setActiveTab] = useState<"grid" | "regression" | "reconcile">("grid");

  // --- Run regression extraction ---
  const handleRunRegression = useCallback(
    async (reasonCode: string) => {
      if (vault.comps.length < 3) return;
      setIsRunningRegression(true);
      try {
        const salePrices = vault.comps.map((c) => c.salePrice);
        const compIds = vault.comps.map((c) => c.compId);
        const glaValues = vault.comps.map((c) => c.gla);
        const ageValues = vault.comps.map((c) => c.actualAge);
        const condValues = vault.comps.map((c) => parseInt(c.condition.replace("C", "")));

        const body = {
          fileNumber: vault.fileNumber,
          correlationId: `corr_${Date.now()}`,
          reasonCode,
          salePrices,
          compIds,
          variables: [
            { name: "GLA", gcxFieldCode: "GCX_ADJ_GLA", label: "Gross Living Area", values: glaValues },
            { name: "AGE", gcxFieldCode: "GCX_ADJ_AGE", label: "Actual Age", values: ageValues },
            { name: "CONDITION", gcxFieldCode: "GCX_ADJ_CONDITION", label: "Condition", values: condValues },
          ],
          subject: {
            gla: vault.subjectGLA,
            siteArea: 7500,
            actualAge: 10,
            condition: 3,
            quality: 4,
            garageSpaces: 2,
            basementSqft: 0,
          },
          compValues: vault.comps.map((c) => ({
            compId: c.compId,
            gla: c.gla,
            siteArea: c.siteArea,
            actualAge: c.actualAge,
            condition: parseInt(c.condition.replace("C", "")),
            quality: parseInt(c.quality.replace("Q", "")),
            garageSpaces: c.garageSpaces,
            basementSqft: c.basementSqft,
          })),
        };

        const res = await fetch("/api/regression-extraction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.ok) {
          setExtraction(data.extraction);
        } else {
          console.error("Regression extraction failed:", data.error);
        }
      } catch (err) {
        console.error("Regression extraction error:", err);
      } finally {
        setIsRunningRegression(false);
      }
    },
    [vault]
  );

  // --- Apply regression adjustments to grid ---
  const handleApplyRegression = useCallback(async () => {
    if (!extraction) return;
    // Re-run to get applied adjustments
    const salePrices = vault.comps.map((c) => c.salePrice);
    const compIds = vault.comps.map((c) => c.compId);
    const glaValues = vault.comps.map((c) => c.gla);
    const ageValues = vault.comps.map((c) => c.actualAge);
    const condValues = vault.comps.map((c) => parseInt(c.condition.replace("C", "")));

    const body = {
      fileNumber: vault.fileNumber,
      correlationId: extraction.correlationId,
      reasonCode: "Apply regression adjustments",
      salePrices,
      compIds,
      variables: [
        { name: "GLA", gcxFieldCode: "GCX_ADJ_GLA", label: "Gross Living Area", values: glaValues },
        { name: "AGE", gcxFieldCode: "GCX_ADJ_AGE", label: "Actual Age", values: ageValues },
        { name: "CONDITION", gcxFieldCode: "GCX_ADJ_CONDITION", label: "Condition", values: condValues },
      ],
      subject: {
        gla: vault.subjectGLA,
        siteArea: 7500,
        actualAge: 10,
        condition: 3,
        quality: 4,
        garageSpaces: 2,
        basementSqft: 0,
      },
      compValues: vault.comps.map((c) => ({
        compId: c.compId,
        gla: c.gla,
        siteArea: c.siteArea,
        actualAge: c.actualAge,
        condition: parseInt(c.condition.replace("C", "")),
        quality: parseInt(c.quality.replace("Q", "")),
        garageSpaces: c.garageSpaces,
        basementSqft: c.basementSqft,
      })),
    };

    const res = await fetch("/api/regression-extraction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.ok && data.appliedAdjustments) {
      let updatedVault = vault;
      for (const compAdj of data.appliedAdjustments) {
        for (const adj of compAdj.adjustments) {
          updatedVault = updateCompAdjustment(
            updatedVault,
            compAdj.compId,
            adj.gcxFieldCode,
            adj.amount,
            true,
            adj.regressionCoefficient
          );
        }
      }
      setVault(updatedVault);
    }
  }, [extraction, vault]);

  // --- Reconcile ---
  const handleReconcile = useCallback(() => {
    if (vault.comps.length === 0) return;
    const rec = reconcileSalesComparison(vault);
    setReconciliation(rec);
    const flags = checkFNMAGuidelines(vault);
    setFnmaFlags(flags);
    setActiveTab("reconcile");
  }, [vault]);

  // --- Add comp ---
  const handleAddComp = useCallback(() => {
    if (!newCompAddress || !newCompPrice || !newCompGLA || !newCompDate) return;
    const price = parseFloat(newCompPrice.replace(/[^0-9.]/g, ""));
    const gla = parseFloat(newCompGLA.replace(/[^0-9.]/g, ""));
    if (isNaN(price) || isNaN(gla)) return;
    const pos = (vault.comps.length + 1) as 1 | 2 | 3 | 4 | 5 | 6;
    const saleDate = new Date(newCompDate);
    const monthsAgo = Math.round((Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    try {
      setVault((v) =>
        addCompToVault(
          v,
          buildDemoComp(pos, newCompAddress, price, gla, newCompDate, monthsAgo, "C3", "Q4")
        )
      );
      setNewCompAddress("");
      setNewCompPrice("");
      setNewCompGLA("");
      setNewCompDate("");
      setShowAddComp(false);
    } catch (e: unknown) {
      console.error(e);
    }
  }, [vault, newCompAddress, newCompPrice, newCompGLA, newCompDate]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const tabs = [
    { id: "grid", label: "Adjustment Grid", icon: Calculator },
    { id: "regression", label: "Market Extraction", icon: BarChart3 },
    { id: "reconcile", label: "Reconciliation", icon: Award },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Sales Comparison Approach</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            UAD GCX — FNMA Form 1004 / Freddie Mac Form 70
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{vault.comps.length}/6 comps</span>
          {vault.comps.length < 6 && (
            <button
              onClick={() => setShowAddComp((s) => !s)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Comp
            </button>
          )}
          <button
            onClick={handleReconcile}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Reconcile
          </button>
        </div>
      </div>

      {/* Add comp form */}
      {showAddComp && (
        <div className="border border-border rounded-xl p-4 bg-card space-y-3">
          <h3 className="text-sm font-medium">Add Comparable Sale</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="col-span-2 bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Street address"
              value={newCompAddress}
              onChange={(e) => setNewCompAddress(e.target.value)}
            />
            <input
              className="bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Sale price (e.g. 485000)"
              value={newCompPrice}
              onChange={(e) => setNewCompPrice(e.target.value)}
            />
            <input
              className="bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="GLA sqft (e.g. 1920)"
              value={newCompGLA}
              onChange={(e) => setNewCompGLA(e.target.value)}
            />
            <input
              type="date"
              className="col-span-2 bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={newCompDate}
              onChange={(e) => setNewCompDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddComp}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddComp(false)}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-sm rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* ADJUSTMENT GRID TAB                                                  */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "grid" && (
        <div className="overflow-x-auto">
          {vault.comps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Calculator className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-base font-medium mb-1">No Comparables Added</h3>
              <p className="text-sm text-muted-foreground">
                Click "Add Comp" to begin building your sales comparison grid.
              </p>
            </div>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/30">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground w-36 border-r border-border">
                    Feature
                  </th>
                  {/* Subject column */}
                  <th className="text-center px-3 py-2 font-medium border-r border-border min-w-[140px]">
                    <div className="text-blue-400">SUBJECT</div>
                    <div className="text-muted-foreground font-normal text-[10px] mt-0.5">
                      {subject?.address ?? "123 Main Street"}
                    </div>
                  </th>
                  {/* Comp columns */}
                  {vault.comps.map((comp, idx) => (
                    <th key={comp.compId} className="text-center px-3 py-2 font-medium border-r border-border min-w-[140px]">
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-400">COMP {idx + 1}</span>
                        <button
                          onClick={() => setVault((v) => removeCompFromVault(v, comp.compId))}
                          className="text-muted-foreground hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-muted-foreground font-normal text-[10px] mt-0.5 truncate">
                        {comp.address}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Sale price row */}
                <tr className="border-b border-border bg-card">
                  <td className="px-3 py-2 font-medium border-r border-border">Sale Price</td>
                  <td className="px-3 py-2 text-center border-r border-border text-muted-foreground">—</td>
                  {vault.comps.map((comp) => (
                    <td key={comp.compId} className="px-3 py-2 text-center border-r border-border font-medium">
                      {fmt(comp.salePrice)}
                    </td>
                  ))}
                </tr>
                {/* $/sqft row */}
                <tr className="border-b border-border">
                  <td className="px-3 py-2 text-muted-foreground border-r border-border">$/Sqft</td>
                  <td className="px-3 py-2 text-center border-r border-border text-muted-foreground">—</td>
                  {vault.comps.map((comp) => (
                    <td key={comp.compId} className="px-3 py-2 text-center border-r border-border text-muted-foreground">
                      ${comp.salePricePerSqft}/sf
                    </td>
                  ))}
                </tr>
                {/* Data source */}
                <tr className="border-b border-border bg-card">
                  <td className="px-3 py-2 text-muted-foreground border-r border-border">Data Source</td>
                  <td className="px-3 py-2 text-center border-r border-border text-muted-foreground">—</td>
                  {vault.comps.map((comp) => (
                    <td key={comp.compId} className="px-3 py-2 text-center border-r border-border text-muted-foreground">
                      {comp.dataSource}
                    </td>
                  ))}
                </tr>
                {/* Sale date */}
                <tr className="border-b border-border">
                  <td className="px-3 py-2 text-muted-foreground border-r border-border">Sale Date</td>
                  <td className="px-3 py-2 text-center border-r border-border text-muted-foreground">—</td>
                  {vault.comps.map((comp) => (
                    <td key={comp.compId} className={`px-3 py-2 text-center border-r border-border ${comp.monthsAgo > 12 ? "text-amber-400" : "text-muted-foreground"}`}>
                      {comp.saleDate}
                      {comp.monthsAgo > 12 && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                    </td>
                  ))}
                </tr>
                {/* GLA */}
                <tr className="border-b border-border bg-card">
                  <td className="px-3 py-2 text-muted-foreground border-r border-border">GLA (sqft)</td>
                  <td className="px-3 py-2 text-center border-r border-border font-medium">
                    {vault.subjectGLA.toLocaleString()}
                  </td>
                  {vault.comps.map((comp) => (
                    <td key={comp.compId} className="px-3 py-2 text-center border-r border-border text-muted-foreground">
                      {comp.gla.toLocaleString()}
                    </td>
                  ))}
                </tr>
                {/* Condition */}
                <tr className="border-b border-border">
                  <td className="px-3 py-2 text-muted-foreground border-r border-border">Condition</td>
                  <td className="px-3 py-2 text-center border-r border-border font-medium text-blue-400">C3</td>
                  {vault.comps.map((comp) => (
                    <td key={comp.compId} className="px-3 py-2 text-center border-r border-border text-muted-foreground">
                      {comp.condition}
                    </td>
                  ))}
                </tr>
                {/* Quality */}
                <tr className="border-b border-border bg-card">
                  <td className="px-3 py-2 text-muted-foreground border-r border-border">Quality</td>
                  <td className="px-3 py-2 text-center border-r border-border font-medium text-blue-400">Q4</td>
                  {vault.comps.map((comp) => (
                    <td key={comp.compId} className="px-3 py-2 text-center border-r border-border text-muted-foreground">
                      {comp.quality}
                    </td>
                  ))}
                </tr>

                {/* Adjustment lines */}
                <tr className="bg-muted/20">
                  <td colSpan={vault.comps.length + 2} className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                    Adjustments
                  </td>
                </tr>
                {STANDARD_ADJUSTMENT_LINES.slice(0, -1).map((line) => (
                  <tr key={line.fieldCode} className="border-b border-border/50 hover:bg-muted/10">
                    <td className="px-3 py-1.5 text-muted-foreground border-r border-border text-[11px]">
                      {line.label}
                    </td>
                    <td className="px-3 py-1.5 text-center border-r border-border text-muted-foreground">—</td>
                    {vault.comps.map((comp) => {
                      const adj = comp.adjustments.find((a) => a.fieldCode === line.fieldCode);
                      return (
                        <td key={comp.compId} className="px-2 py-1 border-r border-border">
                          <div className="flex items-center gap-1">
                            {adj?.regressionExtracted && (
                              <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1 rounded font-mono">R</span>
                            )}
                            <input
                              type="number"
                              className={`w-full bg-transparent text-right text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 ${adjColor(adj?.amount ?? 0)}`}
                              value={adj?.amount ?? 0}
                              onChange={(e) => {
                                const amount = parseFloat(e.target.value) || 0;
                                setVault((v) =>
                                  updateCompAdjustment(v, comp.compId, line.fieldCode, amount, false)
                                );
                              }}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Net adjustment */}
                <tr className="border-b border-border bg-muted/20 font-medium">
                  <td className="px-3 py-2 border-r border-border text-[11px]">Net Adjustment</td>
                  <td className="px-3 py-2 text-center border-r border-border text-muted-foreground">—</td>
                  {vault.comps.map((comp) => (
                    <td key={comp.compId} className={`px-3 py-2 text-center border-r border-border font-mono ${adjColor(comp.netAdjustment)}`}>
                      {comp.netAdjustment >= 0 ? "+" : ""}{fmt(comp.netAdjustment)}
                      <div className={`text-[10px] ${Math.abs(comp.netAdjustmentPct) > 15 ? "text-amber-400" : "text-muted-foreground"}`}>
                        {fmtPct(comp.netAdjustmentPct)}
                        {Math.abs(comp.netAdjustmentPct) > 15 && <AlertTriangle className="w-2.5 h-2.5 inline ml-0.5" />}
                      </div>
                    </td>
                  ))}
                </tr>
                {/* Gross adjustment */}
                <tr className="border-b border-border">
                  <td className="px-3 py-2 text-muted-foreground border-r border-border text-[11px]">Gross Adjustment</td>
                  <td className="px-3 py-2 text-center border-r border-border text-muted-foreground">—</td>
                  {vault.comps.map((comp) => (
                    <td key={comp.compId} className={`px-3 py-2 text-center border-r border-border font-mono text-muted-foreground`}>
                      {fmt(comp.grossAdjustment)}
                      <div className={`text-[10px] ${comp.grossAdjustmentPct > 25 ? "text-amber-400" : "text-muted-foreground"}`}>
                        {fmtPct(comp.grossAdjustmentPct)}
                        {comp.grossAdjustmentPct > 25 && <AlertTriangle className="w-2.5 h-2.5 inline ml-0.5" />}
                      </div>
                    </td>
                  ))}
                </tr>
                {/* Adjusted sale price */}
                <tr className="bg-cyan-950/20">
                  <td className="px-3 py-2.5 font-semibold border-r border-border text-[11px]">Adjusted Sale Price</td>
                  <td className="px-3 py-2.5 text-center border-r border-border text-muted-foreground">—</td>
                  {vault.comps.map((comp) => (
                    <td key={comp.compId} className="px-3 py-2.5 text-center border-r border-border font-semibold text-cyan-400">
                      {fmt(comp.adjustedSalePrice)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* REGRESSION TAB                                                        */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "regression" && (
        <RegressionPanel
          vault={vault}
          extraction={extraction}
          isRunning={isRunningRegression}
          onRun={handleRunRegression}
          onApply={handleApplyRegression}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* RECONCILIATION TAB                                                    */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "reconcile" && (
        <div className="space-y-4">
          {!reconciliation ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Award className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-base font-medium mb-1">No Reconciliation Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Click "Reconcile" to compute the indicated value from your adjusted comps.
              </p>
              <button
                onClick={handleReconcile}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                <Award className="w-4 h-4" />
                Reconcile Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Indicated value */}
              <div className="border border-cyan-500/30 rounded-xl p-6 bg-cyan-950/20 text-center">
                <div className="text-xs text-muted-foreground mb-1">Indicated Value — Sales Comparison Approach</div>
                <div className="text-4xl font-bold text-cyan-400">
                  {fmt(reconciliation.indicatedValue)}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Range: {fmt(reconciliation.range.low)} – {fmt(reconciliation.range.high)}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Mean Adjusted", value: fmt(reconciliation.mean) },
                  { label: "Median Adjusted", value: fmt(reconciliation.median) },
                  { label: "Weighted Value", value: fmt(reconciliation.weightedValue) },
                ].map((s) => (
                  <div key={s.label} className="border border-border rounded-xl p-3 text-center bg-card">
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                    <div className="text-sm font-semibold mt-1">{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Reconciliation note */}
              <div className="border border-border rounded-xl p-4 bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium">Reconciliation Note</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {reconciliation.reconciliationNote}
                </p>
              </div>

              {/* FNMA flags */}
              {fnmaFlags.some((f) => f.netAdjPctFlag || f.grossAdjPctFlag || f.dateFlag) && (
                <div className="border border-amber-500/30 rounded-xl p-4 bg-amber-950/20">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-400">FNMA Guideline Flags</span>
                  </div>
                  <div className="space-y-2">
                    {fnmaFlags.map((flag) => (
                      <div key={flag.compId} className="text-xs space-y-1">
                        <div className="font-medium">{flag.address}</div>
                        {flag.netAdjPctFlag && (
                          <div className="text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Net adjustment {fmtPct(flag.netAdjPct)} exceeds 15% guideline
                          </div>
                        )}
                        {flag.grossAdjPctFlag && (
                          <div className="text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Gross adjustment {fmtPct(flag.grossAdjPct)} exceeds 25% guideline
                          </div>
                        )}
                        {flag.dateFlag && (
                          <div className="text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Sale date {flag.monthsAgo} months ago exceeds 12-month guideline
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    <Info className="w-3 h-3 inline mr-1" />
                    FNMA guidelines are advisory. Provide narrative justification in the addenda if any flag is present.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
