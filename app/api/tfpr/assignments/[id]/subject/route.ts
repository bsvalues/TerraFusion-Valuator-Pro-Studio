import { NextResponse } from "next/server";
import { getRuntime, resolveContext } from "@/lib/tfpr/runtime";
import type { WorkfileSubject } from "@/lib/tfpr/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = resolveContext();
    const { store, audit } = getRuntime();
    const subject = (await req.json().catch(() => ({}))) as WorkfileSubject;
    await store.saveSubject(ctx, id, subject);
    await audit.emit(ctx, {
      workfileId: id,
      type: "subject_saved",
      actorId: ctx.actorId,
      correlationId: id,
      risk: "write_low",
      lane: "valuator:workfile",
      reasonCode: null,
      classification: "CONFIDENTIAL",
      summary: "Subject saved",
      payloadRef: null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: msg(e) }, { status: 500 });
  }
}
