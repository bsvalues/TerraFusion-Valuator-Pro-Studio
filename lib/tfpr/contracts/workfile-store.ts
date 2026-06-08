/**
 * TFPR Contracts — WorkfileStore
 *
 * Persistence boundary. v0 implementation is Supabase/Postgres, but the
 * contract is vendor-neutral (TFPR_DECISION_RECORD §3).
 *
 * IMPLEMENTATION REQUIREMENTS (contractual, enforced by runtime impl):
 *  - FAIL LOUD: if the backing store is unconfigured/unreachable, methods
 *    MUST throw. No silent in-memory fallback, no fake reload success (§6.2).
 *  - TENANT SCOPING: every persisted row MUST carry ctx.tenantId (§6.4).
 */
import type { RuntimeContext, WorkfileId } from "./common";
import type {
  Assignment,
  AssignmentSummary,
  CertifiedValue,
  Workfile,
  WorkfileSubject,
} from "./workfile";
import type { EntitlementTier } from "./entitlement";
import type { EvidenceItem, EvidenceRef } from "./evidence";
import type { RunRecord } from "./run-record";
import type { DraftArtifact } from "./muse";

export interface CreateAssignmentInput {
  moduleId: string;
  title: string;
  entitlementTier: EntitlementTier;
  subject?: WorkfileSubject;
}

export interface WorkfileStore {
  createAssignment(ctx: RuntimeContext, input: CreateAssignmentInput): Promise<Assignment>;
  getAssignment(ctx: RuntimeContext, id: WorkfileId): Promise<Assignment | null>;
  listAssignments(ctx: RuntimeContext): Promise<AssignmentSummary[]>;
  getWorkfile(ctx: RuntimeContext, id: WorkfileId): Promise<Workfile | null>;

  saveSubject(ctx: RuntimeContext, id: WorkfileId, subject: WorkfileSubject): Promise<void>;
  appendRun(ctx: RuntimeContext, id: WorkfileId, run: RunRecord): Promise<void>;
  appendEvidence(ctx: RuntimeContext, id: WorkfileId, evidence: EvidenceRef): Promise<EvidenceItem>;
  appendDraft(ctx: RuntimeContext, id: WorkfileId, draft: DraftArtifact): Promise<void>;
  saveCertifiedValue(ctx: RuntimeContext, id: WorkfileId, value: CertifiedValue): Promise<void>;
}
