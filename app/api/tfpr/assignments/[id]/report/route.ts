import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getRuntime, resolveContext } from "@/lib/tfpr/runtime";
import { renderWorkfileHtml } from "@/lib/tfpr/runtime/report-package";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = resolveContext();
    const { store, audit, entitlement } = getRuntime();

    if (!(await entitlement.can(ctx, "export_report"))) {
      return NextResponse.json({ error: "Entitlement expired — cannot export report." }, { status: 403 });
    }

    // Single workfile fetch — the report draws only from the workfile.
    const workfile = await store.getWorkfile(ctx, id);
    if (!workfile) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });

    const events = await audit.list(ctx, id);
    const packageId = randomUUID();
    const html = renderWorkfileHtml(workfile, events);

    await audit.emit(ctx, {
      workfileId: id,
      type: "report_assembled",
      actorId: ctx.actorId,
      correlationId: packageId,
      risk: "read_only",
      lane: "valuator:workfile",
      reasonCode: null,
      classification: "CONFIDENTIAL",
      summary: `Report assembled (html, pkg ${packageId.slice(0, 8)})`,
      payloadRef: `/api/tfpr/assignments/${id}/report`,
    });

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    return NextResponse.json({ error: msg(e) }, { status: 500 });
  }
}
