import { NextResponse } from "next/server";
import {
  CertifyValidationError,
  certifyOpinionOfValue,
  getRuntime,
  resolveContext,
} from "@/lib/tfpr/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = resolveContext();
    const { store, audit } = getRuntime();
    const body = (await req.json().catch(() => ({}))) as {
      value?: number;
      reasonCode?: string;
      confirmed?: boolean;
    };
    const certified = await certifyOpinionOfValue(store, audit, ctx, id, {
      value: Number(body.value),
      reasonCode: body.reasonCode ?? "",
      confirmed: body.confirmed === true,
    });
    return NextResponse.json({ certified }, { status: 201 });
  } catch (e) {
    if (e instanceof CertifyValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: msg(e) }, { status: 500 });
  }
}
