import { NextResponse } from "next/server";
import { getRuntime, resolveContext } from "@/lib/tfpr/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const key = new URL(req.url).searchParams.get("key");
    if (!key) return NextResponse.json({ error: "key is required." }, { status: 400 });
    const ctx = resolveContext();
    const { store } = getRuntime();
    const state = await store.getModuleState(ctx, id, key);
    return NextResponse.json({ state });
  } catch (e) {
    return NextResponse.json({ error: msg(e) }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const key = new URL(req.url).searchParams.get("key");
    if (!key) return NextResponse.json({ error: "key is required." }, { status: 400 });
    const ctx = resolveContext();
    const { store } = getRuntime();
    const state = await req.json().catch(() => ({}));
    await store.saveModuleState(ctx, id, key, state);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: msg(e) }, { status: 500 });
  }
}
