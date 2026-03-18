"use client";

/**
 * TerraFusion Valuator Pro — Workbench Page
 *
 * The primary fee-appraiser workspace. Hosts the SubjectWorkbenchProvider
 * and routes between analytical tabs: Subject, Cost, Sales, Income,
 * Reconciliation, and Report.
 *
 * This is the governed surface — no tab can dispatch an analytical run
 * without a ready SubjectContext and a reason_code.
 */

import { SubjectWorkbenchProvider, useSubjectWorkbench, WorkbenchTab } from "@/lib/subject-workbench-context";
import { SubjectPanel } from "@/components/subject-panel";
import { CostForgePanel } from "@/components/costforge-panel";
import {
  ClipboardList,
  Building2,
  BarChart3,
  TrendingUp,
  Scale,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
const TABS: Array<{
  id: WorkbenchTab;
  label: string;
  icon: React.ReactNode;
  description: string;
  phase: "A" | "B" | "C" | "D" | "E";
  available: boolean;
}> = [
  {
    id: "subject",
    label: "Subject",
    icon: <ClipboardList className="w-4 h-4" />,
    description: "Assignment conditions & subject property",
    phase: "A",
    available: true,
  },
  {
    id: "cost",
    label: "Cost Approach",
    icon: <Building2 className="w-4 h-4" />,
    description: "TerraFusion CostForge — UAD CST fields",
    phase: "B",
    available: true,
  },
  {
    id: "sales",
    label: "Sales Comparison",
    icon: <BarChart3 className="w-4 h-4" />,
    description: "Comp grid, regression extraction, adjustments",
    phase: "C",
    available: false,
  },
  {
    id: "income",
    label: "Income Approach",
    icon: <TrendingUp className="w-4 h-4" />,
    description: "Direct cap & DCF with evidence lineage",
    phase: "C",
    available: false,
  },
  {
    id: "reconcile",
    label: "Reconciliation",
    icon: <Scale className="w-4 h-4" />,
    description: "Approach weighting & final value opinion",
    phase: "D",
    available: false,
  },
  {
    id: "report",
    label: "Report",
    icon: <FileText className="w-4 h-4" />,
    description: "Narrative assembly & export",
    phase: "E",
    available: false,
  },
];

// ---------------------------------------------------------------------------
// Inner workbench (needs context)
// ---------------------------------------------------------------------------
function WorkbenchInner() {
  const { activeTab, setActiveTab, subjectReady, runHistory, subject } = useSubjectWorkbench();

  const currentTab = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <div className="w-px h-4 bg-zinc-700" />
          <div>
            <span className="text-sm font-semibold text-zinc-100">TerraFusion Valuator Pro</span>
            <span className="ml-2 text-xs text-zinc-500">Appraisal Workbench</span>
          </div>
          {subject.fileNumber && (
            <>
              <div className="w-px h-4 bg-zinc-700" />
              <span className="text-xs font-mono text-emerald-400">
                File: {subject.fileNumber}
              </span>
            </>
          )}
          {subject.address && (
            <span className="text-xs text-zinc-500 truncate max-w-xs">
              {subject.address}, {subject.city}, {subject.state}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {subjectReady ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              Subject Ready
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              Subject Incomplete
            </div>
          )}
          {runHistory.length > 0 && (
            <div className="text-xs text-zinc-500">
              {runHistory.length} run{runHistory.length !== 1 ? "s" : ""} this session
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/40 px-6">
        <div className="flex gap-0">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDisabled = !tab.available;
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors
                  ${isActive
                    ? "border-emerald-500 text-emerald-400"
                    : isDisabled
                    ? "border-transparent text-zinc-700 cursor-not-allowed"
                    : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                  }
                `}
              >
                {tab.icon}
                {tab.label}
                {isDisabled && (
                  <span className="text-[10px] bg-zinc-800 text-zinc-600 px-1 rounded font-mono">
                    Phase {tab.phase}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "subject" && <SubjectPanel />}
        {activeTab === "cost" && <CostForgePanel />}
        {(activeTab === "sales" || activeTab === "income" || activeTab === "reconcile" || activeTab === "report") && (
          <div className="flex items-center justify-center h-64 text-zinc-600">
            <div className="text-center">
              <div className="text-4xl mb-3">🔧</div>
              <div className="text-sm font-medium">
                {currentTab.label} — Coming in Phase {currentTab.phase}
              </div>
              <div className="text-xs text-zinc-700 mt-1">{currentTab.description}</div>
            </div>
          </div>
        )}
      </div>

      {/* Run history footer */}
      {runHistory.length > 0 && (
        <div className="border-t border-zinc-800 bg-zinc-900/60 px-6 py-2">
          <div className="flex items-center gap-4 overflow-x-auto">
            <span className="text-xs text-zinc-600 shrink-0">Run History:</span>
            {runHistory.slice(-5).map((run) => (
              <div
                key={run.runId}
                className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded border shrink-0 ${
                  run.status === "complete"
                    ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-400"
                    : run.status === "failed"
                    ? "bg-red-950/30 border-red-800/40 text-red-400"
                    : "bg-zinc-900 border-zinc-700 text-zinc-400"
                }`}
              >
                <span className="font-mono">{run.runType}</span>
                <span className="text-zinc-600">·</span>
                <span>{run.status}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-600">{new Date(run.startedAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export — wraps with provider
// ---------------------------------------------------------------------------
export default function WorkbenchPage() {
  return (
    <SubjectWorkbenchProvider>
      <WorkbenchInner />
    </SubjectWorkbenchProvider>
  );
}
