"use client";

/**
 * TerraFusion Professional OS — Launch Pad (product entry, `/`).
 *
 * The authoritative first screen: an OS-style launch pad, not a Valuator landing
 * page and not a workbench. It answers "what am I working on, what needs my
 * attention, what tools are available" — and Valuator is just one module.
 *
 * Honesty rule: every count/queue here is DERIVED FROM PERSISTED WORKFILES via
 * /api/tfpr/launchpad (ReviewForge engine). No fabricated data, no theater.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  PRODUCT_NAME,
  TFPS_MODULES,
  TRUTH_LABEL,
  type TfpsModule,
} from "@/lib/tfps/suiteRegistry";

interface QueueRef { id: string; title: string }
interface Queues {
  evidenceGaps: QueueRef[];
  reviewRequired: QueueRef[];
  certificationPending: QueueRef[];
  museDraftsPending: QueueRef[];
  reportsReady: QueueRef[];
  reportsTotal: number;
}
interface AssignmentSignal {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  evidenceCount: number;
  certified: boolean;
  draftCount: number;
  blockers: number;
  warnings: number;
  reportReady: boolean;
  evidenceGap: boolean;
  certificationPending: boolean;
  museDraftsPending: boolean;
}
interface LaunchpadData {
  tier: string;
  assignments: AssignmentSignal[];
  queues: Queues;
  errors: { id: string; error: string }[];
}

const truthClass = (t: TfpsModule["truthState"]) =>
  t === "live"
    ? "border-cyan-500/50 text-cyan-400"
    : t === "candidate-live"
      ? "border-blue-500/40 text-blue-300"
      : t === "queued"
        ? "border-border text-muted-foreground"
        : "border-red-500/40 text-red-400";

function ModuleCard({ m }: { m: TfpsModule }) {
  const previewLocked = m.truthState !== "live";
  return (
    <div className={`rounded-xl border p-4 ${previewLocked ? "border-border opacity-80" : "border-cyan-500/30"}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{m.label}</h3>
        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${truthClass(m.truthState)}`}>
          {TRUTH_LABEL[m.truthState]}{m.qualifier ? ` · ${m.qualifier}` : ""}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{m.description}</p>
      <p className="mt-3 text-[10px] uppercase tracking-wide text-muted-foreground">
        {m.truthState === "queued"
          ? "Preview — not yet available"
          : m.scope === "assignment"
            ? "Opens inside an assignment"
            : "Suite tool"}
      </p>
    </div>
  );
}

/** One attention queue. Honest empty state; links straight to the work. */
function QueueCard({
  label,
  hint,
  refs,
  count,
  countSuffix,
  tone,
}: {
  label: string;
  hint: string;
  refs: QueueRef[];
  count: number;
  countSuffix?: string;
  tone: "amber" | "red" | "cyan";
}) {
  const clear = count === 0;
  const toneCls = clear
    ? "border-border"
    : tone === "red"
      ? "border-red-500/40"
      : tone === "amber"
        ? "border-amber-500/40"
        : "border-cyan-500/40";
  const countCls = clear
    ? "text-muted-foreground"
    : tone === "red"
      ? "text-red-400"
      : tone === "amber"
        ? "text-amber-400"
        : "text-cyan-400";
  return (
    <div className={`rounded-xl border p-4 ${toneCls}`}>
      <div className="flex items-baseline justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h3>
        <span className={`font-mono text-2xl font-bold ${countCls}`}>
          {count}{countSuffix ?? ""}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      <ul className="mt-2 space-y-1">
        {clear ? (
          <li className="text-[11px] text-muted-foreground">All clear.</li>
        ) : (
          refs.slice(0, 3).map((r) => (
            <li key={r.id}>
              <Link href={`/assignments/${r.id}`} className="text-[11px] text-cyan-400 hover:underline">
                {r.title} →
              </Link>
            </li>
          ))
        )}
        {refs.length > 3 && <li className="text-[10px] text-muted-foreground">+{refs.length - 3} more</li>}
      </ul>
    </div>
  );
}

