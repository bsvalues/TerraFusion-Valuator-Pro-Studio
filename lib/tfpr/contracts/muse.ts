/**
 * TFPR Contracts — MUSE (write_low drafting)
 *
 * MUSE is the creator mode of TerraPilot (draft/explain/summarize/synthesize).
 * Every MUSE artifact is NON-FINAL and `write_low` by contract; the human
 * remains the author. Saved drafts live in the workfile.
 */
import type {
  ActorId,
  AiProviderId,
  CorrelationId,
  Iso8601,
  RuntimeContext,
  TenantId,
  WorkfileId,
} from "./common";
import type { WriteLane } from "./write-lane";

/** A MUSE capability a module exposes (e.g. "draft narrative section"). */
export interface MuseCapability {
  id: string;
  label: string;
  /** Always write_low; the lane the draft is written to. */
  lane: WriteLane;
}

/** A persisted, non-final MUSE draft in a workfile. */
export interface DraftArtifact {
  draftId: string;
  tenantId: TenantId;
  workfileId: WorkfileId;
  capabilityId: string;
  text: string;
  providerId: AiProviderId;
  /** Locked false: MUSE output is never final. */
  final: false;
  /** Locked write_low. */
  risk: "write_low";
  /** Attribution: typically "muse"; the human stays the author of record. */
  createdBy: ActorId;
  correlationId: CorrelationId;
  createdAt: Iso8601;
}

export interface MuseService {
  capabilities(moduleId: string): MuseCapability[];
  draft(
    ctx: RuntimeContext,
    workfileId: WorkfileId,
    capabilityId: string,
    context: Record<string, unknown>,
  ): Promise<DraftArtifact>;
}
