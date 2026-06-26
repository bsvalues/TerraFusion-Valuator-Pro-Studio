"use client";

/**
 * TerraFusion Valuator Pro — Subject Workbench Context
 *
 * This React context is the fee-appraiser equivalent of terra-forge-rebuild's
 * WorkbenchContext. It anchors every analytical run to a single subject property
 * and appraisal order, enforces the governance contract (no run without a ready
 * SubjectContext + reason code), and maintains the full run history.
 *
 * TFPR BINDING (Slice 2):
 *  When given an `assignmentId`, the provider is backed by the TerraFusion
 *  Professional Runtime WorkfileStore: it hydrates subject + runs from the
 *  workfile on mount, persists subject changes (debounced) and every completed
 *  run to the workfile. With no assignmentId it stays in-memory (legacy
 *  /workbench surface). The analytical panels are UNCHANGED — they keep calling
 *  setSubject / dispatchRun / addRunRecord; persistence happens transparently.
 *
 * GOVERNANCE CONTRACT:
 *  - No analytical run may be dispatched without isSubjectReady() === true.
 *  - Every run call must supply a non-empty reasonCode.
 *  - Every completed run is appended to runHistory with full snapshots.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import {
  SubjectContext,
  RunRecord,
  RunType,
  DEFAULT_SUBJECT_CONTEXT,
  isSubjectReady,
  getMissingSubjectFields,
  newRunId,
  newCorrelationId,
} from "./subject-context";

// ---------------------------------------------------------------------------
// Active Tab type — mirrors terra-forge SuiteTab but fee-appraiser scoped
// ---------------------------------------------------------------------------
export type WorkbenchTab =
  | "subject"
  | "cost"
  | "sales"
  | "income"
  | "reconcile"
  | "report"
  | "orders"
  | "legacy_import";

// ---------------------------------------------------------------------------
// Context value interface
// ---------------------------------------------------------------------------
interface SubjectWorkbenchContextValue {
  subject: SubjectContext;
  setSubject: (updates: Partial<SubjectContext>) => void;
  clearSubject: () => void;
  subjectReady: boolean;
  missingFields: string[];

  activeTab: WorkbenchTab;
  setActiveTab: (tab: WorkbenchTab) => void;

  runHistory: RunRecord[];
  addRunRecord: (record: RunRecord) => void;
  clearRunHistory: () => void;

  currentCorrelationId: string;
  newSession: () => void;

  dispatchRun: (
    runType: RunType,
    reasonCode: string,
    inputSnapshot: Record<string, unknown>
  ) => RunRecord | null;

  governanceError: string | null;

  // TFPR workfile binding state
  assignmentId: string | null;
  hydrating: boolean;
  persistenceError: string | null;
}

const SubjectWorkbenchCtx = createContext<SubjectWorkbenchContextValue | null>(null);

// ---------------------------------------------------------------------------
// TFPR persistence helpers (active only when assignmentId is set)
// ---------------------------------------------------------------------------
async function persistSubject(assignmentId: string, subject: SubjectContext): Promise<void> {
  const res = await fetch(`/api/tfpr/assignments/${assignmentId}/subject`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subject),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error || "Failed to persist subject");
  }
}

async function persistRun(assignmentId: string, run: RunRecord): Promise<void> {
  const res = await fetch(`/api/tfpr/assignments/${assignmentId}/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(run),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error || "Failed to persist run");
  }
}

interface TfprRunJson {
  runId: string;
  runType: string;
  actorId?: string;
  reasonCode: string;
  correlationId: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  inputSnapshot?: Record<string, unknown>;
  outputSnapshot?: Record<string, unknown>;
  evidenceRefs?: RunRecord["evidenceRefs"];
  narrativeReady?: boolean;
}

function tfprRunToValuator(r: TfprRunJson, fileNumber: string): RunRecord {
  return {
    runId: r.runId,
    runType: r.runType as RunType,
    fileNumber,
    propertyId: null,
    triggeredBy: r.actorId ?? "appraiser",
    reasonCode: r.reasonCode,
    correlationId: r.correlationId,
    status: r.status as RunRecord["status"],
    startedAt: r.startedAt,
    completedAt: r.completedAt ?? null,
    inputSnapshot: r.inputSnapshot ?? {},
    outputSnapshot: r.outputSnapshot ?? {},
    evidenceRefs: r.evidenceRefs ?? [],
    narrativeReady: !!r.narrativeReady,
  };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
interface SubjectWorkbenchProviderProps {
  children: ReactNode;
  /** When set, the workbench is bound to a TFPR workfile (persisted). */
  assignmentId?: string;
}

