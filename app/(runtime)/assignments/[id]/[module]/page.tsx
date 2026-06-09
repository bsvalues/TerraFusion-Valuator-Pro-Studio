"use client";

/**
 * First-class module route — /assignments/[id]/[module].
 * Renders one appraisal module's surface inside the layout's persistence-bound
 * provider. Each module (cost/sales/income/reconcile/subject/evidence/certify)
 * is now directly addressable, navigable, and persistence-proven.
 */

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSubjectWorkbench } from "@/lib/subject-workbench-context";
import { SubjectPanel } from "@/components/subject-panel";
import { CostForgePanel } from "@/components/costforge-panel";
import { SalesComparisonPanel } from "@/components/sales-comparison-panel";
import { IncomeApproachPanel } from "@/components/income-approach-panel";
import { ReconciliationPanel } from "@/components/reconciliation-panel";
import type { ReviewFinding } from "@/lib/tfps/review";
import type { MarketPulseResult } from "@/lib/tfps/market-pulse";

interface EvidenceItem { evidenceId: string; sourceType: string; sourceLabel: string }
interface DraftArtifact { draftId: string; text: string; providerId: string }
interface CertifiedValue { value: number; certifiedBy: string; reasonCode: string; certifiedAt: string }
interface WorkfileMeta {
  evidence: EvidenceItem[];
  drafts: DraftArtifact[];
  certifiedValue: CertifiedValue | null;
}

const usd = (n?: number) =>
  typeof n === "number" && n > 0
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";

const KNOWN = ["subject", "cost", "sales", "income", "reconcile", "evidence", "certify", "review", "market"];

interface ReviewSummary { total: number; blockers: number; warnings: number; info: number }
const sevCls: Record<string, string> = {
  blocker: "border-red-500/50 text-red-400",
  warning: "border-amber-500/50 text-amber-400",
  info: "border-border text-muted-foreground",
};

