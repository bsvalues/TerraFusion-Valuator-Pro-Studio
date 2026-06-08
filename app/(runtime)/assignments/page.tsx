"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Summary {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
}

const tierClass = (t: string) =>
  t === "expired"
    ? "border-red-500/50 text-red-400"
    : "border-cyan-500/50 text-cyan-400";

export default function AssignmentsPage() {
  const [items, setItems] = useState<Summary[]>([]);
  const [tier, setTier] = useState<string>("");
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">My Assignments</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Your appraisal workfiles</h1>
        </div>
        {tier && (
          <span className={`rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tierClass(tier)}`}>
            {tier}
          </span>
        )}
      </div>

      {/* Start New */}
      <div className="rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold">Start New Assignment</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment title (e.g. 1420 Jadwin Ave — retail)"
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
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {mostRecent ? (
            <Link href={`/assignments/${mostRecent.id}`} className="text-cyan-400 underline underline-offset-4">
              Continue: {mostRecent.title} →
            </Link>
          ) : (
            <span>No assignments yet — start your first.</span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* List */}
      <div className="rounded-xl border border-border">
        <div className="border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Workfiles {loading ? "(loading…)" : `(${items.length})`}
        </div>
        {items.length === 0 && !loading ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            Nothing here yet.
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
                  <Link href={`/assignments/${a.id}`} className="text-cyan-400 hover:underline">
                    Review Workfile
                  </Link>
                  <Link href={`/assignments/${a.id}/audit`} className="text-muted-foreground hover:text-foreground">
                    Audit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
