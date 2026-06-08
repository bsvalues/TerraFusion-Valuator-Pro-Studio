"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  SubjectWorkbenchProvider,
  useSubjectWorkbench,
} from "@/lib/subject-workbench-context";
import { SubjectPanel } from "@/components/subject-panel";
import { CostForgePanel } from "@/components/costforge-panel";
import { SalesComparisonPanel } from "@/components/sales-comparison-panel";
import { IncomeApproachPanel } from "@/components/income-approach-panel";
import { ReconciliationPanel } from "@/components/reconciliation-panel";

type Tab = "subject" | "cost" | "sales" | "income" | "reconcile" | "evidence" | "certify";

const TABS: { id: Tab; label: string }[] = [
  { id: "subject", label: "Subject" },
  { id: "cost", label: "Cost" },
  { id: "sales", label: "Sales" },
  { id: "income", label: "Income" },
  { id: "reconcile", label: "Reconciliation" },
  { id: "evidence", label: "Evidence" },
  { id: "certify", label: "Certify" },
];

interface EvidenceItem {
  evidenceId: string;
  sourceType: string;
  sourceLabel: string;
}
interface DraftArtifact {
  draftId: string;
  text: string;
  providerId: string;
}
interface CertifiedValue {
  value: number;
  certifiedBy: string;
  reasonCode: string;
  certifiedAt: string;
}
interface WorkfileMeta {
  status: string;
  tier: string;
  title: string;
  evidence: EvidenceItem[];
  drafts: DraftArtifact[];
  certifiedValue: CertifiedValue | null;
  traceCount: number;
}

const usd = (n?: number) =>
  typeof n === "number" && n > 0
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";

