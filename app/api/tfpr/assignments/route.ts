import { NextResponse } from "next/server";
import { getRuntime, resolveContext } from "@/lib/tfpr/runtime";
import { valuatorModule } from "@/modules/valuator/module";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function GET() {
  try {
    const ctx = resolveContext();
    const { store, entitlement } = getRuntime();
    const [assignments, tier] = await Promise.all([
      store.listAssignments(ctx),
      entitlement.tierFor(ctx),
    ]);
    return NextResponse.json({ assignments, tier });
  } catch (e) {
    return NextResponse.json({ error: msg(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = resolveContext();
    const { store, audit, entitlement } = getRuntime();
    const tier = await entitlement.tierFor(ctx);
    if (!(await entitlement.can(ctx, "create_assignment"))) {
      return NextResponse.json({ error: "Entitlement expired — cannot create assignments." }, { status: 403 });
    }
    const body = (await req.json().catch(() => ({}))) as { title?: string };
    const title = body.title?.trim() || "Untitled assignment";
    const assignment = await store.createAssignment(ctx, {
      moduleId: valuatorModule.id,
      title,
      entitlementTier: tier,
    });
    await audit.emit(ctx, {
      workfileId: assignment.id,
      type: "assignment_created",
      actorId: ctx.actorId,
      correlationId: assignment.id,
      classification: "CONFIDENTIAL",
      summary: `Created assignment "${title}"`,
      payloadRef: null,
    });
    return NextResponse.json({ assignment }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: msg(e) }, { status: 500 });
  }
}
