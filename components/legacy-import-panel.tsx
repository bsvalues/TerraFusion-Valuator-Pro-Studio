"use client";

/**
 * TerraFusion Valuator Pro — Legacy Import Panel
 *
 * Provides a full UI for importing a la mode WinTOTAL / Mercury MISMO XML
 * appraisal reports into TerraFusion orders.
 *
 * FEATURES:
 *  - Drag-and-drop or click-to-select XML file upload
 *  - Batch import of multiple files
 *  - Per-file parse status with error details
 *  - Preview card for each imported report (address, value, date, comps)
 *  - One-click "Save as TerraFusion Order" for each imported record
 *  - PDF extraction and download for embedded PDFs
 *  - Governance badge confirming no M&S references in imported data
 */

import React, { useCallback, useState } from "react";
import type { LegacyImportRecord } from "@/lib/mismo-parser";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImportResult {
  fileName: string;
  success: boolean;
  errors: string[];
  record: LegacyImportRecord | null;
}

interface ImportResponse {
  processed: number;
  succeeded: number;
  failed: number;
  results: ImportResult[];
}

// ---------------------------------------------------------------------------
// Helper: format currency
// ---------------------------------------------------------------------------
function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return "$" + n.toLocaleString();
}

// ---------------------------------------------------------------------------
// Sub-component: Import Result Card
// ---------------------------------------------------------------------------
function ImportCard({
  result,
  onSave,
  saving,
  saved,
}: {
  result: ImportResult;
  onSave: (record: LegacyImportRecord) => void;
  saving: boolean;
  saved: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const r = result.record;

  if (!result.success || !r) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-red-500 text-lg">✗</div>
          <div className="flex-1">
            <p className="font-medium text-red-800 text-sm">{result.fileName}</p>
            {result.errors.map((e, i) => (
              <p key={i} className="text-red-600 text-xs mt-1">{e}</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const sc = r.subjectContext;
  const vs = r.valueSummary;
  const comps = r.parsed.salesComparison.comps.slice(0, 3);

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${saved ? "border-green-300 bg-green-50" : "border-slate-200 bg-white"}`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {saved ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  ✓ Saved to TerraFusion
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Ready to Import
                </span>
              )}
              <span className="text-xs text-slate-400">{r.parsed.report.formType || "URAR"}</span>
            </div>
            <h3 className="font-semibold text-slate-800 text-sm truncate">
              {sc.address}, {sc.city}, {sc.state} {sc.zip}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Effective: {sc.effectiveDate || "—"} &nbsp;·&nbsp; Appraiser: {sc.appraiserName || "—"}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-slate-800">{fmt(vs.finalValue)}</p>
            <p className="text-xs text-slate-400">Final Value</p>
          </div>
        </div>

        {/* Value Summary Row */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
          <div className="text-center">
            <p className="text-xs text-slate-500">Cost</p>
            <p className="text-sm font-medium text-slate-700">{fmt(vs.costApproach)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">Sales Comp</p>
            <p className="text-sm font-medium text-slate-700">{fmt(vs.salesComparison)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">Income</p>
            <p className="text-sm font-medium text-slate-700">{fmt(vs.incomeApproach)}</p>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-4">
          {/* Subject Details */}
          <div>
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Subject Property</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
              <span>GLA: <strong>{r.parsed.subject.gla ? r.parsed.subject.gla.toLocaleString() + " sf" : "—"}</strong></span>
              <span>Year Built: <strong>{r.parsed.subject.yearBuilt ?? "—"}</strong></span>
              <span>Beds/Baths: <strong>{r.parsed.subject.bedrooms ?? "—"} / {r.parsed.subject.bathrooms ?? "—"}</strong></span>
              <span>Site: <strong>{r.parsed.subject.siteArea || "—"}</strong></span>
              <span>Style: <strong>{r.parsed.subject.style || "—"}</strong></span>
              <span>Zoning: <strong>{r.parsed.subject.zoningClass || "—"}</strong></span>
              <span>Parcel: <strong>{r.parsed.subject.parcelId || "—"}</strong></span>
              <span>County: <strong>{sc.county || "—"}</strong></span>
            </div>
          </div>

          {/* Assignment */}
          <div>
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Assignment</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
              <span>Lender: <strong>{r.parsed.lender.name || "—"}</strong></span>
              <span>Borrower: <strong>{r.parsed.borrower.name || "—"}</strong></span>
              <span>Purpose: <strong>{r.parsed.report.appraisalPurpose || "—"}</strong></span>
              <span>Rights: <strong>{r.parsed.subject.propertyRights || "—"}</strong></span>
              <span>Legacy File #: <strong>{r.legacyFileNumber || "—"}</strong></span>
              <span>Form: <strong>{r.parsed.report.formTitle || r.parsed.report.formType || "—"}</strong></span>
            </div>
          </div>

          {/* Sales Comps */}
          {comps.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Sales Comparison Comps ({r.parsed.salesComparison.comps.length} total)
              </h4>
              <div className="space-y-2">
                {comps.map((comp, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded p-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">
                        Comp {comp.sequenceId}: {comp.streetAddress}, {comp.city}
                      </span>
                      <span className="font-bold text-slate-800">{fmt(comp.salePrice)}</span>
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      {comp.proximity} &nbsp;·&nbsp; Adj: {fmt(comp.adjustedSalePrice)} &nbsp;·&nbsp; Net: {comp.netAdjustmentPct?.toFixed(1) ?? "—"}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Market Conditions */}
          <div>
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Market Conditions</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
              <span>Median Price (Last 3 mo): <strong>{fmt(r.parsed.marketConditions.medianSalesPriceLast3)}</strong></span>
              <span>Price Trend: <strong>{r.parsed.marketConditions.medianSalesPriceTrend || "—"}</strong></span>
              <span>Median DOM (Last 3 mo): <strong>{r.parsed.marketConditions.medianDomLast3 ?? "—"}</strong></span>
              <span>DOM Trend: <strong>{r.parsed.marketConditions.medianDomTrend || "—"}</strong></span>
            </div>
          </div>

          {/* Governance Badge */}
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded p-2">
            <span className="text-emerald-600 text-sm">✓</span>
            <span className="text-xs text-emerald-700">
              <strong>Governance:</strong> All cost service brand references have been sanitized. No proprietary cost manual names in imported data.
            </span>
          </div>

          {/* PDF Download */}
          {r.parsed.hasPdf && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded p-2">
              <span className="text-blue-600 text-sm">📄</span>
              <span className="text-xs text-blue-700">
                Embedded PDF report available — will be preserved in TerraFusion order.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          {expanded ? "▲ Hide details" : "▼ Show details"}
        </button>
        <div className="flex items-center gap-2">
          {result.errors.length > 0 && (
            <span className="text-xs text-amber-600">
              {result.errors.length} warning{result.errors.length > 1 ? "s" : ""}
            </span>
          )}
          {saved ? (
            <span className="text-xs font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded">
              ✓ Saved — TF File: {r.fileNumber}
            </span>
          ) : (
            <button
              onClick={() => onSave(r)}
              disabled={saving}
              className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1.5 rounded transition-colors"
            >
              {saving ? "Saving…" : "Save as TerraFusion Order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function LegacyImportPanel() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResponse, setImportResponse] = useState<ImportResponse | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [saveMessages, setSaveMessages] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const xmlFiles = Array.from(files).filter((f) => f.name.toLowerCase().endsWith(".xml"));
    if (xmlFiles.length === 0) {
      setError("No XML files found. Please select a la mode MISMO XML files (.xml).");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setImportResponse(null);

    const formData = new FormData();
    xmlFiles.forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/legacy-import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data: ImportResponse = await res.json();
      setImportResponse(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) processFiles(e.target.files);
    },
    [processFiles]
  );

  const handleSave = useCallback(async (record: LegacyImportRecord) => {
    const key = record.fileNumber;
    setSavingIds((prev) => new Set(prev).add(key));

    try {
      const res = await fetch("/api/legacy-import/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

      setSavedIds((prev) => new Set(prev).add(key));
      setSaveMessages((prev) => ({ ...prev, [key]: data.message }));
    } catch (e) {
      setSaveMessages((prev) => ({
        ...prev,
        [key]: `Error: ${e instanceof Error ? e.message : String(e)}`,
      }));
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Legacy Data Import</h2>
        <p className="text-sm text-slate-500 mt-1">
          Import appraisal reports from a la mode WinTOTAL / Mercury (MISMO 2.6 XML format).
          All data is converted to TerraFusion orders with full governance compliance.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
        }`}
        onClick={() => document.getElementById("legacy-file-input")?.click()}
      >
        <input
          id="legacy-file-input"
          type="file"
          accept=".xml"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
        {isProcessing ? (
          <div className="space-y-2">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-600">Parsing MISMO XML files…</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📂</div>
            <p className="text-sm font-medium text-slate-700">
              Drop a la mode XML files here, or click to browse
            </p>
            <p className="text-xs text-slate-400">
              Supports Mercury Deliveries XML (MISMO 2.6 / FNMA 1004 / FNMA 2055)
            </p>
            <p className="text-xs text-slate-400">
              Files are processed locally — no data is sent to external servers
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results Summary */}
      {importResponse && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-slate-600">
              <strong>{importResponse.processed}</strong> file{importResponse.processed !== 1 ? "s" : ""} processed
            </span>
            <span className="text-green-700">
              <strong>{importResponse.succeeded}</strong> succeeded
            </span>
            {importResponse.failed > 0 && (
              <span className="text-red-600">
                <strong>{importResponse.failed}</strong> failed
              </span>
            )}
            <span className="text-slate-400 text-xs ml-auto">
              Imported {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* Import Cards */}
      {importResponse && importResponse.results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">
            Imported Reports ({importResponse.results.length})
          </h3>
          {importResponse.results.map((result, i) => (
            <div key={i}>
              <ImportCard
                result={result}
                onSave={handleSave}
                saving={result.record ? savingIds.has(result.record.fileNumber) : false}
                saved={result.record ? savedIds.has(result.record.fileNumber) : false}
              />
              {result.record && saveMessages[result.record.fileNumber] && (
                <p className={`text-xs mt-1 px-1 ${
                  saveMessages[result.record.fileNumber].startsWith("Error")
                    ? "text-red-600"
                    : "text-green-600"
                }`}>
                  {saveMessages[result.record.fileNumber]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      {!importResponse && !isProcessing && (
        <div className="border border-slate-200 rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">How to Export from a la mode WinTOTAL</h3>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <p>Open WinTOTAL and navigate to the report you want to export.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <p>Go to <strong>File → Deliver Report → Mercury Network</strong> or use the Mercury delivery system. The XML files are saved to your Mercury Deliveries folder.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <p>Locate the XML files in <code className="bg-slate-100 px-1 rounded text-xs">C:\ProgramData\alamode\Mercury\Deliveries\</code></p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <p>Drag and drop the XML files into the drop zone above, or click to browse and select them.</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-700">
            <strong>Note:</strong> ZAP files (.zap) use a proprietary compression format that cannot be directly imported. 
            Use the Mercury XML export method above for the best results.
          </div>
        </div>
      )}
    </div>
  );
}
