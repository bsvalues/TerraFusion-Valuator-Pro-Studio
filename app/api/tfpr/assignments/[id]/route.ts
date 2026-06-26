import { NextResponse } from "next/server";
import { getRuntime, resolveContext } from "@/lib/tfpr/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = resolveContext();
    const { store, entitlement } = getRuntime();
    if (!(await entitlement.can(ctx, "open_workfile"))) {
      return NextResponse.json({ error: "Entitlement expired — cannot open workfile." }, { status: 403 });
    }
    const workfile = await store.getWorkfile(ctx, id);
    if (!workfile) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    const tier = await entitlement.tierFor(ctx);
    return NextResponse.json({ workfile, tier });
  } catch (e) {
    return NextResponse.json({ error: msg(e) }, { status: 500 });
  }
}
