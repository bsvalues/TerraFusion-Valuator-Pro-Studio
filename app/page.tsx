"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { TFPS_MODULES, TRUTH_LABEL, type TfpsModule } from "@/lib/tfps/suiteRegistry";

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

const s = {
  page: {
    padding: "24px 20px",
    maxWidth: 1100,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column" as const,
    gap: 24,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--tf-sub)",
    marginBottom: 10,
  },
  bentoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
  },
  bentoCard: (hasItems: boolean) => ({
    background: "var(--tf-glass)",
    border: `1px solid ${hasItems ? "var(--tf-chip-warn)" : "var(--tf-border)"}`,
    borderRadius: 8,
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
    minHeight: 80,
  }),
  bentoCount: (hasItems: boolean) => ({
    fontSize: hasItems ? 26 : 18,
    fontWeight: 700,
    color: hasItems ? "var(--tf-chip-warn)" : "var(--tf-sub)",
    lineHeight: 1,
  }),
  bentoLabel: { fontSize: 10, color: "var(--tf-sub)" },
  bentoAction: { fontSize: 10, color: "var(--tf-accent)", fontWeight: 600, marginTop: 4 },
  assignRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "var(--tf-glass)",
    border: "1px solid var(--tf-border)",
    borderRadius: 8,
    padding: "10px 14px",
    textDecoration: "none",
    color: "var(--tf-text)",
  },
  chip: (warn: boolean) => ({
    fontSize: 9,
    padding: "2px 7px",
    borderRadius: 10,
    fontWeight: 700,
    letterSpacing: "0.04em",
    border: `1px solid ${warn ? "var(--tf-chip-warn)" : "var(--tf-border)"}`,
    color: warn ? "var(--tf-chip-warn)" : "var(--tf-sub)",
    background: warn ? "rgba(184,144,58,0.08)" : "transparent",
    whiteSpace: "nowrap" as const,
  }),
  tileRow: { display: "flex", gap: 8, flexWrap: "wrap" as const },
  tile: (state: TfpsModule["truthState"]) => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid var(--tf-border)",
    background: "var(--tf-glass)",
    textDecoration: "none",
    color: "var(--tf-text)",
    cursor: "pointer",
  }),
  tileDot: (state: TfpsModule["truthState"]) => ({
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: state === "live" ? "var(--tf-chip-live)" : "var(--tf-sub)",
    flexShrink: 0,
  }),
  tileLabel: { fontSize: 11, fontWeight: 600 },
  tileState: { fontSize: 9, color: "var(--tf-sub)" },
};

// Map module id to dock segment for navigation
const MODULE_ROUTE: Record<string, string> = {
  valuator: "reconcile", costforge: "cost", compforge: "sales",
  incomeforge: "income", reportforge: "report", reviewforge: "review",
  marketpulse: "market", dossier: "subject", muse: "muse",
};

