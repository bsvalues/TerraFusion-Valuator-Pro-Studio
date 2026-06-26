"use client";

/**
 * TerraFusion Valuator Pro — CostForge Panel
 *
 * The Cost Approach tab of the Workbench. Reads the SubjectContext for
 * property characteristics, accepts appraiser inputs for depreciation and
 * site value, dispatches a governed run to POST /api/costforge/calculate,
 * and renders the full UAD CST-field output with evidence lineage.
 *
 * GOVERNANCE RULES:
 *  - Run button is disabled until SubjectContext is ready.
 *  - Every run requires a reason_code.
 *  - Output maps directly to UAD CST fields.
 *  - No Marshall & Swift references anywhere in this component.
 *  - All computed values come from the server — no client-side math.
 */

import { useState } from "react";
import { useSubjectWorkbench } from "@/lib/subject-workbench-context";
import {
  AlertCircle,
  CheckCircle,
  Play,
  Info,
  FileText,
  Building2,
  TrendingDown,
  DollarSign,
  BarChart3,
  Clock,
  Shield,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types (mirrors route.ts)
// ---------------------------------------------------------------------------
interface CostRunOutput {
  run_id: string;
  file_number: string;
  correlation_id: string;
  calculated_at: string;
  model_version: string;
  cst_rcn: number;
  cst_rcn_main_building: number;
  cst_rcn_basement: number;
  cst_rcn_garage: number;
  cst_rcn_additional: number;
  cst_depreciation_physical: number;
  cst_depreciation_functional: number;
  cst_depreciation_external: number;
  cst_total_depreciation: number;
  cst_depreciated_value: number;
  cst_site_value: number;
  cst_indicated_value: number;
  cost_per_sqft: number;
  effective_age: number;
  remaining_economic_life: number;
  total_economic_life: number;
  depreciation_rate_pct: number;
  evidence_refs: Array<{
    source_type: string;
    source_id: string;
    source_label: string;
    retrieved_at: string;
    confidence: number;
    notes: string | null;
  }>;
  narrative_ready: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const fmtN = (n: number, dec = 0) => n.toLocaleString("en-US", { maximumFractionDigits: dec });

const inputCls =
  "w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30";

const selectCls =
  "w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CostForgePanel() {
  const { subject, subjectReady, missingFields, dispatchRun, addRunRecord, governanceError } =
    useSubjectWorkbench();

  // Appraiser inputs
  const [buildingType, setBuildingType] = useState("Wood Frame");
  const [basementSqft, setBasementSqft] = useState(0);
  const [garageSqft, setGarageSqft] = useState(0);
  const [additionalImprovements, setAdditionalImprovements] = useState(0);
  const [siteValue, setSiteValue] = useState(0);
  const [physicalDepreciationPct, setPhysicalDepreciationPct] = useState(0);
  const [functionalObsolescence, setFunctionalObsolescence] = useState(0);
  const [externalObsolescence, setExternalObsolescence] = useState(0);
  const [regionCostIndex, setRegionCostIndex] = useState(1.0);
  const [reasonCode, setReasonCode] = useState("");

  // Run state
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CostRunOutput | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const handleRun = async () => {
    setRunError(null);
    setResult(null);

    // Governance dispatch
    const pendingRecord = dispatchRun("cost", reasonCode, {
      buildingType,
      basementSqft,
      garageSqft,
      additionalImprovements,
      siteValue,
      physicalDepreciationPct,
      functionalObsolescence,
      externalObsolescence,
      regionCostIndex,
    });

    if (!pendingRecord) {
      // governanceError is set by dispatchRun
      return;
    }

    setRunning(true);

    try {
      const body = {
        file_number: subject.fileNumber!,
        property_id: subject.propertyId,
        reason_code: reasonCode,
        correlation_id: pendingRecord.correlationId,
        triggered_by: pendingRecord.triggeredBy,
        address: subject.address ?? "",
        city: subject.city ?? "",
        state: subject.state ?? "",
        effective_date: subject.effectiveDate ?? new Date().toISOString().split("T")[0],
        property_type: subject.propertyType ?? "Single Family Residential",
        building_type: buildingType,
        quality_class: subject.quality ?? "Q4",
        condition: subject.condition ?? "C3",
        year_built: subject.yearBuilt ?? 2000,
        gla_sqft: subject.gla ?? 1500,
        basement_sqft: basementSqft,
        garage_sqft: garageSqft,
        additional_improvements_value: additionalImprovements,
        site_value: siteValue,
        site_area_sqft: subject.siteArea ?? 0,
        physical_depreciation_pct: physicalDepreciationPct,
        functional_obsolescence: functionalObsolescence,
        external_obsolescence: externalObsolescence,
        region_cost_index: regionCostIndex,
      };

      const res = await fetch("/api/costforge/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setRunError(data.governance_error ?? "Cost calculation failed.");
        addRunRecord({
          ...pendingRecord,
          status: "failed",
          completedAt: new Date().toISOString(),
          outputSnapshot: { error: data.governance_error },
        });
        return;
      }

      setResult(data as CostRunOutput);
      addRunRecord({
        ...pendingRecord,
        status: "complete",
        completedAt: new Date().toISOString(),
        // `indicatedValue` is the canonical key the Reconciliation and Report
        // panels read; the raw engine output is preserved alongside it.
        outputSnapshot: {
          ...data,
          indicatedValue: (data as CostRunOutput).cst_indicated_value,
        },
        evidenceRefs: (data as CostRunOutput).evidence_refs.map((r) => ({
          sourceType: r.source_type as "cost_manual" | "appraiser_judgment",
          sourceId: r.source_id,
          sourceLabel: r.source_label,
          retrievedAt: r.retrieved_at,
          confidence: r.confidence,
          notes: r.notes,
        })),
        narrativeReady: (data as CostRunOutput).narrative_ready,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setRunError(msg);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            Cost Approach — TerraFusion CostForge
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Model: TerraFusion-CostForge-v1.0 · UAD CST fields · USPAP SR 1-4(b)
          </p>
        </div>
        {result && (
          <div className="text-right">
            <div className="text-xs text-zinc-500">Indicated Value by Cost Approach</div>
            <div className="text-2xl font-bold text-emerald-400">
              {fmt(result.cst_indicated_value)}
            </div>
            <div className="text-xs text-zinc-500">Run ID: {result.run_id}</div>
          </div>
        )}
      </div>

      {/* Governance status */}
      {!subjectReady && (
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-amber-950/30 border-amber-700/40 text-amber-300 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium">Subject not ready.</span>{" "}
            Complete the Subject tab before running the cost approach:{" "}
            {missingFields.join(", ")}.
          </div>
        </div>
      )}

      {(governanceError || runError) && (
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-red-950/30 border-red-700/40 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>{governanceError ?? runError}</div>
        </div>
      )}

      {/* Subject summary */}
      {subjectReady && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Property Type", value: subject.propertyType ?? "—" },
            { label: "Quality Class", value: subject.quality ?? "—", uad: true },
            { label: "Year Built", value: subject.yearBuilt?.toString() ?? "—" },
            { label: "GLA / Rentable Area", value: subject.gla ? `${fmtN(subject.gla)} sqft` : "—" },
          ].map((item) => (
            <div key={item.label} className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3">
              <div className="text-xs text-zinc-500">{item.label}</div>
              <div className="text-sm font-medium text-zinc-100 mt-0.5">{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Input form */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left column — building inputs */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            Building Inputs
          </h3>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Building Type / Construction</label>
            <select className={selectCls} value={buildingType} onChange={(e) => setBuildingType(e.target.value)}>
              <option>Wood Frame</option>
              <option>Masonry / Brick</option>
              <option>Steel Frame</option>
              <option>Concrete Block</option>
              <option>Pre-Engineered Metal</option>
              <option>Tilt-Up Concrete</option>
              <option>Log</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Basement Area (sqft)</label>
            <input
              type="number"
              className={inputCls}
              placeholder="0"
              value={basementSqft || ""}
              onChange={(e) => setBasementSqft(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Garage Area (sqft)</label>
            <input
              type="number"
              className={inputCls}
              placeholder="0"
              value={garageSqft || ""}
              onChange={(e) => setGarageSqft(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Additional Improvements Value ($)
            </label>
            <input
              type="number"
              className={inputCls}
              placeholder="0"
              value={additionalImprovements || ""}
              onChange={(e) => setAdditionalImprovements(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Regional Cost Index{" "}
              <span className="text-zinc-600">(1.00 = national avg)</span>
            </label>
            <input
              type="number"
              step="0.01"
              className={inputCls}
              placeholder="1.00"
              value={regionCostIndex}
              onChange={(e) => setRegionCostIndex(parseFloat(e.target.value) || 1.0)}
            />
          </div>
        </div>

        {/* Right column — depreciation and site */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-orange-400" />
            Depreciation &amp; Site Value
          </h3>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Physical Depreciation (%)
              <span className="ml-1 text-zinc-600">0 = use age-life method</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              className={inputCls}
              placeholder="0"
              value={physicalDepreciationPct || ""}
              onChange={(e) => setPhysicalDepreciationPct(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Functional Obsolescence ($)
            </label>
            <input
              type="number"
              className={inputCls}
              placeholder="0"
              value={functionalObsolescence || ""}
              onChange={(e) => setFunctionalObsolescence(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              External Obsolescence ($)
            </label>
            <input
              type="number"
              className={inputCls}
              placeholder="0"
              value={externalObsolescence || ""}
              onChange={(e) => setExternalObsolescence(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Site Value ($) <span className="text-zinc-600">— appraiser estimate</span>
            </label>
            <input
              type="number"
              className={inputCls}
              placeholder="e.g. 85000"
              value={siteValue || ""}
              onChange={(e) => setSiteValue(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Reason Code <span className="text-red-400">*</span>
              <span className="ml-1 text-zinc-600">— required for audit trail</span>
            </label>
            <input
              className={inputCls}
              placeholder="e.g. Initial cost approach run for 1004 report"
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Run button */}
      <button
        onClick={handleRun}
        disabled={!subjectReady || running || reasonCode.trim().length < 3}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white font-medium transition-colors"
      >
        {running ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Running TerraFusion CostForge...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Run Cost Approach
          </>
        )}
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* UAD CST Field Output */}
          <div className="border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-zinc-900/60 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-zinc-200">
                UAD Cost Approach Fields — {result.model_version}
              </span>
              <span className="ml-auto text-xs text-zinc-500">
                {new Date(result.calculated_at).toLocaleString()}
              </span>
            </div>

            <div className="p-4 space-y-3">
              {/* RCN Breakdown */}
              <div>
                <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Replacement Cost New (RCN)
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-zinc-800">
                    <tr>
                      <td className="py-1.5 text-zinc-400">
                        Main Building ({fmtN(subject.gla ?? 0)} sqft × ${result.cost_per_sqft}/sqft)
                      </td>
                      <td className="py-1.5 text-right font-mono text-zinc-100">
                        {fmt(result.cst_rcn_main_building)}
                      </td>
                    </tr>
                    {result.cst_rcn_basement > 0 && (
                      <tr>
                        <td className="py-1.5 text-zinc-400">Basement</td>
                        <td className="py-1.5 text-right font-mono text-zinc-100">
                          {fmt(result.cst_rcn_basement)}
                        </td>
                      </tr>
                    )}
                    {result.cst_rcn_garage > 0 && (
                      <tr>
                        <td className="py-1.5 text-zinc-400">Garage</td>
                        <td className="py-1.5 text-right font-mono text-zinc-100">
                          {fmt(result.cst_rcn_garage)}
                        </td>
                      </tr>
                    )}
                    {result.cst_rcn_additional > 0 && (
                      <tr>
                        <td className="py-1.5 text-zinc-400">Additional Improvements</td>
                        <td className="py-1.5 text-right font-mono text-zinc-100">
                          {fmt(result.cst_rcn_additional)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t border-zinc-700">
                      <td className="py-2 font-medium text-zinc-200">
                        Total RCN{" "}
                        <span className="text-xs font-mono text-emerald-500/70">[CST_RCN]</span>
                      </td>
                      <td className="py-2 text-right font-mono font-semibold text-zinc-100">
                        {fmt(result.cst_rcn)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Depreciation */}
              <div>
                <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Depreciation
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-zinc-800">
                    <tr>
                      <td className="py-1.5 text-zinc-400">
                        Physical Depreciation — Effective Age {result.effective_age} yrs /{" "}
                        {result.total_economic_life} yr life ({result.depreciation_rate_pct}%)
                        <span className="ml-1 text-xs font-mono text-emerald-500/70">
                          [CST_DEPRECIATION_PHYSICAL]
                        </span>
                      </td>
                      <td className="py-1.5 text-right font-mono text-red-400">
                        ({fmt(result.cst_depreciation_physical)})
                      </td>
                    </tr>
                    {result.cst_depreciation_functional > 0 && (
                      <tr>
                        <td className="py-1.5 text-zinc-400">
                          Functional Obsolescence
                          <span className="ml-1 text-xs font-mono text-emerald-500/70">
                            [CST_DEPRECIATION_FUNCTIONAL]
                          </span>
                        </td>
                        <td className="py-1.5 text-right font-mono text-red-400">
                          ({fmt(result.cst_depreciation_functional)})
                        </td>
                      </tr>
                    )}
                    {result.cst_depreciation_external > 0 && (
                      <tr>
                        <td className="py-1.5 text-zinc-400">
                          External Obsolescence
                          <span className="ml-1 text-xs font-mono text-emerald-500/70">
                            [CST_DEPRECIATION_EXTERNAL]
                          </span>
                        </td>
                        <td className="py-1.5 text-right font-mono text-red-400">
                          ({fmt(result.cst_depreciation_external)})
                        </td>
                      </tr>
                    )}
                    <tr className="border-t border-zinc-700">
                      <td className="py-2 font-medium text-zinc-200">Total Depreciation</td>
                      <td className="py-2 text-right font-mono font-semibold text-red-400">
                        ({fmt(result.cst_total_depreciation)})
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Value Indication */}
              <div className="border-t border-zinc-700 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">
                    Depreciated Value of Improvements
                    <span className="ml-1 text-xs font-mono text-emerald-500/70">
                      [CST_DEPRECIATED_VALUE]
                    </span>
                  </span>
                  <span className="font-mono text-zinc-100">{fmt(result.cst_depreciated_value)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">
                    Site Value (As If Vacant)
                    <span className="ml-1 text-xs font-mono text-emerald-500/70">
                      [CST_SITE_VALUE]
                    </span>
                  </span>
                  <span className="font-mono text-zinc-100">{fmt(result.cst_site_value)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold border-t border-zinc-700 pt-2">
                  <span className="text-zinc-100">
                    Indicated Value by Cost Approach
                    <span className="ml-1 text-xs font-mono text-emerald-500/70">
                      [CST_INDICATED_VALUE]
                    </span>
                  </span>
                  <span className="font-mono text-emerald-400">{fmt(result.cst_indicated_value)}</span>
                </div>
              </div>

              {/* Life metrics */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { label: "Effective Age", value: `${result.effective_age} yrs`, icon: <Clock className="w-3 h-3" /> },
                  { label: "Remaining Economic Life", value: `${result.remaining_economic_life} yrs`, icon: <Clock className="w-3 h-3" /> },
                  { label: "Depreciation Rate", value: `${result.depreciation_rate_pct}%`, icon: <TrendingDown className="w-3 h-3" /> },
                ].map((m) => (
                  <div key={m.label} className="bg-zinc-900/60 border border-zinc-800 rounded p-2">
                    <div className="flex items-center gap-1 text-xs text-zinc-500 mb-0.5">
                      {m.icon}
                      {m.label}
                    </div>
                    <div className="text-sm font-medium text-zinc-100">{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Evidence Rail */}
          <div className="border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-zinc-900/60 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-zinc-200">Evidence Rail</span>
              <span className="ml-1 text-xs text-zinc-500">
                — all sources cited for this run
              </span>
            </div>
            <div className="divide-y divide-zinc-800">
              {result.evidence_refs.map((ref, i) => (
                <div key={i} className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-200">{ref.source_label}</span>
                    <span className="text-xs text-zinc-500">
                      Confidence: {Math.round(ref.confidence * 100)}%
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {ref.source_type} · {ref.source_id} ·{" "}
                    {new Date(ref.retrieved_at).toLocaleString()}
                  </div>
                  {ref.notes && (
                    <div className="text-xs text-zinc-400 mt-1 italic">{ref.notes}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Narrative ready badge */}
          {result.narrative_ready && (
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-emerald-950/30 border-emerald-700/40 text-emerald-300 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>
                <span className="font-medium">Narrative ready.</span> This cost run can be passed
                to the AI Narrative Agent to generate the Cost Approach section of your report.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
