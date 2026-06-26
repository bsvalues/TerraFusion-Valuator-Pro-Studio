/**
 * TFPR Contracts — evidence
 *
 * Promoted from Valuator `lib/subject-context.ts` (EvidenceRef), generalized:
 * `sourceType` is a free string at runtime level so any module can classify;
 * the Valuator module narrows it to its own union.
 */
import type { Iso8601, TenantId, WorkfileId } from "./common";

/** A cited source. Embeddable value (carried inside runs, drafts, etc.). */
export interface EvidenceRef {
  /** Module-classified source type (e.g. "mls_sale", "cost_manual"). */
  sourceType: string;
  sourceId: string;
  sourceLabel: string;
  retrievedAt: Iso8601;
  /** 0.0 – 1.0 */
  confidence: number;
  notes: string | null;
}

/** A persisted evidence row in a workfile (EvidenceRef + identity + scope). */
export interface EvidenceItem extends EvidenceRef {
  evidenceId: string;
  tenantId: TenantId;
  workfileId: WorkfileId;
  createdAt: Iso8601;
}
