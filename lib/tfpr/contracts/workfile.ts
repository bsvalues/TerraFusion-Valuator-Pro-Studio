/**
 * TFPR Contracts — assignment + workfile
 *
 * The Assignment is the unit of work in "My Assignments". The Workfile is its
 * full governed contents (subject + runs + evidence + drafts + certified value).
 */
import type {
  ActorId,
  CorrelationId,
  Iso8601,
  TenantId,
  WorkfileId,
} from "./common";
import type { EntitlementTier } from "./entitlement";
import type { EvidenceItem } from "./evidence";
import type { RunRecord } from "./run-record";
import type { DraftArtifact } from "./muse";

export type AssignmentStatus = "draft" | "in_progress" | "certified" | "archived";

/** Subject shape is module-owned; the runtime treats it opaquely. */
export type WorkfileSubject = Record<string, unknown>;

/** The work item shown in My Assignments. */
export interface Assignment {
  id: WorkfileId;
  tenantId: TenantId;
  /** e.g. "valuator". */
  moduleId: string;
  title: string;
  status: AssignmentStatus;
  /** Entitlement tier at creation/last-touch (read-only to the module). */
  entitlementTier: EntitlementTier;
  createdBy: ActorId;
  createdAt: Iso8601;
  updatedAt: Iso8601;
}

/** Lightweight projection for list views. */
export interface AssignmentSummary {
  id: WorkfileId;
  moduleId: string;
  title: string;
  status: AssignmentStatus;
  updatedAt: Iso8601;
}

/** The certify target (TFPR_DECISION_RECORD §6.3: reconciliation final value). */
export interface CertifiedValue {
  value: number;
  certifiedBy: ActorId;
  reasonCode: string;
  correlationId: CorrelationId;
  certifiedAt: Iso8601;
}

/** Full governed contents of one assignment. */
export interface Workfile {
  assignment: Assignment;
  subject: WorkfileSubject | null;
  runs: RunRecord[];
  evidence: EvidenceItem[];
  drafts: DraftArtifact[];
  certifiedValue: CertifiedValue | null;
}
