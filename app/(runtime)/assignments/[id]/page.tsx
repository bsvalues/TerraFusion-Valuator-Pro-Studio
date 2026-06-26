"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSubjectWorkbench } from "@/lib/subject-workbench-context";
import type { ReviewFinding } from "@/lib/tfps/review";

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

const s = {
  page: { padding: "20px", display: "flex", flexDirection: "column" as const, gap: 16, minHeight: "100%" },
  subjectStrip: {
    background: "var(--tf-glass)",
    border: "1px solid var(--tf-border)",
    borderRadius: 8,
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  stripTitle: { fontSize: 15, fontWeight: 700, color: "var(--tf-text)" },
  stripMeta: { fontSize: 10, color: "var(--tf-sub)", marginTop: 2 },
  doctrineCols: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 },
  col: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    background: "var(--tf-bg2)",
    border: "1px solid var(--tf-border)",
    borderRadius: 8,
    padding: "12px 10px",
  },
  colHeader: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "var(--tf-sub)",
    marginBottom: 4,
    paddingBottom: 6,
    borderBottom: "1px solid var(--tf-border)",
  },
  tile: (tone: "done" | "attention" | "idle") => ({
    display: "block",
    padding: "8px 10px",
    borderRadius: 6,
    border: `1px solid ${
      tone === "done" ? "var(--tf-chip-live)" :
      tone === "attention" ? "var(--tf-chip-warn)" :
      "var(--tf-border)"
    }`,
    textDecoration: "none",
    color: tone === "done" ? "var(--tf-chip-live)" : tone === "attention" ? "var(--tf-chip-warn)" : "var(--tf-sub)",
    cursor: "pointer",
    transition: "opacity 0.1s",
  }),
  tileLabel: { fontSize: 10, fontWeight: 700, letterSpacing: "0.04em" },
  tileValue: { fontSize: 12, fontFamily: "var(--font-geist-mono)", marginTop: 2 },
};

