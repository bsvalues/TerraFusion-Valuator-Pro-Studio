"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SubjectSection from "@/components/form/SubjectSection";
import CompGrid from "@/components/form/CompGrid";
import ReconciliationSection from "@/components/form/ReconciliationSection";
import ProjectSection from "@/components/form/ProjectSection";
import { blank1073, blankProject, WorkfileDef, WorkfileProject } from "@/lib/workfile-types";
import { createWorkfile, saveWorkfile, getWorkfile, updateOrder } from "@/lib/api";

type SaveState = "idle" | "saving" | "saved" | "error";
type LoadState = "idle" | "loading" | "ready" | "error";

function WorkbenchInner() {
  const searchParams = useSearchParams();
  const urlWorkfileId = searchParams?.get("id") ?? null;
  const urlOrderId = searchParams?.get("order") ?? null;

  const [wf, setWf] = useState<WorkfileDef>(() => blank1073());
  const [workfileId, setWorkfileId] = useState<string | null>(urlWorkfileId);
  const [orderId] = useState<string | null>(urlOrderId);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loadState, setLoadState] = useState<LoadState>(urlWorkfileId ? "loading" : "ready");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!urlWorkfileId) return;
    setLoadState("loading");
    getWorkfile(urlWorkfileId)
      .then((record) => {
        setWf(record.data);
        setWorkfileId(record.id);
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
  }, [urlWorkfileId]);

  function update(partial: Partial<WorkfileDef>) {
    setWf((prev) => ({ ...prev, ...partial }));
    setDirty(true);
    setSaveState("idle");
  }

  const save = useCallback(async () => {
    if (!dirty) return;
    setSaveState("saving");
    try {
      let record;
      if (workfileId) {
        record = await saveWorkfile(workfileId, wf);
      } else {
        record = await createWorkfile(wf);
        const newId = record.id;
        setWorkfileId(newId);
        if (orderId) {
          await updateOrder(orderId, { workfile_id: newId, status: "in-progress" }).catch(() => {});
        }
        window.history.replaceState({}, "", `/1073?id=${newId}${orderId ? `&order=${orderId}` : ""}`);
      }
      void record;
      setSaveState("saved");
      setLastSaved(new Date().toLocaleTimeString());
      setDirty(false);
    } catch {
      setSaveState("error");
    }
  }, [dirty, wf, workfileId, orderId]);

  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(save, 2000);
    return () => clearTimeout(t);
  }, [dirty, save]);

  const saveLabel = {
    idle: "Save",
    saving: "Saving…",
    saved: lastSaved ? `Saved ${lastSaved}` : "Saved",
    error: "Save failed — retry",
  }[saveState];

  if (loadState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <p className="text-sm text-slate-400">Loading workfile…</p>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="text-center">
          <p className="text-sm text-red-500 mb-3">Failed to load workfile {urlWorkfileId?.slice(0, 8)}</p>
          <Link href="/orders" className="text-xs text-blue-600 hover:underline">← Back to Orders</Link>
        </div>
      </div>
    );
  }

  const project: WorkfileProject = wf.project ?? blankProject();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/orders" className="text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600">
            TotalForge
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-xs text-slate-400">FNMA 1073 — Individual Condominium Unit Appraisal Report</span>
        </div>
        <div className="flex items-center gap-3">
          {workfileId && (
            <span className="font-mono text-[10px] text-slate-400">{workfileId.slice(0, 8)}</span>
          )}
          {workfileId && (
            <a
              href={`/api/workfiles/${workfileId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded px-3 py-1 text-xs font-semibold bg-slate-700 text-white hover:bg-slate-600 transition-colors"
            >
              Print PDF
            </a>
          )}
          <button
            onClick={save}
            disabled={saveState === "saving" || !dirty}
            className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
              saveState === "error"
                ? "bg-red-500 text-white hover:bg-red-600"
                : saveState === "saved"
                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
            }`}
          >
            {saveLabel}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 p-4">
        <SubjectSection
          subject={wf.subject}
          onChange={(subject) => update({ subject })}
        />
        <ProjectSection
          project={project}
          onChange={(p) => update({ project: p })}
        />
        <CompGrid
          comparables={wf.comparables}
          onChange={(comparables) => update({ comparables })}
        />
        <ReconciliationSection
          reconciliation={wf.reconciliation}
          onChange={(reconciliation) => update({ reconciliation })}
        />
      </main>
    </div>
  );
}

export default function WorkbenchPage1073() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
          <p className="text-sm text-slate-400">Loading…</p>
        </div>
      }
    >
      <WorkbenchInner />
    </Suspense>
  );
}