function WorkfileInner({ id }: { id: string }) {
  const { subject, runHistory, subjectReady, missingFields, hydrating, persistenceError } = useSubjectWorkbench();
  const [tab, setTab] = useState<Tab>("subject");
  const [meta, setMeta] = useState<WorkfileMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // evidence form
  const [evType, setEvType] = useState("mls_sale");
  const [evLabel, setEvLabel] = useState("");
  // certify form
  const [finalInput, setFinalInput] = useState("");
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);

  const loadMeta = useCallback(async () => {
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
        evidence: w.evidence,
        drafts: w.drafts,
        certifiedValue: w.certifiedValue,
        traceCount: Array.isArray(td.events) ? td.events.length : 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [id]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  // Approach values from the persisted runs (single source — no parallel path)
  const rev = [...runHistory].reverse();
  const num = (v: unknown) => (typeof v === "number" ? v : undefined);
  const costValue = num(rev.find((r) => r.runType === "cost")?.outputSnapshot?.indicatedValue);
  const salesValue = num(rev.find((r) => r.runType === "sales_comparison")?.outputSnapshot?.reconciledValue);
  const incomeValue = num(
    rev.find((r) => r.runType === "income_direct_cap" || r.runType === "income_dcf")?.outputSnapshot?.directCapValue,
  );
  const reconFinal = num(rev.find((r) => r.runType === "reconciliation")?.outputSnapshot?.finalValue);

  useEffect(() => {
    if (reconFinal && !finalInput) setFinalInput(String(reconFinal));
  }, [reconFinal, finalInput]);

  const addEvidence = async () => {
    setBusy("evidence");
    try {
      const r = await fetch(`/api/tfpr/assignments/${id}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType: evType, sourceLabel: evLabel, sourceId: "manual" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setEvLabel("");
      await loadMeta();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const runMuse = async () => {
    setBusy("muse");
    try {
      const r = await fetch(`/api/tfpr/assignments/${id}/muse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capabilityId: "draft_reconciliation_narrative",
          context: {
            subjectAddress: subject.address,
            costValue,
            salesValue,
            incomeValue,
            finalValue: reconFinal ?? (finalInput ? Number(finalInput) : undefined),
          },
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await loadMeta();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const certify = async () => {
    setBusy("certify");
    try {
      const r = await fetch(`/api/tfpr/assignments/${id}/certify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: finalInput ? Number(finalInput) : NaN,
          reasonCode: reason,
          confirmed: confirm,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setConfirm(false);
      setReason("");
      await loadMeta();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/assignments" className="text-xs text-cyan-400">← My Assignments</Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{meta?.title ?? "Workfile"}</h1>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {meta?.status ?? "…"} · tier {meta?.tier ?? "…"} · {subjectReady ? "subject ready" : "subject incomplete"}
            {hydrating ? " · loading…" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/tfpr/assignments/${id}/report`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:border-cyan-500/50 hover:text-cyan-400"
          >
            Export Report →
          </a>
          <Link
            href={`/assignments/${id}/audit`}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:border-cyan-500/50 hover:text-cyan-400"
          >
            Inspect Audit Trace →
          </Link>
        </div>
      </div>

      {(error || persistenceError) && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error || persistenceError}
        </div>
      )}

      {/* Assignment Command Center — module tiles + workfile status */}
      {(() => {
        const certified = meta?.certifiedValue ?? null;
        const ev = meta?.evidence.length ?? 0;
        const drafts = meta?.drafts.length ?? 0;
        type Tone = "done" | "attention" | "idle";
        const toneCls: Record<Tone, string> = {
          done: "border-cyan-500/40 text-cyan-400",
          attention: "border-amber-500/40 text-amber-400",
          idle: "border-border text-muted-foreground",
        };
        const exportReady = certified ? "Ready to export" : costValue || salesValue || incomeValue ? "Draft export" : "Not ready";
        const tiles: Array<{ label: string; status: string; tone: Tone; tab?: Tab; href?: string }> = [
          { label: "Subject & Scope", status: subjectReady ? "Ready" : `${missingFields.length} missing`, tone: subjectReady ? "done" : "attention", tab: "subject" },
          { label: "Evidence Ledger", status: `${ev} item${ev === 1 ? "" : "s"}`, tone: ev ? "done" : "attention", tab: "evidence" },
          { label: "CostForge", status: costValue ? usd(costValue) : "Not run", tone: costValue ? "done" : "idle", tab: "cost" },
          { label: "CompForge", status: salesValue ? usd(salesValue) : "Not run", tone: salesValue ? "done" : "idle", tab: "sales" },
          { label: "IncomeForge", status: incomeValue ? usd(incomeValue) : "Not run", tone: incomeValue ? "done" : "idle", tab: "income" },
          { label: "Reconciliation", status: reconFinal ? usd(reconFinal) : "Pending", tone: reconFinal ? "done" : "idle", tab: "reconcile" },
          { label: "MUSE Review", status: `${drafts} draft${drafts === 1 ? "" : "s"}`, tone: drafts ? "done" : "idle", tab: "reconcile" },
          { label: "Certify", status: certified ? usd(certified.value) : reconFinal ? "Ready" : "Pending", tone: certified ? "done" : reconFinal ? "attention" : "idle", tab: "certify" },
          { label: "ReportForge", status: exportReady, tone: certified ? "done" : costValue || salesValue || incomeValue ? "attention" : "idle", href: `/api/tfpr/assignments/${id}/report` },
          { label: "Audit / Workfile", status: `${meta?.traceCount ?? 0} events`, tone: "idle", href: `/assignments/${id}/audit` },
        ];
        return (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {tiles.map((t) => {
              const inner = (
                <>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t.label}</p>
                  <p className="mt-0.5 font-mono text-sm">{t.status}</p>
                </>
              );
              const cls = `rounded-lg border p-3 text-left transition-colors hover:border-cyan-500/50 ${toneCls[t.tone]}`;
              return t.href ? (
                <a key={t.label} href={t.href} target={t.href.startsWith("/api") ? "_blank" : undefined} rel="noreferrer" className={cls}>
                  {inner}
                </a>
              ) : (
                <button key={t.label} onClick={() => t.tab && setTab(t.tab)} className={cls}>
                  {inner}
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* Tabs */}
      <div className="flex flex-wrap gap-0 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-4 py-2 text-sm transition-colors ${
              tab === t.id
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panels (mounted inside the persistence-bound provider) */}
      <div>
        {tab === "subject" && <SubjectPanel />}
        {tab === "cost" && <CostForgePanel />}
        {tab === "sales" && <SalesComparisonPanel />}
        {tab === "income" && <IncomeApproachPanel />}
        {tab === "reconcile" && (
          <div className="space-y-5">
            <ReconciliationPanel />
            {/* MUSE */}
            <div className="rounded-xl border border-border p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">MUSE — reconciliation narrative</h3>
                <button
                  onClick={runMuse}
                  disabled={busy === "muse"}
                  className="h-9 rounded-md border border-cyan-500/50 px-4 text-sm font-semibold text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50"
                >
                  {busy === "muse" ? "Drafting…" : "Draft with MUSE (write_low)"}
                </button>
              </div>
              <ul className="mt-3 space-y-3">
                {meta?.drafts.map((d) => (
                  <li key={d.draftId} className="rounded-md border border-border p-3">
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                      Draft · non-final
                    </span>
                    <pre className="mt-2 whitespace-pre-wrap text-xs text-foreground/90">{d.text}</pre>
                  </li>
                ))}
                {(!meta || meta.drafts.length === 0) && <li className="text-xs text-muted-foreground">No drafts yet.</li>}
              </ul>
            </div>
          </div>
        )}
        {tab === "evidence" && (
          <div className="rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold">Evidence Ledger ({meta?.evidence.length ?? 0})</h3>
            <div className="mt-3 flex gap-2">
              <select value={evType} onChange={(e) => setEvType(e.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-xs">
                <option value="mls_sale">mls_sale</option>
                <option value="public_record">public_record</option>
                <option value="cost_manual">cost_manual</option>
                <option value="income_survey">income_survey</option>
                <option value="appraiser_judgment">appraiser_judgment</option>
              </select>
              <input
                value={evLabel}
                onChange={(e) => setEvLabel(e.target.value)}
                placeholder="Evidence label"
                className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm"
              />
              <button
                onClick={addEvidence}
                disabled={busy === "evidence" || !evLabel.trim()}
                className="h-9 rounded-md border border-border px-4 text-sm font-semibold hover:border-cyan-500/50 hover:text-cyan-400 disabled:opacity-50"
              >
                Add
              </button>
            </div>
            <ul className="mt-3 space-y-1">
              {meta?.evidence.map((e) => (
                <li key={e.evidenceId} className="flex items-center gap-2 text-xs">
                  <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan-400">{e.sourceType}</span>
                  {e.sourceLabel}
                </li>
              ))}
              {(!meta || meta.evidence.length === 0) && <li className="text-xs text-muted-foreground">No evidence yet.</li>}
            </ul>
          </div>
        )}
        {tab === "certify" && (
          <div className="rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold">
              Certify Opinion of Value <span className="text-[10px] uppercase tracking-wide text-amber-400">write_high</span>
            </h3>
            {meta?.certifiedValue ? (
              <div className="mt-3 rounded-md border-2 border-cyan-500/40 bg-cyan-500/10 p-4">
                <p className="text-[10px] uppercase tracking-wider text-cyan-400">Certified opinion of value</p>
                <p className="mt-1 font-mono text-2xl font-bold text-cyan-400">{usd(meta.certifiedValue.value)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  by {meta.certifiedValue.certifiedBy} · “{meta.certifiedValue.reasonCode}” ·{" "}
                  {new Date(meta.certifiedValue.certifiedAt).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  Certify target = reconciliation final value ({usd(reconFinal)}). Finalize the Reconciliation tab first.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-muted-foreground">
                    Final value
                    <input type="number" value={finalInput} onChange={(e) => setFinalInput(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm font-mono" />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Reason code (required)
                    <input value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm" />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-xs text-foreground">
                  <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
                  I confirm this is my final certified opinion of value.
                </label>
                <button
                  onClick={certify}
                  disabled={busy === "certify"}
                  className="h-9 rounded-md bg-cyan-500 px-4 text-sm font-semibold text-background hover:bg-cyan-400 disabled:opacity-50"
                >
                  {busy === "certify" ? "Certifying…" : "Certify Opinion of Value"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <SubjectWorkbenchProvider assignmentId={id}>
      <WorkfileInner id={id} />
    </SubjectWorkbenchProvider>
  );
}
