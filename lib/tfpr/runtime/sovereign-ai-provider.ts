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
  if (req.capabilityId === "draft_certification") {
    const name = (c.appraiserName as string) || "[appraiser name]";
    const lic = (c.licenseNumber as string) || "[license #]";
    const addr = (c.subjectAddress as string) || "[subject property]";
    return [
      `DRAFT — Appraiser's Certification (non-final; appraiser is the author of record and must review every statement).`,
      ``,
      `I certify that, to the best of my knowledge and belief: the statements of fact in this report are true and correct; ` +
        `the reported analyses, opinions, and conclusions are limited only by the stated assumptions and limiting conditions ` +
        `and are my personal, impartial, and unbiased professional analyses, opinions, and conclusions.`,
      `I have no present or prospective interest in ${addr} and no personal interest with respect to the parties involved. ` +
        `My engagement and compensation are not contingent upon a predetermined value or a direction in value that favors the client.`,
      `[Appraiser: confirm USPAP Standards Rule 2-3 certification items, inspection, and any significant professional assistance.]`,
      ``,
      `${name}${lic ? " — License " + lic : ""}`,
    ].join("\n");
  }
  if (req.capabilityId === "draft_assumptions_limiting_conditions") {
    return [
      `DRAFT — Assumptions & Limiting Conditions (non-final; appraiser to tailor to this assignment).`,
      ``,
      `1. No responsibility is assumed for matters legal in nature; title is assumed good and marketable.`,
      `2. The property is appraised as if free and clear unless otherwise stated.`,
      `3. Information furnished by others is believed reliable but is not guaranteed.`,
      `4. Maps, sketches, and exhibits are included only to assist the reader and are not surveys.`,
      `5. The appraiser is not required to give testimony or appear in court unless arranged in advance.`,
      `[Appraiser: add assignment-specific assumptions, hypothetical conditions, or extraordinary assumptions as applicable.]`,
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
