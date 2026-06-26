import { NextResponse } from "next/server";
import { getRuntime, resolveContext } from "@/lib/tfpr/runtime";
import type { EvidenceRef } from "@/lib/tfpr/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = resolveContext();
    const { store, audit } = getRuntime();
    const body = (await req.json().catch(() => ({}))) as Partial<EvidenceRef>;
    if (!body.sourceLabel?.trim()) {
      return NextResponse.json({ error: "sourceLabel is required." }, { status: 400 });
    }
    const evidence: EvidenceRef = {
      sourceType: body.sourceType?.trim() || "appraiser_judgment",
      sourceId: body.sourceId?.trim() || "manual",
      sourceLabel: body.sourceLabel.trim(),
      retrievedAt: new Date().toISOString(),
      confidence: typeof body.confidence === "number" ? body.confidence : 1.0,
      notes: body.notes ?? null,
    };
    const item = await store.appendEvidence(ctx, id, evidence);
    await audit.emit(ctx, {
      workfileId: id,
      type: "evidence_appended",
      actorId: ctx.actorId,
      correlationId: item.evidenceId,
      risk: "write_low",
      lane: "valuator:workfile",
      reasonCode: null,
      classification: "CONFIDENTIAL",
      summary: `Evidence appended: ${item.sourceLabel}`,
      payloadRef: null,
    });
    return NextResponse.json({ evidence: item }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: msg(e) }, { status: 500 });
  }
}
