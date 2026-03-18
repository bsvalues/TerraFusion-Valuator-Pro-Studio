"use client";

/**
 * TerraFusion Valuator Pro — Subject Workbench Context
 *
 * This React context is the fee-appraiser equivalent of terra-forge-rebuild's
 * WorkbenchContext. It anchors every analytical run to a single subject property
 * and appraisal order, enforces the governance contract (no run without a ready
 * SubjectContext + reason code), and maintains the full run history for the
 * current session.
 *
 * GOVERNANCE CONTRACT:
 *  - No analytical run may be dispatched without isSubjectReady() === true.
 *  - Every run call must supply a non-empty reasonCode.
 *  - Every completed run is appended to runHistory with full snapshots.
 *  - The context never stores computed values — only inputs and run records.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  SubjectContext,
  RunRecord,
  RunType,
  EvidenceRef,
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
  | "subject"        // Subject property + assignment conditions
  | "cost"           // Cost Approach (CostForge)
  | "sales"          // Sales Comparison (Comp Grid + Regression)
  | "income"         // Income Approach (Direct Cap + DCF)
  | "reconcile"      // Value Reconciliation
  | "report"         // Report Assembly + Narrative
  | "orders"         // Order Management
  | "legacy_import"; // Legacy Data Import (a la mode MISMO XML)

// ---------------------------------------------------------------------------
// Context value interface
// ---------------------------------------------------------------------------
interface SubjectWorkbenchContextValue {
  // Subject state
  subject: SubjectContext;
  setSubject: (updates: Partial<SubjectContext>) => void;
  clearSubject: () => void;
  subjectReady: boolean;
  missingFields: string[];

  // Active tab
  activeTab: WorkbenchTab;
  setActiveTab: (tab: WorkbenchTab) => void;

  // Run history
  runHistory: RunRecord[];
  addRunRecord: (record: RunRecord) => void;
  clearRunHistory: () => void;

  // Correlation tracking — groups related runs (e.g. cost + regression in one session)
  currentCorrelationId: string;
  newSession: () => void;

  // Dispatch helper — validates governance contract before allowing a run
  dispatchRun: (
    runType: RunType,
    reasonCode: string,
    inputSnapshot: Record<string, unknown>
  ) => RunRecord | null; // Returns null if governance check fails

  // Last governance failure message
  governanceError: string | null;
}

const SubjectWorkbenchCtx = createContext<SubjectWorkbenchContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
interface SubjectWorkbenchProviderProps {
  children: ReactNode;
}

export function SubjectWorkbenchProvider({ children }: SubjectWorkbenchProviderProps) {
  const [subject, setSubjectState] = useState<SubjectContext>(DEFAULT_SUBJECT_CONTEXT);
  const [activeTab, setActiveTabState] = useState<WorkbenchTab>("subject");
  const [runHistory, setRunHistory] = useState<RunRecord[]>([]);
  const [currentCorrelationId, setCurrentCorrelationId] = useState<string>(newCorrelationId());
  const [governanceError, setGovernanceError] = useState<string | null>(null);

  const setSubject = useCallback((updates: Partial<SubjectContext>) => {
    setSubjectState((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearSubject = useCallback(() => {
    setSubjectState(DEFAULT_SUBJECT_CONTEXT);
    setRunHistory([]);
    setCurrentCorrelationId(newCorrelationId());
    setGovernanceError(null);
  }, []);

  const setActiveTab = useCallback((tab: WorkbenchTab) => {
    setActiveTabState(tab);
  }, []);

  const addRunRecord = useCallback((record: RunRecord) => {
    setRunHistory((prev) => [...prev, record]);
  }, []);

  const clearRunHistory = useCallback(() => {
    setRunHistory([]);
  }, []);

  const newSession = useCallback(() => {
    setCurrentCorrelationId(newCorrelationId());
  }, []);

  /**
   * Governance-gated run dispatcher.
   * Returns a RunRecord (status: "pending") if all checks pass,
   * or null if the governance contract is violated.
   * The caller is responsible for executing the actual run and
   * updating the record via addRunRecord with the completed state.
   */
  const dispatchRun = useCallback(
    (
      runType: RunType,
      reasonCode: string,
      inputSnapshot: Record<string, unknown>
    ): RunRecord | null => {
      // Governance check 1: Subject must be ready
      if (!isSubjectReady(subject)) {
        const missing = getMissingSubjectFields(subject);
        setGovernanceError(
          `Cannot dispatch ${runType} run. Missing required fields: ${missing.join(", ")}.`
        );
        return null;
      }

      // Governance check 2: Reason code must be non-empty
      if (!reasonCode || reasonCode.trim().length < 3) {
        setGovernanceError(
          `Cannot dispatch ${runType} run. A reason code of at least 3 characters is required.`
        );
        return null;
      }

      // Clear any previous governance error
      setGovernanceError(null);

      const record: RunRecord = {
        runId: newRunId(),
        runType,
        fileNumber: subject.fileNumber!,
        propertyId: subject.propertyId,
        triggeredBy: "appraiser", // Will be replaced by profile.licenseNumber in Phase C
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