export default function CommandCenter({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const base = `/assignments/${id}/modules`;
  const { runHistory, subjectReady, missingFields, hydrating, persistenceError, subject } = useSubjectWorkbench();
  const [meta, setMeta] = useState<WorkfileMeta | null>(null);
  const [review, setReview] = useState<{ findings: ReviewFinding[]; summary: { blockers: number; warnings: number; total: number } } | null>(null);
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

  const loadReview = useCallback(async () => {
    try {
      const r = await fetch(`/api/tfpr/assignments/${id}/review`, { cache: "no-store" });
      const d = await r.json();
      if (r.ok) setReview(d);
    } catch { /* non-fatal */ }
  }, [id]);

  useEffect(() => { load(); loadReview(); }, [load, loadReview]);

  const rev = [...runHistory].reverse();
  const num = (v: unknown) => (typeof v === "number" ? v : undefined);
  const costValue = num(rev.find((r) => r.runType === "cost")?.outputSnapshot?.indicatedValue);
  const salesValue = num(rev.find((r) => r.runType === "sales_comparison")?.outputSnapshot?.reconciledValue);
  const incomeValue = num(rev.find((r) => r.runType === "income_direct_cap" || r.runType === "income_dcf")?.outputSnapshot?.directCapValue);
  const reconFinal = num(rev.find((r) => r.runType === "reconciliation")?.outputSnapshot?.finalValue);

  const ev = meta?.evidenceCount ?? 0;
  const drafts = meta?.draftCount ?? 0;
  const certified = meta?.certifiedValue ?? null;

  return (
    <div style={s.page}>
      {(error || persistenceError) && (
        <div style={{ fontSize: 12, color: "var(--tf-chip-block)", background: "rgba(180,50,50,0.08)", border: "1px solid var(--tf-chip-block)", borderRadius: 6, padding: "8px 12px" }}>
          {error || persistenceError}
        </div>
      )}

      {/* Subject strip */}
      <div style={s.subjectStrip}>
        <div style={{ flex: 1 }}>
          <div style={s.stripTitle}>{meta?.title ?? "Assignment"}</div>
          <div style={s.stripMeta}>
            {meta?.status ?? "…"} · tier {meta?.tier ?? "…"} ·{" "}
            {subjectReady ? "subject ready" : `${missingFields.length} fields missing`}
            {hydrating ? " · loading…" : ""}
            {subject.address ? ` · ${subject.address}` : ""}
          </div>
        </div>
        {certified && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "var(--tf-chip-live)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Certified Value</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-geist-mono)", color: "var(--tf-chip-live)" }}>{usd(certified)}</div>
          </div>
        )}
        {review && review.summary.blockers > 0 && (
          <div style={{ background: "rgba(180,50,50,0.08)", border: "1px solid var(--tf-chip-block)", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "var(--tf-chip-block)", fontWeight: 700 }}>
            {review.summary.blockers} blocker{review.summary.blockers !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Doctrine columns */}
      <div style={s.doctrineCols}>

        {/* FIND */}
        <div style={s.col}>
          <div style={s.colHeader}>Find</div>

          <Link href={`${base}/subject`} style={s.tile(subjectReady ? "done" : "attention")}>
            <div style={s.tileLabel}>Subject &amp; Scope</div>
            <div style={s.tileValue}>{subjectReady ? "Ready" : `${missingFields.length} missing`}</div>
          </Link>

          <Link href={`${base}/evidence`} style={s.tile(ev > 0 ? "done" : "attention")}>
            <div style={s.tileLabel}>Evidence Ledger</div>
            <div style={s.tileValue}>{ev} item{ev !== 1 ? "s" : ""}</div>
          </Link>

          <Link href={`${base}/market`} style={s.tile("idle")}>
            <div style={s.tileLabel}>MarketPulse</div>
            <div style={s.tileValue}>Workfile-derived</div>
          </Link>
        </div>

        {/* DECIDE */}
        <div style={s.col}>
          <div style={s.colHeader}>Decide</div>

          <Link href={`${base}/cost`} style={s.tile(costValue ? "done" : "idle")}>
            <div style={s.tileLabel}>CostForge</div>
            <div style={s.tileValue}>{costValue ? usd(costValue) : "Not run"}</div>
          </Link>

          <Link href={`${base}/sales`} style={s.tile(salesValue ? "done" : "idle")}>
            <div style={s.tileLabel}>CompForge</div>
            <div style={s.tileValue}>{salesValue ? usd(salesValue) : "Not run"}</div>
          </Link>

          <Link href={`${base}/income`} style={s.tile(incomeValue ? "done" : "idle")}>
            <div style={s.tileLabel}>IncomeForge</div>
            <div style={s.tileValue}>{incomeValue ? usd(incomeValue) : "Not run"}</div>
          </Link>

          <Link href={`${base}/reconcile`} style={s.tile(reconFinal ? "done" : "idle")}>
            <div style={s.tileLabel}>Reconciliation</div>
            <div style={s.tileValue}>{reconFinal ? usd(reconFinal) : "Pending"}</div>
          </Link>
        </div>

        {/* ACT */}
        <div style={s.col}>
          <div style={s.colHeader}>Act</div>

          <Link href={`${base}/muse`} style={s.tile(drafts > 0 ? "attention" : "idle")}>
            <div style={s.tileLabel}>MUSE · TerraPilot</div>
            <div style={s.tileValue}>{drafts} draft{drafts !== 1 ? "s" : ""} pending review</div>
          </Link>

          <Link href={`${base}/certify`} style={s.tile(certified ? "done" : reconFinal ? "attention" : "idle")}>
            <div style={s.tileLabel}>Certify</div>
            <div style={s.tileValue}>{certified ? usd(certified) : reconFinal ? "Ready to certify" : "Pending reconciliation"}</div>
          </Link>
        </div>

        {/* DEFEND */}
        <div style={s.col}>
          <div style={s.colHeader}>Defend</div>

          <Link href={`${base}/review`} style={s.tile(review ? (review.summary.blockers > 0 ? "attention" : "done") : "idle")}>
            <div style={s.tileLabel}>ReviewForge</div>
            <div style={s.tileValue}>
              {review
                ? review.summary.total === 0
                  ? "Clean"
                  : `${review.summary.blockers}b · ${review.summary.warnings}w`
                : "Run review"}
            </div>
          </Link>

          <a
            href={`/api/tfpr/assignments/${id}/report`}
            target="_blank"
            rel="noreferrer"
            style={s.tile(certified ? "done" : costValue || salesValue || incomeValue ? "attention" : "idle")}
          >
            <div style={s.tileLabel}>ReportForge</div>
            <div style={s.tileValue}>{certified ? "Ready to export" : costValue || salesValue || incomeValue ? "Draft export" : "Not ready"}</div>
          </a>

          <Link href={`/assignments/${id}/audit`} style={s.tile("idle")}>
            <div style={s.tileLabel}>Audit / Workfile</div>
            <div style={s.tileValue}>{meta?.traceCount ?? 0} event{(meta?.traceCount ?? 0) !== 1 ? "s" : ""}</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
