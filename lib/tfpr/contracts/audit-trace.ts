/**
 * TFPR Contracts — AuditTrace
 *
 * Append-only event spine (mirrors TerraFusion OS TerraTrace). Every governed
 * action emits events; events are immutable. Payloads are sanitized; sensitive
 * detail is stored by reference, never inline.
 */
import type {
  ActorId,
  Classification,
  CorrelationId,
  Iso8601,
  RiskClass,
  RuntimeContext,
  TenantId,
  WorkfileId,
} from "./common";

export type TraceEventType =
  | "assignment_created"
  | "subject_saved"
  | "action_invoked"
  | "action_succeeded"
  | "action_failed"
  | "evidence_appended"
  | "draft_created"
  | "certified"
  | "report_assembled"
  | "review_run"
  | "permission_denied";

/** An immutable, append-only audit event. */
export interface TraceEvent {
  eventId: string;
  tenantId: TenantId;
  workfileId: WorkfileId;
  type: TraceEventType;
  actorId: ActorId;
  correlationId: CorrelationId;
  at: Iso8601;
  risk?: RiskClass;
  lane?: string;
  reasonCode?: string | null;
  classification: Classification;
  /** Sanitized, human-readable one-liner. No raw PII. */
  summary: string;
  /** Reference to a sanitized payload blob, if any. Never inline PII. */
  payloadRef?: string | null;
}

/** Caller supplies everything except runtime-assigned identity/time. */
export type TraceEventInput = Omit<TraceEvent, "eventId" | "at" | "tenantId">;

export interface AuditTrace {
  /** Append one event. Append-only; implementations never mutate prior events. */
  emit(ctx: RuntimeContext, event: TraceEventInput): Promise<void>;
  /** Ordered events for a workfile (oldest first). */
  list(ctx: RuntimeContext, workfileId: WorkfileId): Promise<TraceEvent[]>;
}
