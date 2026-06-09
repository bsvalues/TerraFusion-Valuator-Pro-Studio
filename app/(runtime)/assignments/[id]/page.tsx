"use client";

/**
 * Assignment Command Center (index) — module-tile overview of workfile status.
 * Tiles link to first-class module routes; the provider is hosted by the layout.
 */

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSubjectWorkbench } from "@/lib/subject-workbench-context";

interface WorkfileMeta {
  status: string;
  tier: string;
  title: string;
  evidenceCount: number;
  draftCount: number;
  certifiedValue: number | null;
  traceCount: number;
}

const usd = (n?: number | null) =>
  typeof n === "number" && n > 0
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";

type Tone = "done" | "attention" | "idle";
const toneCls: Record<Tone, string> = {
  done: "border-cyan-500/40 text-cyan-400",
  attention: "border-amber-500/40 text-amber-400",
  idle: "border-border text-muted-foreground",
};

export default function CommandCenter({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const base = `/assignments/${id}`;
  const { runHistory, subjectReady, missingFields, hydrating, persistenceError } = useSubjectWorkbench();
  const [meta, setMeta] = useState<WorkfileMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [r, tr] = await Promise.all([
        fetch(`/api/tfpr/assignments/${id}`, { cache: "no-store" }),
        fetch(`/api/tfpr/assignments/${id}/trace`, { cache: "no-store" }),
      ]);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const td = await tr.json().catch(() => ({ events: [] }));
      const w = d.workfile;
      setMeta({
        status: w.assignment.status,
        tier: d.tier,
        title: w.assignment.title,
        evidenceCount: w.evidence.length,
        draftCount: w.drafts.length,
        certifiedValue: w.certifiedValue?.value ?? null,
        traceCount: Array.isArray(td.events) ? td.events.length : 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const rev = [...runHistory].reverse();
  const num = (v: unknown) => (typeof v === "number" ? v : undefined);
  const costValue = num(rev.find((r) => r.runType === "cost")?.outputSnapshot?.indicatedValue);
  const salesValue = num(rev.find((r) => r.runType === "sales_comparison")?.outputSnapshot?.reconciledValue);
  const incomeValue = num(
    rev.find((r) => r.runType === "income_direct_cap" || r.runType === "income_dcf")?.outputSnapshot?.directCapValue,
  );
  const reconFinal = num(rev.find((r) => r.runType === "reconciliation")?.outputSnapshot?.finalValue);
  const certified = meta?.certifiedValue ?? null;
  const ev = meta?.evidenceCount ?? 0;
  const drafts = meta?.draftCount ?? 0;

  const tiles: Array<{ label: string; status: string; tone: Tone; href: string; external?: boolean }> = [
    { label: "Subject & Scope", status: subjectReady ? "Ready" : `${missingFields.length} missing`, tone: subjectReady ? "done" : "attention", href: `${base}/subject` },
    { label: "Evidence Ledger", status: `${ev} item${ev === 1 ? "" : "s"}`, tone: ev ? "done" : "attention", href: `${base}/evidence` },
    { label: "CostForge", status: costValue ? usd(costValue) : "Not run", tone: costValue ? "done" : "idle", href: `${base}/cost` },
    { label: "CompForge", status: salesValue ? usd(salesValue) : "Not run", tone: salesValue ? "done" : "idle", href: `${base}/sales` },
    { label: "IncomeForge", status: incomeValue ? usd(incomeValue) : "Not run", tone: incomeValue ? "done" : "idle", href: `${base}/income` },
    { label: "Reconciliation", status: reconFinal ? usd(reconFinal) : "Pending", tone: reconFinal ? "done" : "idle", href: `${base}/reconcile` },
    { label: "MUSE Review", status: `${drafts} draft${drafts === 1 ? "" : "s"}`, tone: drafts ? "done" : "idle", href: `${base}/reconcile` },
    { label: "Certify", status: certified ? usd(certified) : reconFinal ? "Ready" : "Pending", tone: certified ? "done" : reconFinal ? "attention" : "idle", href: `${base}/certify` },
    { label: "ReviewForge", status: "Run review", tone: "idle", href: `${base}/review` },
    { label: "ReportForge", status: certified ? "Ready to export" : costValue || salesValue || incomeValue ? "Draft export" : "Not ready", tone: certified ? "done" : costValue || salesValue || incomeValue ? "attention" : "idle", href: `/api/tfpr/assignments/${id}/report`, external: true },
    { label: "Audit / Workfile", status: `${meta?.traceCount ?? 0} events`, tone: "idle", href: `${base}/audit` },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{meta?.title ?? "Assignment"}</h1>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {meta?.status ?? "…"} · tier {meta?.tier ?? "…"} · {subjectReady ? "subject ready" : "subject incomplete"}
          {hydrating ? " · loading…" : ""}
        </p>
      </div>

      {(error || persistenceError) && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error || persistenceError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => {
          const inner = (
            <>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t.label}</p>
              <p className="mt-0.5 font-mono text-sm">{t.status}</p>
            </>
          );
          const cls = `rounded-lg border p-3 text-left transition-colors hover:border-cyan-500/50 ${toneCls[t.tone]}`;
          return t.external ? (
            <a key={t.label} href={t.href} target="_blank" rel="noreferrer" className={cls}>
              {inner}
            </a>
          ) : (
            <Link key={t.label} href={t.href} className={cls}>
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
