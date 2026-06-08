"use client";

/**
 * ReportPanel
 *
 * Governed report assembly UI for TerraFusion Valuator Pro.
 * Pulls all data from SubjectWorkbenchContext (real governed data, not mock engines).
 * Generates USPAP-aware AI narratives for each report section.
 * Exports to print-ready HTML via the /api/export-pdf endpoint.
 *
 * Report Sections (USPAP SR 2-2):
 *  1. Subject Property Description
 *  2. Scope of Work
 *  3. Market Conditions Analysis
 *  4. Highest & Best Use
 *  5. Cost Approach Summary
 *  6. Sales Comparison Summary
 *  7. Income Approach Summary
 *  8. Value Reconciliation & Final Opinion
 *  9. USPAP Certification
 *  10. Assumptions & Limiting Conditions
 */

import { useState, useCallback } from "react";
import { useSubjectWorkbench } from "@/lib/subject-workbench-context";
import { FileText, Sparkles, Copy, Check, RefreshCw, Printer, CheckCircle, AlertCircle } from "lucide-react";

type NarrativeSection =
  | "property_description"
  | "scope_of_work"
  | "market_conditions"
  | "highest_best_use"
  | "cost_approach"
  | "sales_comparison"
  | "income_approach"
  | "reconciliation";

const SECTIONS: Array<{
  key: NarrativeSection;
  title: string;
  uspap: string;
  description: string;
}> = [
  { key: "property_description", title: "Subject Property Description", uspap: "SR 2-2(a)(vii)", description: "Property characteristics, improvements, and legal description" },
  { key: "scope_of_work", title: "Scope of Work", uspap: "SR 2-2(a)(iii)", description: "What was and was not inspected, researched, and analyzed" },
  { key: "market_conditions", title: "Market Conditions", uspap: "SR 1-3(a)", description: "Neighborhood, market area, supply/demand, and market trends" },
  { key: "highest_best_use", title: "Highest & Best Use", uspap: "SR 1-3(b)", description: "As vacant and as improved — four tests" },
  { key: "cost_approach", title: "Cost Approach", uspap: "SR 1-4(b)", description: "Replacement cost, depreciation, and land value" },
  { key: "sales_comparison", title: "Sales Comparison Approach", uspap: "SR 1-4(a)", description: "Comparable sales, adjustments, and reconciliation" },
  { key: "income_approach", title: "Income Approach", uspap: "SR 1-4(c)", description: "PGI, EGI, NOI, capitalization, and DCF" },
  { key: "reconciliation", title: "Value Reconciliation & Final Opinion", uspap: "SR 1-6", description: "Approach weighting and final opinion of value" },
];

