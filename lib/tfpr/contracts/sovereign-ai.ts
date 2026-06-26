/**
 * TFPR Contracts — SovereignAIProvider
 *
 * One AI gateway for all modules. Sovereign-by-default: with no external
 * provider configured, `template` must still produce a usable draft.
 * Promoted from Valuator `lib/ai/narrative-provider.ts`.
 *
 * The gateway ONLY drafts — it never produces final/authoritative content.
 */
import type { AiProviderId } from "./common";

export interface DraftRequest {
  /** Module capability key, e.g. "draft_narrative_section". */
  capabilityId: string;
  /** Sanitized context the module passes for drafting. */
  context: Record<string, unknown>;
}

export interface DraftResult {
  text: string;
  providerId: AiProviderId;
  /** Always false: gateway output is non-final by contract. */
  final: false;
  tokensUsed?: number;
}

export interface SovereignAIProvider {
  readonly providerId: AiProviderId;
  draft(req: DraftRequest): Promise<DraftResult>;
}
