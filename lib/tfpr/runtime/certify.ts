/**
 * TFPR Runtime — the one write_high action: Certify Opinion of Value.
 *
 * Certify target = reconciliation final value (TFPR_DECISION_RECORD §6.3).
 * write_high REQUIRES confirm + reason; both checked here. Emits action_invoked
 * then certified to the append-only trace.
 */
import { randomUUID } from "crypto";
import type {
  AuditTrace,
  CertifiedValue,
  RuntimeContext,
  WorkfileId,
  WorkfileStore,
} from "../contracts";
import { valuatorModule } from "@/modules/valuator/module";

export class CertifyValidationError extends Error {}

export interface CertifyInput {
  value: number;
  reasonCode: string;
  confirmed: boolean;
}

const CERTIFY_LANE = valuatorModule.writeHighActions.find(
  (a) => a.id === "certify_opinion_of_value",
)?.lane?.lane;

export async function certifyOpinionOfValue(
  store: WorkfileStore,
  audit: AuditTrace,
  ctx: RuntimeContext,
  workfileId: WorkfileId,
  input: CertifyInput,
): Promise<CertifiedValue> {
  if (!input.confirmed) {
    throw new CertifyValidationError("Certification requires explicit confirmation (write_high).");
  }
  if (!input.reasonCode || input.reasonCode.trim().length < 3) {
    throw new CertifyValidationError("A reason code (min 3 chars) is required to certify (write_high).");
  }
  if (!Number.isFinite(input.value) || input.value <= 0) {
    throw new CertifyValidationError("A positive final opinion of value is required to certify.");
  }

  const correlationId = randomUUID();
  const reasonCode = input.reasonCode.trim();

  await audit.emit(ctx, {
    workfileId,
    type: "action_invoked",
    actorId: ctx.actorId,
    correlationId,
    risk: "write_high",
    lane: CERTIFY_LANE,
    reasonCode,
    classification: "CONFIDENTIAL",
    summary: `Invoked write_high "certify_opinion_of_value"`,
    payloadRef: null,
  });

  const certified: CertifiedValue = {
    value: input.value,
    certifiedBy: ctx.actorId,
    reasonCode,
    correlationId,
    certifiedAt: new Date().toISOString(),
  };
  await store.saveCertifiedValue(ctx, workfileId, certified);

  await audit.emit(ctx, {
    workfileId,
    type: "certified",
    actorId: ctx.actorId,
    correlationId,
    risk: "write_high",
    lane: CERTIFY_LANE,
    reasonCode,
    classification: "CONFIDENTIAL",
    summary: `Certified opinion of value: ${input.value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}`,
    payloadRef: null,
  });

  return certified;
}
