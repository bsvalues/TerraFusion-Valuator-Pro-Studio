import { NextResponse } from "next/server";
import { getRuntime, resolveContext } from "@/lib/tfpr/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = resolveContext();
    const { muse } = getRuntime();
    const body = (await req.json().catch(() => ({}))) as {
      capabilityId?: string;
      context?: Record<string, unknown>;
    };
    const capabilityId = body.capabilityId?.trim() || "draft_reconciliation_narrative";
    const draft = await muse.draft(ctx, id, capabilityId, body.context ?? {});
    return NextResponse.json({ draft }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: msg(e) }, { status: 500 });
  }
}
