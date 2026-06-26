import { NextResponse } from "next/server";
import { getRuntime, resolveContext } from "@/lib/tfpr/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = resolveContext();
    const { audit } = getRuntime();
    const events = await audit.list(ctx, id);
    return NextResponse.json({ events });
  } catch (e) {
    return NextResponse.json({ error: msg(e) }, { status: 500 });
  }
}
