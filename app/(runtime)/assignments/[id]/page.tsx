"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface ValuatorSubject {
  address?: string;
  costValue?: number;
  salesValue?: number;
  incomeValue?: number;
  reconciliationFinalValue?: number;
}
interface EvidenceItem {
  evidenceId: string;
  sourceType: string;
  sourceLabel: string;
  notes: string | null;
  createdAt: string;
}
interface DraftArtifact {
  draftId: string;
  capabilityId: string;
  text: string;
  providerId: string;
  createdAt: string;
}
interface CertifiedValue {
  value: number;
  certifiedBy: string;
  reasonCode: string;
  certifiedAt: string;
}
interface Workfile {
  assignment: { id: string; title: string; status: string };
  subject: ValuatorSubject | null;
  evidence: EvidenceItem[];
  drafts: DraftArtifact[];
  certifiedValue: CertifiedValue | null;
}

const usd = (n?: number) =>
  typeof n === "number" && n > 0
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";

export default function WorkfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [wf, setWf] = useState<Workfile | null>(null);
  const [tier, setTier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // subject form
  const [subj, setSubj] = useState<ValuatorSubject>({});
  // evidence form
  const [evLabel, setEvLabel] = useState("");
  const [evType, setEvType] = useState("mls_sale");
  // certify form
  const [finalValue, setFinalValue] = useState<string>("");
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch(`/api/tfpr/assignments/${id}`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to load workfile");
      const w = d.workfile as Workfile;
      setWf(w);
      setTier(d.tier);
      setSubj(w.subject ?? {});
      if (w.subject?.reconciliationFinalValue)
        setFinalValue(String(w.subject.reconciliationFinalValue));
      if (w.certifiedValue) setFinalValue(String(w.certifiedValue.value));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const numFor = (v: string) => (v === "" ? undefined : Number(v));

  const saveSubject = async () => {
    setBusy("subject");
    try {
      const r = await fetch(`/api/tfpr/assignments/${id}/subject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subj),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

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
      await load();
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
            subjectAddress: subj.address,
            costValue: subj.costValue,
            salesValue: subj.salesValue,
            incomeValue: subj.incomeValue,
            finalValue: numFor(finalValue),
          },
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await load();
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
        body: JSON.stringify({ value: numFor(finalValue), reasonCode: reason, confirmed: confirm }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setConfirm(false);
      setReason("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  if (!wf) {
    return (
      <div className="space-y-4">
        <Link href="/assignments" className="text-xs text-cyan-400">← My Assignments</Link>
        {error ? (
          <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>
        ) : (
          <p className="text-sm text-muted-foreground">Loading workfile…</p>
        )}
      </div>
    );
  }

  const certified = wf.certifiedValue;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/assignments" className="text-xs text-cyan-400">← My Assignments</Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{wf.assignment.title}</h1>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {wf.assignment.status} · tier {tier}
          </p>
        </div>
        <Link
          href={`/assignments/${id}/audit`}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:border-cyan-500/50 hover:text-cyan-400"
        >
          Inspect Audit Trace →
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>
      )}

      {/* Subject */}
      <section className="rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold">Subject &amp; Approaches</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="col-span-2 text-xs text-muted-foreground">
            Subject address
            <input
              value={subj.address ?? ""}
              onChange={(e) => setSubj((s) => ({ ...s, address: e.target.value }))}
              className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
          {(["costValue", "salesValue", "incomeValue"] as const).map((k) => (
            <label key={k} className="text-xs text-muted-foreground">
              {k === "costValue" ? "Cost approach" : k === "salesValue" ? "Sales comparison" : "Income approach"}
              <input
                type="number"
                value={subj[k] ?? ""}
                onChange={(e) => setSubj((s) => ({ ...s, [k]: e.target.value ? Number(e.target.value) : undefined }))}
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm font-mono text-foreground"
              />
            </label>
          ))}
          <label className="text-xs text-muted-foreground">
            Reconciliation final value
            <input
              type="number"
              value={subj.reconciliationFinalValue ?? ""}
              onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : undefined;
                setSubj((s) => ({ ...s, reconciliationFinalValue: v }));
                if (v) setFinalValue(String(v));
              }}
              className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm font-mono text-foreground"
            />
          </label>
        </div>
        <button
          onClick={saveSubject}
          disabled={busy === "subject"}
          className="mt-3 h-9 rounded-md bg-cyan-500 px-4 text-sm font-semibold text-background hover:bg-cyan-400 disabled:opacity-50"
        >
          {busy === "subject" ? "Saving…" : "Save Subject"}
        </button>
      </section>

      {/* Evidence Ledger */}
      <section className="rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold">Evidence Ledger ({wf.evidence.length})</h2>
        <div className="mt-3 flex gap-2">
          <select
            value={evType}
            onChange={(e) => setEvType(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-2 text-xs"
          >
            <option value="mls_sale">mls_sale</option>
            <option value="public_record">public_record</option>
            <option value="cost_manual">cost_manual</option>
            <option value="income_survey">income_survey</option>
            <option value="appraiser_judgment">appraiser_judgment</option>
          </select>
          <input
            value={evLabel}
            onChange={(e) => setEvLabel(e.target.value)}
            placeholder="Evidence label (e.g. MLS #2210456 — 1402 Jadwin)"
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
          {wf.evidence.map((e) => (
            <li key={e.evidenceId} className="flex items-center gap-2 text-xs">
              <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan-400">{e.sourceType}</span>
              <span>{e.sourceLabel}</span>
            </li>
          ))}
          {wf.evidence.length === 0 && <li className="text-xs text-muted-foreground">No evidence yet.</li>}
        </ul>
      </section>

      {/* MUSE */}
      <section className="rounded-xl border border-border p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">MUSE — reconciliation narrative</h2>
          <button
            onClick={runMuse}
            disabled={busy === "muse"}
            className="h-9 rounded-md border border-cyan-500/50 px-4 text-sm font-semibold text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50"
          >
            {busy === "muse" ? "Drafting…" : "Draft with MUSE (write_low)"}
          </button>
        </div>
        <ul className="mt-3 space-y-3">
          {wf.drafts.map((d) => (
            <li key={d.draftId} className="rounded-md border border-border p-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                  Draft · non-final
                </span>
                <span className="text-[10px] text-muted-foreground">via {d.providerId}</span>
              </div>
              <pre className="whitespace-pre-wrap text-xs text-foreground/90">{d.text}</pre>
            </li>
          ))}
          {wf.drafts.length === 0 && <li className="text-xs text-muted-foreground">No drafts yet.</li>}
        </ul>
      </section>

      {/* Certify (write_high) */}
      <section className="rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold">Certify Opinion of Value <span className="text-[10px] uppercase tracking-wide text-amber-400">write_high</span></h2>
        {certified ? (
          <div className="mt-3 rounded-md border-2 border-cyan-500/40 bg-cyan-500/10 p-4">
            <p className="text-[10px] uppercase tracking-wider text-cyan-400">Certified opinion of value</p>
            <p className="mt-1 font-mono text-2xl font-bold text-cyan-400">{usd(certified.value)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              by {certified.certifiedBy} · “{certified.reasonCode}” · {new Date(certified.certifiedAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-muted-foreground">
                Final value
                <input
                  type="number"
                  value={finalValue}
                  onChange={(e) => setFinalValue(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm font-mono"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Reason code (required)
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs text-foreground">
              <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
              I confirm this is my final certified opinion of value (irreversible-grade action).
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
      </section>
    </div>
  );
}
