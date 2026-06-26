"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface TraceEvent {
  eventId: string;
  type: string;
  actorId: string;
  correlationId: string;
  at: string;
  risk?: string;
  reasonCode?: string | null;
  classification: string;
  summary: string;
}

const riskClass = (r?: string) =>
  r === "write_high" || r === "irreversible"
    ? "text-amber-400"
    : r === "write_low"
      ? "text-cyan-400"
      : "text-muted-foreground";

export default function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/tfpr/assignments/${id}/trace`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to load trace");
      setEvents(d.events);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/assignments/${id}`} className="text-xs text-cyan-400">← Workfile</Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Audit Trace</h1>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Append-only · {loading ? "loading…" : `${events.length} events`}
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>
      )}

      <ol className="space-y-2">
        {events.map((e) => (
          <li key={e.eventId} className="rounded-md border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold">{e.type}</span>
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${riskClass(e.risk)}`}>
                {e.risk ?? "—"}
              </span>
            </div>
            <p className="mt-1 text-xs text-foreground/90">{e.summary}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {new Date(e.at).toLocaleString()} · {e.actorId} · {e.classification}
              {e.reasonCode ? ` · reason: "${e.reasonCode}"` : ""} · corr {e.correlationId.slice(0, 8)}
            </p>
          </li>
        ))}
        {events.length === 0 && !loading && (
          <li className="text-xs text-muted-foreground">No events yet.</li>
        )}
      </ol>
    </div>
  );
}
