import { NextResponse } from "next/server";
import { getRuntime, resolveContext } from "@/lib/tfpr/runtime";
import { marketPulse, type CompSummary } from "@/lib/tfps/market-pulse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));
const num = (v: unknown) => (typeof v === "number" ? v : undefined);

function monthsSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const t = Date.parse(dateStr);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((Date.now() - t) / (1000 * 60 * 60 * 24 * 30.44)));
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = resolveContext();
    const { store, audit, entitlement } = getRuntime();

    if (!(await entitlement.can(ctx, "market_pulse"))) {
      return NextResponse.json({ error: "Entitlement expired — cannot run MarketPulse." }, { status: 403 });
    }

    const wf = await store.getWorkfile(ctx, id);
    if (!wf) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });

    const rev = [...wf.runs].reverse();
    const salesOut = rev.find((r) => r.runType === "sales_comparison")?.outputSnapshot ?? {};
    const incomeOut = rev.find((r) => r.runType === "income_direct_cap" || r.runType === "income_dcf")?.outputSnapshot ?? {};
    const compSummary = (salesOut.compSummary as CompSummary | undefined) ?? null;

    const evidenceByType: Record<string, number> = {};
    for (const e of wf.evidence) evidenceByType[e.sourceType] = (evidenceByType[e.sourceType] ?? 0) + 1;

    const result = marketPulse({
      approachValues: {
        cost: num(rev.find((r) => r.runType === "cost")?.outputSnapshot?.indicatedValue),
        sales: num(salesOut.reconciledValue),
        income: num(incomeOut.directCapValue),
      },
      reconFinal: num(rev.find((r) => r.runType === "reconciliation")?.outputSnapshot?.finalValue),
      compSummary,
      capRate: num(incomeOut.capRate) ?? null,
      noi: num(incomeOut.noi) ?? null,
      evidenceByType,
      evidenceTotal: wf.evidence.length,
      newestSaleAgeMonths: compSummary ? monthsSince(compSummary.dateMax) : null,
    });

    await audit.emit(ctx, {
      workfileId: id,
      type: "market_pulse_run",
      actorId: ctx.actorId,
      correlationId: id,
      risk: "read_only",
      lane: "valuator:workfile",
      reasonCode: null,
      classification: "CONFIDENTIAL",
      summary: `MarketPulse (workfile-derived): support=${result.support}, ${result.metrics.length} metric(s), ${result.gaps.length} gap(s)`,
      payloadRef: null,
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: msg(e) }, { status: 500 });
  }
}