export default function LaunchPad() {
  const [data, setData] = useState<LaunchpadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/tfpr/launchpad", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Launchpad unavailable");
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createAssignment = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const r = await fetch("/api/tfpr/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setTitle("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  const q = data?.queues;

  return (
    <div style={s.page}>
      {error && (
        <div style={{ fontSize: 12, color: "var(--tf-chip-block)", background: "rgba(180,50,50,0.08)", border: "1px solid var(--tf-chip-block)", borderRadius: 6, padding: "8px 12px" }}>
          {error}
        </div>
      )}

      {/* NEEDS YOUR ATTENTION */}
      <section>
        <div style={s.sectionLabel}>Needs your attention</div>
        {loading ? (
          <div style={{ fontSize: 12, color: "var(--tf-sub)" }}>Loading…</div>
        ) : (
          <div style={s.bentoGrid}>
            <div style={s.bentoCard((q?.evidenceGaps.length ?? 0) > 0)}>
              <div style={s.bentoCount((q?.evidenceGaps.length ?? 0) > 0)}>
                {q?.evidenceGaps.length ?? 0}
              </div>
              <div style={s.bentoLabel}>Evidence gaps</div>
              {(q?.evidenceGaps.length ?? 0) > 0 && (
                <Link href={`/assignments/${q!.evidenceGaps[0].id}/modules/evidence`} style={{ ...s.bentoAction, textDecoration: "none" }}>
                  → Add evidence
                </Link>
              )}
            </div>

            <div style={s.bentoCard((q?.reviewRequired.length ?? 0) > 0)}>
              <div style={s.bentoCount((q?.reviewRequired.length ?? 0) > 0)}>
                {q?.reviewRequired.length ?? 0}
              </div>
              <div style={s.bentoLabel}>Review required</div>
              {(q?.reviewRequired.length ?? 0) > 0 && (
                <Link href={`/assignments/${q!.reviewRequired[0].id}/modules/review`} style={{ ...s.bentoAction, textDecoration: "none" }}>
                  → Open ReviewForge
                </Link>
              )}
            </div>

            <div style={s.bentoCard((q?.certificationPending.length ?? 0) > 0)}>
              <div style={s.bentoCount((q?.certificationPending.length ?? 0) > 0)}>
                {q?.certificationPending.length ?? 0}
              </div>
              <div style={s.bentoLabel}>Certification pending</div>
              {(q?.certificationPending.length ?? 0) > 0 && (
                <Link href={`/assignments/${q!.certificationPending[0].id}/modules/certify`} style={{ ...s.bentoAction, textDecoration: "none" }}>
                  → Certify
                </Link>
              )}
            </div>

            <div style={{ ...s.bentoCard((q?.museDraftsPending.length ?? 0) > 0), gridColumn: "span 2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ ...s.bentoCount((q?.museDraftsPending.length ?? 0) > 0), fontSize: 18 }}>
                    {q?.museDraftsPending.length ?? 0} draft{(q?.museDraftsPending.length ?? 0) !== 1 ? "s" : ""}
                  </div>
                  <div style={s.bentoLabel}>MUSE drafts pending review</div>
                </div>
                {(q?.museDraftsPending.length ?? 0) > 0 && (
                  <Link href={`/assignments/${q!.museDraftsPending[0].id}/modules/muse`} style={{ ...s.bentoAction, textDecoration: "none", fontSize: 11 }}>
                    → Open MUSE
                  </Link>
                )}
              </div>
            </div>

            <div style={s.bentoCard((q?.reportsReady.length ?? 0) > 0)}>
              <div style={{ ...s.bentoCount((q?.reportsReady.length ?? 0) > 0), color: (q?.reportsReady.length ?? 0) > 0 ? "var(--tf-chip-live)" : "var(--tf-sub)" }}>
                {q?.reportsReady.length ?? 0} / {q?.reportsTotal ?? 0}
              </div>
              <div style={s.bentoLabel}>Reports ready</div>
              {(q?.reportsReady.length ?? 0) > 0 && (
                <Link href={`/assignments/${q!.reportsReady[0].id}/modules/report`} style={{ ...s.bentoAction, textDecoration: "none" }}>
                  → Export
                </Link>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ACTIVE ASSIGNMENTS */}
      <section>
        <div style={s.sectionLabel}>Active assignments</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {data?.assignments.map((a) => (
            <Link key={a.id} href={`/assignments/${a.id}`} style={s.assignRow}>
              <span style={{ fontSize: 12, color: "var(--tf-accent)" }}>↗</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{a.title}</div>
                <div style={{ fontSize: 10, color: "var(--tf-sub)" }}>
                  Updated {new Date(a.updatedAt).toLocaleDateString()}
                  {a.certified ? " · Certified" : ""}
                </div>
              </div>
              {a.blockers > 0 && <span style={s.chip(true)}>{a.blockers} blocker{a.blockers !== 1 ? "s" : ""}</span>}
              {a.certificationPending && !a.blockers && <span style={s.chip(true)}>Cert Pending</span>}
              {a.evidenceGap && !a.certificationPending && !a.blockers && <span style={s.chip(true)}>Evidence Gap</span>}
              {a.reportReady && <span style={{ ...s.chip(false), color: "var(--tf-chip-live)", borderColor: "var(--tf-chip-live)" }}>Ready</span>}
              {a.certified && <span style={{ ...s.chip(false), color: "var(--tf-chip-live)", borderColor: "var(--tf-chip-live)" }}>Certified</span>}
            </Link>
          ))}

          {!loading && (!data?.assignments.length) && (
            <div style={{ fontSize: 12, color: "var(--tf-sub)", padding: "12px 0" }}>
              No active assignments.
            </div>
          )}

          {/* Create new */}
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createAssignment()}
              placeholder="New assignment title…"
              style={{
                flex: 1, height: 36, borderRadius: 8,
                border: "1px solid var(--tf-border)",
                background: "var(--tf-glass)",
                color: "var(--tf-text)",
                padding: "0 12px", fontSize: 13,
              }}
            />
            <button
              onClick={createAssignment}
              disabled={creating || !title.trim()}
              style={{
                height: 36, padding: "0 16px", borderRadius: 8, fontSize: 12,
                fontWeight: 600, border: "1px solid var(--tf-border)",
                background: "var(--tf-glass)", color: "var(--tf-accent)",
                cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              {creating ? "Creating…" : "+ New"}
            </button>
          </div>
        </div>
      </section>

      {/* SUITE MODULES — quick launch */}
      <section>
        <div style={s.sectionLabel}>Suite modules</div>
        <div style={s.tileRow}>
          {TFPS_MODULES.map((m) => (
            <Link
              key={m.id}
              href={data?.assignments[0] ? `/assignments/${data.assignments[0].id}/modules/${MODULE_ROUTE[m.id] ?? m.id}` : "/assignments"}
              style={s.tile(m.truthState)}
            >
              <div style={s.tileDot(m.truthState)} />
              <div>
                <div style={s.tileLabel}>{m.label}</div>
                <div style={s.tileState}>
                  {TRUTH_LABEL[m.truthState]}{m.qualifier ? ` · ${m.qualifier}` : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
