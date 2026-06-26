import { NextResponse } from "next/server";
import { getRuntime, resolveContext } from "@/lib/tfpr/runtime";
import type { EvidenceRef, RunRecord, TraceEventType } from "@/lib/tfpr/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

interface IncomingRun {
  runId?: string;
  runType?: string;
  triggeredBy?: string;
  actorId?: string;
  reasonCode?: string;
  correlationId?: string;
  status?: string;
  startedAt?: string;
  completedAt?: string | null;
  inputSnapshot?: Record<string, unknown>;
  outputSnapshot?: Record<string, unknown>;
  evidenceRefs?: EvidenceRef[];
  narrativeReady?: boolean;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = resolveContext();
    const { store, audit } = getRuntime();
    const body = (await req.json().catch(() => ({}))) as IncomingRun;

    if (!body.runId || !body.runType) {
      return NextResponse.json({ error: "runId and runType are required." }, { status: 400 });
    }

    const run: RunRecord = {
      runId: body.runId,
      tenantId: ctx.tenantId,
      workfileId: id,
      runType: body.runType,
      actorId: body.triggeredBy || body.actorId || ctx.actorId,
      reasonCode: body.reasonCode || "",
      correlationId: body.correlationId || body.runId,
      status: (body.status as RunRecord["status"]) || "complete",
      startedAt: body.startedAt || new Date().toISOString(),
      completedAt: body.completedAt ?? new Date().toISOString(),
      inputSnapshot: body.inputSnapshot ?? {},
      outputSnapshot: body.outputSnapshot ?? {},
      evidenceRefs: body.evidenceRefs ?? [],
      narrativeReady: !!body.narrativeReady,
    };

    await store.appendRun(ctx, id, run);

    const type: TraceEventType =
      run.status === "complete"
        ? "action_succeeded"
        : run.status === "failed"
          ? "action_failed"
          : "action_invoked";
    await audit.emit(ctx, {
      workfileId: id,
      type,
      actorId: ctx.actorId,
      correlationId: run.correlationId,
      risk: "write_low",
      lane: "valuator:workfile",
      reasonCode: run.reasonCode || null,
      classification: "CONFIDENTIAL",
      summary: `Run ${run.runType} → ${run.status}`,
      payloadRef: null,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: msg(e) }, { status: 500 });
  }
}
