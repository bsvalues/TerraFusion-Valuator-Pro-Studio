/**
 * TFPR Runtime — SovereignAIProvider (v0).
 *
 * Sovereign-by-default: the `template` provider needs no external key and always
 * works offline. (openai/anthropic wiring is a later slice; promoting Valuator's
 * lib/ai/narrative-provider.ts into this gateway.) Output is always non-final.
 */
import type {
  AiProviderId,
  DraftRequest,
  DraftResult,
  SovereignAIProvider,
} from "../contracts";

function fmtUsd(n: unknown): string {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v) || v === 0) return "[value pending]";
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function templateDraft(req: DraftRequest): string {
  const c = req.context as Record<string, unknown>;
  if (req.capabilityId === "draft_reconciliation_narrative") {
    const addr = (c.subjectAddress as string) || "[subject property]";
    return [
      `DRAFT — Reconciliation (non-final; appraiser remains the author).`,
      ``,
      `The appraiser developed the indicated values for ${addr} and reconciled them to a final opinion of value. ` +
        `Cost Approach: ${fmtUsd(c.costValue)}. Sales Comparison Approach: ${fmtUsd(c.salesValue)}. ` +
        `Income Approach: ${fmtUsd(c.incomeValue)}.`,
      ``,
      `Greatest weight is given to the [primary approach] as it best reflects the actions of buyers and sellers ` +
        `in the subject market. After reconciling the approaches, the indicated final opinion of value is ` +
        `${fmtUsd(c.finalValue)} as of [effective date]. [Appraiser: confirm weighting rationale and exposure time.]`,
    ].join("\n");
  }
  return `DRAFT — ${req.capabilityId} (non-final). [Appraiser to complete.]`;
}

export class SovereignAIProviderImpl implements SovereignAIProvider {
  readonly providerId: AiProviderId;

  constructor() {
    const configured = (process.env.AI_PROVIDER as AiProviderId) || "template";
    // Slice 1 implements the sovereign template path only.
    this.providerId = configured === "disabled" ? "disabled" : "template";
  }

  async draft(req: DraftRequest): Promise<DraftResult> {
    return { text: templateDraft(req), providerId: this.providerId, final: false };
  }
}