function StatusChips({ a }: { a: AssignmentSignal }) {
  const chips: { label: string; cls: string }[] = [];
  if (a.certified) chips.push({ label: "Certified", cls: "border-cyan-500/40 text-cyan-400" });
  if (a.reportReady && !a.certified) chips.push({ label: "Report ready", cls: "border-cyan-500/40 text-cyan-400" });
  if (a.certificationPending) chips.push({ label: "Cert pending", cls: "border-amber-500/40 text-amber-400" });
  if (a.evidenceGap) chips.push({ label: "Evidence gap", cls: "border-amber-500/40 text-amber-400" });
  if (a.blockers > 0) chips.push({ label: `${a.blockers} blocker${a.blockers > 1 ? "s" : ""}`, cls: "border-red-500/40 text-red-400" });
  if (a.museDraftsPending) chips.push({ label: `${a.draftCount} MUSE draft${a.draftCount > 1 ? "s" : ""}`, cls: "border-border text-muted-foreground" });
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {chips.map((c, i) => (
        <span key={i} className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${c.cls}`}>{c.label}</span>
      ))}
    </div>
  );
}

export default function LaunchPad() {
  const [data, setData] = useState<LaunchpadData | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/tfpr/launchpad", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to load launch pad");
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      const r = await fetch("/api/tfpr/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to create");
      setTitle("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  const items = data?.assignments ?? [];
  const q = data?.queues;
  const mostRecent = items[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold tracking-tight">
            TerraFusion <span className="text-cyan-400">Professional OS</span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Commercial Appraisal Suite · on TerraFusion Professional Runtime
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">{PRODUCT_NAME}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Your appraisal operating environment</h1>
          </div>
          {data?.tier && (
            <span className="rounded-md border border-cyan-500/50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-400">
              {data.tier}
            </span>
          )}
        </div>

        {error && (
          <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>
        )}

        {/* Needs your attention — queues derived live from persisted workfiles */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Needs your attention</h2>
            <span className="text-[11px] text-muted-foreground">
              {loading ? "Reading workfiles…" : "Derived live from your workfiles · ReviewForge"}
            </span>
          </div>
          {q && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <QueueCard label="Evidence gaps" hint="No evidence recorded" refs={q.evidenceGaps} count={q.evidenceGaps.length} tone="amber" />
              <QueueCard label="Review required" hint="Open blockers or warnings" refs={q.reviewRequired} count={q.reviewRequired.length} tone="red" />
              <QueueCard label="Report readiness" hint="Ready to assemble" refs={q.reportsReady} count={q.reportsReady.length} countSuffix={`/${q.reportsTotal}`} tone="cyan" />
              <QueueCard label="Certification pending" hint="Reconciled, not certified" refs={q.certificationPending} count={q.certificationPending.length} tone="amber" />
              <QueueCard label="MUSE drafts pending" hint="Non-final, awaiting you" refs={q.museDraftsPending} count={q.museDraftsPending.length} tone="cyan" />
            </div>
          )}
        </section>

        {/* Active Assignments — recent-first; the actionable work list */}
        <section className="rounded-xl border border-border">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">
              Active Assignments {loading ? "(loading…)" : `(${items.length})`}
              <span className="ml-2 text-[10px] font-normal uppercase tracking-wide text-muted-foreground">recent first</span>
            </h2>
            {mostRecent && (
              <Link href={`/assignments/${mostRecent.id}`} className="text-xs text-cyan-400 hover:underline">
                Continue: {mostRecent.title} →
              </Link>
            )}
          </div>

          <div className="flex gap-2 px-5 py-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Start a new assignment (e.g. 1420 Jadwin Ave — retail)"
              className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm"
            />
            <button
              onClick={create}
              disabled={creating}
              className="h-9 rounded-md bg-cyan-500 px-4 text-sm font-semibold text-background hover:bg-cyan-400 disabled:opacity-50"
            >
              {creating ? "Creating…" : "Start New"}
            </button>
          </div>

          {items.length === 0 && !loading ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No active assignments yet — start your first.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((a) => (
                <li key={a.id} className="flex items-start justify-between px-5 py-3">
                  <div>
                    <Link href={`/assignments/${a.id}`} className="text-sm font-medium hover:text-cyan-400">
                      {a.title}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {a.status} · updated {new Date(a.updatedAt).toLocaleString()}
                    </p>
                    <StatusChips a={a} />
                  </div>
                  <div className="flex shrink-0 gap-3 pt-1 text-xs">
                    <Link href={`/assignments/${a.id}`} className="text-cyan-400 hover:underline">Open</Link>
                    <a href={`/api/tfpr/assignments/${a.id}/report`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">Export</a>
                    <Link href={`/assignments/${a.id}/audit`} className="text-muted-foreground hover:text-foreground">Audit</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Suite Modules — Valuator is one module among the suite */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Suite Modules</h2>
            <span className="text-[11px] text-muted-foreground">Tools open inside an assignment · preview tools are not yet available</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TFPS_MODULES.map((m) => (
              <ModuleCard key={m.id} m={m} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
