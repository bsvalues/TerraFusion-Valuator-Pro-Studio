"use client";

/**
 * TerraFusion Professional Suite — Suite Home (product entry, `/`).
 *
 * Replaces the legacy swarm-dashboard theater that used to live here. This is
 * the user-facing product: Active Assignments + an honest module catalog. The
 * runtime (TFPR) sits underneath; it is not shown as the app.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  PRODUCT_NAME,
  TFPS_MODULES,
  TRUTH_LABEL,
  type TfpsModule,
} from "@/lib/tfps/suiteRegistry";

interface Summary {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
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
    <div
      className={`rounded-xl border p-4 ${
        previewLocked ? "border-border opacity-80" : "border-cyan-500/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{m.label}</h3>
        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${truthClass(m.truthState)}`}>
          {TRUTH_LABEL[m.truthState]}
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

export default function SuiteHome() {
  const [items, setItems] = useState<Summary[]>([]);
  const [tier, setTier] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/tfpr/assignments", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to load assignments");
      setItems(d.assignments);
      setTier(d.tier);
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

  const mostRecent = items[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold tracking-tight">
            TerraFusion <span className="text-cyan-400">Professional Suite</span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Fee Appraisal · on TerraFusion Professional Runtime
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">{PRODUCT_NAME}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Your appraisal operating environment</h1>
          </div>
          {tier && (
            <span className="rounded-md border border-cyan-500/50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-400">
              {tier}
            </span>
          )}
        </div>

        {error && (
          <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>
        )}

        {/* Active Assignments — the live, actionable section */}
        <section className="rounded-xl border border-border">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">
              Active Assignments {loading ? "(loading…)" : `(${items.length})`}
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
                <li key={a.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <Link href={`/assignments/${a.id}`} className="text-sm font-medium hover:text-cyan-400">
                      {a.title}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {a.status} · updated {new Date(a.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <Link href={`/assignments/${a.id}`} className="text-cyan-400 hover:underline">Open</Link>
                    <a href={`/api/tfpr/assignments/${a.id}/report`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">Export</a>
                    <Link href={`/assignments/${a.id}/audit`} className="text-muted-foreground hover:text-foreground">Audit</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Appraisal Tools — honest module catalog */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Appraisal Tools</h2>
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
