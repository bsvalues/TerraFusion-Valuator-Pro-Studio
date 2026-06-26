/**
 * TFPR Contracts — run record
 *
 * Promoted from Valuator `lib/subject-context.ts` (RunRecord), generalized to
 * the runtime: tenant/workfile scoped, `runType` is a module-defined string
 * (Valuator narrows to "cost" | "sales_comparison" | "income_direct_cap" | ...).
 */
import type {
  ActorId,
  CorrelationId,
  Iso8601,
  TenantId,
  WorkfileId,
} from "./common";
import type { EvidenceRef } from "./evidence";

export type RunStatus = "pending" | "running" | "complete" | "failed";

/** One governed analytical run, anchored to a workfile. */
export interface RunRecord {
  runId: string;
  tenantId: TenantId;
  workfileId: WorkfileId;
  /** Module-defined run type. */
  runType: string;
  /** Who/what triggered the run (license id or "system"). */
  actorId: ActorId;
  reasonCode: string;
  correlationId: CorrelationId;
  status: RunStatus;
  startedAt: Iso8601;
  completedAt: Iso8601 | null;
  inputSnapshot: Record<string, unknown>;
  outputSnapshot: Record<string, unknown>;
  evidenceRefs: EvidenceRef[];
  /** True when output can feed a MUSE narrative draft. */
  narrativeReady: boolean;
}
