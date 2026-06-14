import { NextResponse } from "next/server";
import { getRuntime, resolveContext } from "@/lib/tfpr/runtime";
import { reviewWorkfile, summarize } from "@/lib/tfps/review";
import { isSubjectReady, getMissingSubjectFields, type SubjectContext, DEFAULT_SUBJECT_CONTEXT } from "@/lib/subject-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));
const num = (v: unknown) => (typeof v === "number" ? v : undefined);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = resolveContext();
    const { store, audit, entitlement } = getRuntime();

    if (!(await entitlement.can(ctx, "review"))) {
      return NextResponse.json({ error: "Entitlement expired — cannot run review." }, { status: 403 });
    }

    const wf = await store.getWorkfile(ctx, id);
    if (!wf) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });

    const subject = { ...DEFAULT_SUBJECT_CONTEXT, ...(wf.subject as Partial<SubjectContext> | null) } as SubjectContext;
    const rev = [...wf.runs].reverse();

    // Persisted comp grid (REC-002) → comp completeness/support signals.
    interface ReviewAdj { amount?: number; evidenceRef?: string; regressionExtracted?: boolean }
    interface ReviewComp { adjustments?: ReviewAdj[] }
    const vault = (await store.getModuleState(ctx, id, "sales_comp_vault")) as { comps?: ReviewComp[] } | null;
    const compList = vault?.comps ?? [];
    const comps = {
      count: compList.length,
      unsupportedCount: compList.filter((c) =>
        (c.adjustments ?? []).some((a) => (a.amount ?? 0) !== 0 && !a.evidenceRef && !a.regressionExtracted),
      ).length,
    };

    const findings = reviewWorkfile({
      subjectReady: isSubjectReady(subject),
      missingFields: getMissingSubjectFields(subject),
      evidenceCount: wf.evidence.length,
      costValue: num(rev.find((r) => r.runType === "cost")?.outputSnapshot?.indicatedValue),
      salesValue: num(rev.find((r) => r.runType === "sales_comparison")?.outputSnapshot?.reconciledValue),
      incomeValue: num(
        rev.find((r) => r.runType === "income_direct_cap" || r.runType === "income_dcf")?.outputSnapshot?.directCapValue,
      ),
      reconFinal: num(rev.find((r) => r.runType === "reconciliation")?.outputSnapshot?.finalValue),
      certifiedValue: wf.certifiedValue?.value ?? null,
      draftCount: wf.drafts.length,
      assignment: {
        clientName: subject.clientName,
        lenderName: subject.lenderName,
        intendedUsersCount: subject.intendedUsers?.length ?? 0,
        reportDate: subject.reportDate,
        inspectionDate: subject.inspectionDate,
        reportType: subject.reportType,
        scopeOfWork: subject.scopeOfWork,
        fee: subject.fee,
      },
      comps,
    });

    const summary = summarize(findings);

    await audit.emit(ctx, {
      workfileId: id,
      type: "review_run",
      actorId: ctx.actorId,
      correlationId: id,
      risk: "read_only",
      lane: "valuator:workfile",
      reasonCode: null,
      classification: "CONFIDENTIAL",
      summary: `ReviewForge run: ${summary.total} finding(s) — ${summary.blockers} blocker(s), ${summary.warnings} warning(s)`,
      payloadRef: null,
    });

    return NextResponse.json({ findings, summary });
  } catch (e) {
    return NextResponse.json({ error: msg(e) }, { status: 500 });
  }
}