export function SubjectWorkbenchProvider({ children, assignmentId }: SubjectWorkbenchProviderProps) {
  const aId = assignmentId ?? null;
  const [subject, setSubjectState] = useState<SubjectContext>(DEFAULT_SUBJECT_CONTEXT);
  const [activeTab, setActiveTabState] = useState<WorkbenchTab>("subject");
  const [runHistory, setRunHistory] = useState<RunRecord[]>([]);
  const [currentCorrelationId, setCurrentCorrelationId] = useState<string>(newCorrelationId());
  const [governanceError, setGovernanceError] = useState<string | null>(null);
  const [hydrating, setHydrating] = useState<boolean>(!!aId);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  // Latest subject + a debounce timer for persistence
  const subjectRef = useRef(subject);
  subjectRef.current = subject;
  const subjectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from the TFPR workfile when bound to an assignment
  useEffect(() => {
    if (!aId) return;
    let cancelled = false;
    setHydrating(true);
    (async () => {
      try {
        const res = await fetch(`/api/tfpr/assignments/${aId}`, { cache: "no-store" });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Failed to load workfile");
        if (cancelled) return;
        const w = d.workfile;
        const subj = (w.subject as SubjectContext | null) ?? null;
        if (subj) setSubjectState({ ...DEFAULT_SUBJECT_CONTEXT, ...subj });
        const fileNumber = subj?.fileNumber ?? "";
        if (Array.isArray(w.runs)) {
          setRunHistory((w.runs as TfprRunJson[]).map((r) => tfprRunToValuator(r, fileNumber)));
        }
        setPersistenceError(null);
      } catch (e) {
        if (!cancelled) setPersistenceError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [aId]);

  const setSubject = useCallback(
    (updates: Partial<SubjectContext>) => {
      setSubjectState((prev) => {
        const next = { ...prev, ...updates };
        if (aId) {
          if (subjectTimer.current) clearTimeout(subjectTimer.current);
          subjectTimer.current = setTimeout(() => {
            persistSubject(aId, subjectRef.current).catch((e) =>
              setPersistenceError(e instanceof Error ? e.message : String(e))
            );
          }, 700);
        }
        return next;
      });
    },
    [aId]
  );

  const clearSubject = useCallback(() => {
    setSubjectState(DEFAULT_SUBJECT_CONTEXT);
    setRunHistory([]);
    setCurrentCorrelationId(newCorrelationId());
    setGovernanceError(null);
  }, []);

  const setActiveTab = useCallback((tab: WorkbenchTab) => {
    setActiveTabState(tab);
  }, []);

  const addRunRecord = useCallback(
    (record: RunRecord) => {
      setRunHistory((prev) => [...prev, record]);
      if (aId) {
        persistRun(aId, record).catch((e) =>
          setPersistenceError(e instanceof Error ? e.message : String(e))
        );
      }
    },
    [aId]
  );

  const clearRunHistory = useCallback(() => {
    setRunHistory([]);
  }, []);

  const newSession = useCallback(() => {
    setCurrentCorrelationId(newCorrelationId());
  }, []);

  /**
   * Governance-gated run dispatcher. Returns a pending RunRecord if checks pass,
   * or null if the governance contract is violated. Caller executes the run and
   * commits via addRunRecord (which persists when bound to a workfile).
   */
  const dispatchRun = useCallback(
    (
      runType: RunType,
      reasonCode: string,
      inputSnapshot: Record<string, unknown>
    ): RunRecord | null => {
      if (!isSubjectReady(subject)) {
        const missing = getMissingSubjectFields(subject);
        setGovernanceError(
          `Cannot dispatch ${runType} run. Missing required fields: ${missing.join(", ")}.`
        );
        return null;
      }
      if (!reasonCode || reasonCode.trim().length < 3) {
        setGovernanceError(
          `Cannot dispatch ${runType} run. A reason code of at least 3 characters is required.`
        );
        return null;
      }
      setGovernanceError(null);

      const record: RunRecord = {
        runId: newRunId(),
        runType,
        fileNumber: subject.fileNumber!,
        propertyId: subject.propertyId,
        triggeredBy: "appraiser",
        reasonCode: reasonCode.trim(),
        correlationId: currentCorrelationId,
        status: "pending",
        startedAt: new Date().toISOString(),
        completedAt: null,
        inputSnapshot,
        outputSnapshot: {},
        evidenceRefs: [],
        narrativeReady: false,
      };
      return record;
    },
    [subject, currentCorrelationId]
  );

  const value: SubjectWorkbenchContextValue = {
    subject,
    setSubject,
    clearSubject,
    subjectReady: isSubjectReady(subject),
    missingFields: getMissingSubjectFields(subject),
    activeTab,
    setActiveTab,
    runHistory,
    addRunRecord,
    clearRunHistory,
    currentCorrelationId,
    newSession,
    dispatchRun,
    governanceError,
    assignmentId: aId,
    hydrating,
    persistenceError,
  };

  return (
    <SubjectWorkbenchCtx.Provider value={value}>
      {children}
    </SubjectWorkbenchCtx.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useSubjectWorkbench(): SubjectWorkbenchContextValue {
  const ctx = useContext(SubjectWorkbenchCtx);
  if (!ctx) {
    throw new Error(
      "useSubjectWorkbench must be used within a SubjectWorkbenchProvider"
    );
  }
  return ctx;
}
