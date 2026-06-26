/**
 * TFPR Runtime — MuseService.
 *
 * Produces a NON-FINAL (write_low) draft, persists it to the workfile, and emits
 * a `draft_created` trace event. The human remains the author.
 */
import { randomUUID } from "crypto";
import type {
  AuditTrace,
  DraftArtifact,
  MuseCapability,
  MuseService,
  RuntimeContext,
  SovereignAIProvider,
  WorkfileId,
  WorkfileStore,
} from "../contracts";
import { valuatorModule } from "@/modules/valuator/module";

const MODULE_CAPABILITIES: Record<string, MuseCapability[]> = {
  [valuatorModule.id]: valuatorModule.museCapabilities,
};

export class MuseServiceImpl implements MuseService {
  constructor(
    private readonly store: WorkfileStore,
    private readonly ai: SovereignAIProvider,
    private readonly audit: AuditTrace,
  ) {}

  capabilities(moduleId: string): MuseCapability[] {
    return MODULE_CAPABILITIES[moduleId] ?? [];
  }

  async draft(
    ctx: RuntimeContext,
    workfileId: WorkfileId,
    capabilityId: string,
    context: Record<string, unknown>,
  ): Promise<DraftArtifact> {
    const result = await this.ai.draft({ capabilityId, context });
    const lane = valuatorModule.museCapabilities.find((c) => c.id === capabilityId)?.lane;

    const draft: DraftArtifact = {
      draftId: randomUUID(),
      tenantId: ctx.tenantId,
      workfileId,
      capabilityId,
      text: result.text,
      providerId: result.providerId,
      final: false,
      risk: "write_low",
      createdBy: "muse",
      correlationId: randomUUID(),
      createdAt: new Date().toISOString(),
    };

    await this.store.appendDraft(ctx, workfileId, draft);
    await this.audit.emit(ctx, {
      workfileId,
      type: "draft_created",
      actorId: ctx.actorId,
      correlationId: draft.correlationId,
      risk: "write_low",
      lane: lane?.lane,
      reasonCode: null,
      classification: "CONFIDENTIAL",
      summary: `MUSE drafted "${capabilityId}" (non-final, write_low) via ${result.providerId}`,
      payloadRef: null,
    });

    return draft;
  }
}