export default function ModulePage({ params }: { params: Promise<{ id: string; module: string }> }) {
  const { id, module } = use(params);
  const { subject, runHistory } = useSubjectWorkbench();
  const [meta, setMeta] = useState<WorkfileMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [evType, setEvType] = useState("mls_sale");
  const [evLabel, setEvLabel] = useState("");
  const [finalInput, setFinalInput] = useState("");
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [review, setReview] = useState<{ findings: ReviewFinding[]; summary: ReviewSummary } | null>(null);
  const [market, setMarket] = useState<MarketPulseResult | null>(null);

  const needsMeta = module === "evidence" || module === "reconcile" || module === "certify";

  const loadMeta = useCallback(async () => {
    if (!needsMeta) return;
    try {
      const r = await fetch(`/api/tfpr/assignments/${id}`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const w = d.workfile;
      setMeta({ evidence: w.evidence, drafts: w.drafts, certifiedValue: w.certifiedValue });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [id, needsMeta]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const runReview = useCallback(async () => {
    setBusy("review");
    try {
      const r = await fetch(`/api/tfpr/assignments/${id}/review`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setReview(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [id]);

  useEffect(() => {
    if (module === "review") runReview();
  }, [module, runReview]);

  const runMarket = useCallback(async () => {
    setBusy("market");
    try {
      const r = await fetch(`/api/tfpr/assignments/${id}/market-pulse`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMarket(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [id]);

  useEffect(() => {
    if (module === "market") runMarket();
  }, [module, runMarket]);

  const rev = [...runHistory].reverse();
  const num = (v: unknown) => (typeof v === "number" ? v : undefined);
  const costValue = num(rev.find((r) => r.runType === "cost")?.outputSnapshot?.indicatedValue);
  const salesValue = num(rev.find((r) => r.runType === "sales_comparison")?.outputSnapshot?.reconciledValue);
  const incomeValue = num(rev.find((r) => r.runType === "income_direct_cap" || r.runType === "income_dcf")?.outputSnapshot?.directCapValue);
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
          context: { subjectAddress: subject.address, costValue, salesValue, incomeValue, finalValue: reconFinal ?? (finalInput ? Number(finalInput) : undefined) },
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
        body: JSON.stringify({ value: finalInput ? Number(finalInput) : NaN, reasonCode: reason, confirmed: confirm }),
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

  if (!KNOWN.includes(module)) {
    return (
      <div className="rounded-md border border-border p-5 text-sm text-muted-foreground">
        Unknown module “{module}”. <Link href={`/assignments/${id}`} className="text-cyan-400">Back to Command Center</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>
      )}

      {module === "subject" && <SubjectPanel />}
      {module === "cost" && <CostForgePanel />}
      {module === "sales" && <SalesComparisonPanel />}
      {module === "income" && <IncomeApproachPanel />}

      {module === "reconcile" && (
        <div className="space-y-5">
          <ReconciliationPanel />
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

      {module === "evidence" && (
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

      {module === "certify" && (
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
                Certify target = reconciliation final value ({usd(reconFinal)}). Finalize Reconciliation first.
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

      {module === "review" && (
        <div className="rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">ReviewForge — pre-delivery review</h3>
              <p className="text-[11px] text-muted-foreground">
                USPAP-aware checks over this workfile. Flags issues — never auto-fixes; you remain the author.
              </p>
            </div>
            <button
              onClick={runReview}
              disabled={busy === "review"}
              className="h-9 rounded-md border border-cyan-500/50 px-4 text-sm font-semibold text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50"
            >
              {busy === "review" ? "Reviewing…" : "Re-run review"}
            </button>
          </div>

          {review && (
            <p className="mt-3 text-xs text-muted-foreground">
              {review.summary.total === 0
                ? "No issues found — clean for delivery review."
                : `${review.summary.total} finding(s): ${review.summary.blockers} blocker(s), ${review.summary.warnings} warning(s), ${review.summary.info} info.`}
            </p>
          )}

          <ul className="mt-3 space-y-2">
            {review?.findings.map((x) => (
              <li key={x.id} className={`rounded-md border p-3 ${sevCls[x.severity] ?? sevCls.info}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{x.title}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide">{x.severity}</span>
                </div>
                <p className="mt-1 text-xs text-foreground/90">{x.detail}</p>
                <Link href={`/assignments/${id}/${x.module}`} className="mt-1 inline-block text-[11px] text-cyan-400 hover:underline">
                  Go to {x.module} →
                </Link>
              </li>
            ))}
            {review && review.findings.length === 0 && (
              <li className="rounded-md border border-cyan-500/40 p-3 text-xs text-cyan-400">
                All checks passed.
              </li>
            )}
          </ul>
        </div>
      )}

      {module === "market" && (
        <div className="rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">
                MarketPulse <span className="text-[10px] uppercase tracking-wide text-cyan-400">Workfile-derived</span>
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Based on evidence currently in this workfile. No external market feed connected.
              </p>
            </div>
            <button
              onClick={runMarket}
              disabled={busy === "market"}
              className="h-9 rounded-md border border-cyan-500/50 px-4 text-sm font-semibold text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50"
            >
              {busy === "market" ? "Reading…" : "Re-read workfile"}
            </button>
          </div>

          {market && (
            <>
              <p className="mt-3 text-xs">
                Market support:{" "}
                <span
                  className={
                    market.support === "supported"
                      ? "text-cyan-400"
                      : market.support === "developing"
                        ? "text-amber-400"
                        : "text-muted-foreground"
                  }
                >
                  {market.support}
                </span>
                {!market.sufficient && " · insufficient evidence for a full picture"}
              </p>

              {market.metrics.length > 0 && (
                <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {market.metrics.map((m) => (
                    <div key={m.label} className="rounded-md border border-border p-3">
                      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.label}</dt>
                      <dd className="mt-0.5 font-mono text-sm">{m.value}</dd>
                      {m.note && <dd className="text-[10px] text-muted-foreground">{m.note}</dd>}
                    </div>
                  ))}
                </dl>
              )}

              {market.warnings.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-400">Warnings</p>
                  <ul className="mt-1 space-y-1">
                    {market.warnings.map((w, i) => (
                      <li key={i} className="text-xs text-amber-400">· {w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {market.gaps.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Evidence gaps</p>
                  <ul className="mt-1 space-y-1">
                    {market.gaps.map((g, i) => (
                      <li key={i} className="text-xs text-muted-foreground">· {g}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