export function ReportPanel() {
  const { subject, runHistory } = useSubjectWorkbench();
  const [narratives, setNarratives] = useState<Partial<Record<NarrativeSection, string>>>({});
  const [loading, setLoading] = useState<NarrativeSection | null>(null);
  const [copied, setCopied] = useState<NarrativeSection | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Extract approach values from run history
  const latestCostRun = [...runHistory].reverse().find((r) => r.runType === "cost");
  const latestSalesRun = [...runHistory].reverse().find((r) => r.runType === "sales_comparison");
  const latestIncomeRun = [...runHistory].reverse().find(
    (r) => r.runType === "income_direct_cap" || r.runType === "income_dcf"
  );

  const costValue = latestCostRun?.outputSnapshot?.indicatedValue as number | undefined;
  const salesValue = latestSalesRun?.outputSnapshot?.reconciledValue as number | undefined;
  const incomeValue = latestIncomeRun?.outputSnapshot?.directCapValue as number | undefined;

  // Build context for AI narrative generation
  const buildNarrativeContext = useCallback((section: NarrativeSection) => {
    return {
      type: section,
      subject: {
        address: subject.address,
        city: subject.city,
        state: subject.state,
        zip: subject.zip,
        county: subject.county,
        propertyType: subject.propertyType,
        squareFeet: subject.gla,
        yearBuilt: subject.yearBuilt,
        condition: subject.condition,
        bedrooms: subject.bedrooms,
        bathrooms: subject.bathrooms,
        landAreaAcres: subject.siteArea ? subject.siteArea / 43560 : undefined,
        zoning: subject.zoning,
        legalDescription: subject.parcelNumber ? `See public records — APN: ${subject.parcelNumber}` : undefined,
      },
      approaches: {
        cost: costValue,
        costWeight: latestCostRun?.inputSnapshot?.weight as number | undefined,
        salesComp: salesValue,
        salesCompWeight: latestSalesRun?.inputSnapshot?.weight as number | undefined,
        income: incomeValue,
        incomeWeight: latestIncomeRun?.inputSnapshot?.weight as number | undefined,
        final: salesValue ?? costValue ?? incomeValue,
      },
      runHistory: runHistory.slice(-10).map((r) => ({
        runType: r.runType,
        status: r.status,
        outputSnapshot: r.outputSnapshot,
      })),
      intendedUse: subject.intendedUse,
      propertyRights: subject.propertyRights,
      effectiveDate: subject.effectiveDate,
      reportType: subject.reportType,
      inspectionType: subject.inspectionType,
      scopeOfWork: subject.scopeOfWork,
    };
  }, [subject, runHistory, costValue, salesValue, incomeValue, latestCostRun, latestSalesRun, latestIncomeRun]);

  const generateNarrative = useCallback(async (section: NarrativeSection) => {
    setLoading(section);
    try {
      const resp = await fetch("/api/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildNarrativeContext(section)),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "Narrative generation failed");
      setNarratives((prev) => ({ ...prev, [section]: data.narrative }));
    } catch (err) {
      setNarratives((prev) => ({
        ...prev,
        [section]: `[Error: ${err instanceof Error ? err.message : "Unknown error"}]`,
      }));
    } finally {
      setLoading(null);
    }
  }, [buildNarrativeContext]);

  const generateAll = useCallback(async () => {
    for (const section of SECTIONS) {
      await generateNarrative(section.key);
    }
  }, [generateNarrative]);

  const copyNarrative = useCallback(async (section: NarrativeSection) => {
    const text = narratives[section];
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(section);
    setTimeout(() => setCopied(null), 2000);
  }, [narratives]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const resp = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileNumber: subject.fileNumber ?? "DRAFT",
          address: subject.address ?? "",
          city: subject.city ?? "",
          state: subject.state ?? "",
          zip: subject.zip ?? "",
          county: subject.county ?? "",
          propertyType: subject.propertyType ?? "",
          gla: subject.gla ?? 0,
          yearBuilt: subject.yearBuilt ?? 0,
          condition: subject.condition ?? "Average",
          bedrooms: subject.bedrooms,
          bathrooms: subject.bathrooms,
          lotSize: subject.siteArea ? subject.siteArea / 43560 : 0,
          zoning: subject.zoning ?? "",
          effectiveDate: subject.effectiveDate ?? "",
          reportDate: subject.reportDate ?? "",
          clientName: subject.clientName ?? "",
          intendedUse: subject.intendedUse ?? "",
          reportType: subject.reportType ?? "",
          scopeOfWork: subject.scopeOfWork ?? "",
          salesCompValue: salesValue ?? 0,
          costValue: costValue ?? 0,
          incomeValue: incomeValue ?? 0,
          finalValue: salesValue ?? costValue ?? incomeValue ?? 0,
          salesCompWeight: 70,
          costWeight: 20,
          incomeWeight: 10,
          narratives,
          comps: [],
        }),
      });
      const html = await resp.text();
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 500);
      }
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  }, [subject, salesValue, costValue, incomeValue, narratives]);

  const completedSections = SECTIONS.filter((s) => narratives[s.key]).length;
  const subjectComplete = !!(subject.address && subject.city && subject.state);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[hsl(var(--tf-transcend-cyan))]" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Report Assembly</h2>
            <p className="text-xs text-muted-foreground">
              {completedSections}/{SECTIONS.length} sections drafted · USPAP SR 2-2
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateAll}
            disabled={loading !== null}
            className="h-8 px-3 text-xs rounded-md border border-[hsl(var(--tf-transcend-cyan)/0.4)] text-[hsl(var(--tf-transcend-cyan))] hover:bg-[hsl(var(--tf-transcend-cyan)/0.1)] disabled:opacity-50 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Draft All Sections
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !subjectComplete}
            className="h-8 px-3 text-xs rounded-md bg-[hsl(var(--tf-transcend-cyan))] text-background font-medium disabled:opacity-50 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            {isExporting ? "Exporting…" : "Export Report"}
          </button>
        </div>
      </div>

      {exportError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {exportError}
        </div>
      )}

      {/* Subject summary bar */}
      <div className="rounded-md border border-border bg-muted/20 px-4 py-2 flex items-center gap-6 text-xs">
        <div className="flex items-center gap-1.5">
          {subjectComplete ? (
            <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="text-muted-foreground">Subject:</span>
          <span className="font-medium">{subject.address ? `${subject.address}, ${subject.city}, ${subject.state}` : "Not set"}</span>
        </div>
        <div className="text-muted-foreground">File: <span className="font-mono">{subject.fileNumber ?? "—"}</span></div>
        <div className="text-muted-foreground">Effective: <span className="font-mono">{subject.effectiveDate ?? "—"}</span></div>
        {costValue && <div className="text-blue-400">Cost: <span className="font-mono">${costValue.toLocaleString()}</span></div>}
        {salesValue && <div className="text-cyan-400">Sales: <span className="font-mono">${salesValue.toLocaleString()}</span></div>}
        {incomeValue && <div className="text-amber-400">Income: <span className="font-mono">${incomeValue.toLocaleString()}</span></div>}
      </div>

      {/* Narrative sections */}
      <div className="space-y-3">
        {SECTIONS.map((section) => {
          const narrative = narratives[section.key];
          const isLoading = loading === section.key;
          const isCopied = copied === section.key;

          return (
            <div key={section.key} className="rounded-md border border-border p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[hsl(var(--tf-transcend-cyan)/0.1)] text-[hsl(var(--tf-transcend-cyan))]">
                      {section.uspap}
                    </span>
                    {narrative && (
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-4">
                  {narrative && (
                    <button
                      onClick={() => copyNarrative(section.key)}
                      className="h-7 px-2 text-xs rounded border border-border text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                  <button
                    onClick={() => generateNarrative(section.key)}
                    disabled={isLoading}
                    className="h-7 px-3 text-xs rounded border border-[hsl(var(--tf-transcend-cyan)/0.4)] text-[hsl(var(--tf-transcend-cyan))] hover:bg-[hsl(var(--tf-transcend-cyan)/0.1)] disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    {isLoading ? "Drafting…" : narrative ? "Redraft" : "AI Draft"}
                  </button>
                </div>
              </div>

              {isLoading && (
                <div className="rounded border border-[hsl(var(--tf-transcend-cyan)/0.2)] bg-[hsl(var(--tf-transcend-cyan)/0.05)] p-3 text-center">
                  <RefreshCw className="w-4 h-4 text-[hsl(var(--tf-transcend-cyan))] animate-spin mx-auto mb-1" />
                  <p className="text-xs text-[hsl(var(--tf-transcend-cyan))]">Drafting USPAP-aware narrative…</p>
                </div>
              )}

              {narrative && !isLoading && (
                <div className="rounded border border-cyan-500/20 bg-cyan-500/5 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    <span className="text-[10px] font-mono text-cyan-400 tracking-wider">AI-DRAFTED — REVIEW BEFORE FINALIZING</span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap font-mono">{narrative}</p>
                </div>
              )}

              {!narrative && !isLoading && (
                <div className="rounded border border-dashed border-border/40 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Click "AI Draft" to generate a USPAP-aware narrative for this section.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
