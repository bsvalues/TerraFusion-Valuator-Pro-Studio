import { NextResponse } from "next/server";
import { getRuntime, resolveContext } from "@/lib/tfpr/runtime";
import { reviewWorkfile, summarize } from "@/lib/tfps/review";
import {
  isSubjectReady,
  getMissingSubjectFields,
  type SubjectContext,
  DEFAULT_SUBJECT_CONTEXT,
} from "@/lib/subject-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));
const num = (v: unknown) => (typeof v === "number" ? v : undefined);

/**
 * TerraFusion Professional OS — Launch Pad aggregation.
 *
 * One call returns everything the launch pad shows: the assignment list plus
 * per-assignment signals and the attention queues. Every number here is DERIVED
 * FROM PERSISTED WORKFILES via the same ReviewForge engine the review surface
 * uses — nothing is fabricated. If a workfile fails to load it is reported in
 * `errors`, not silently dropped.
 *
 * Scaling note: this is an N+1 read (one workfile + two module-state reads per
 * assignment). That is fine at solo-appraiser scale; a projection table is the
 * optimization when assignment counts grow.
 */
export async function GET() {
  try {
    const ctx = resolveContext();
    const { store, entitlement } = getRuntime();
    const [assignments, tier] = await Promise.all([
      store.listAssignments(ctx),
      entitlement.tierFor(ctx),
    ]);

    interface ReviewAdj { amount?: number; evidenceRef?: string; regressionExtracted?: boolean }
    interface ReviewComp { adjustments?: ReviewAdj[] }

    const items: Array<Record<string, unknown>> = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const a of assignments) {
      try {
        const wf = await store.getWorkfile(ctx, a.id);
        if (!wf) {
          errors.push({ id: a.id, error: "workfile not found" });
          continue;
        }
        const subject = { ...DEFAULT_SUBJECT_CONTEXT, ...(wf.subject as Partial<SubjectContext> | null) } as SubjectContext;
        const rev = [...wf.runs].reverse();
        const vault = (await store.getModuleState(ctx, a.id, "sales_comp_vault")) as { comps?: ReviewComp[] } | null;
        const profile = (await store.getModuleState(ctx, a.id, "appraiser_profile")) as Record<string, string> | null;
        const compList = vault?.comps ?? [];
        const draftsByCap = (cap: string) =>
          wf.drafts.filter((d) => (d as { capabilityId?: string }).capabilityId === cap);

        const costValue = num(rev.find((r) => r.runType === "cost")?.outputSnapshot?.indicatedValue);
        const salesValue = num(rev.find((r) => r.runType === "sales_comparison")?.outputSnapshot?.reconciledValue);
        const incomeValue = num(
          rev.find((r) => r.runType === "income_direct_cap" || r.runType === "income_dcf")?.outputSnapshot?.directCapValue,
        );
        const reconFinal = num(rev.find((r) => r.runType === "reconciliation")?.outputSnapshot?.finalValue);
        const approaches = [costValue, salesValue, incomeValue].filter((v): v is number => typeof v === "number" && v > 0);

        const findings = reviewWorkfile({
          subjectReady: isSubjectReady(subject),
          missingFields: getMissingSubjectFields(subject),
          evidenceCount: wf.evidence.length,
          costValue,
          salesValue,
          incomeValue,
          reconFinal,
          certifiedValue: wf.certifiedValue?.value ?? null,
          draftCount: draftsByCap("draft_reconciliation_narrative").length,
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
          subjectDepth: {
            legalDescription: subject.legalDescription,
            highestBestUse: subject.highestBestUse,
            condition: subject.condition,
            quality: subject.quality,
            occupancy: subject.occupancy,
            floodZone: subject.floodZone,
          },
          certification: {
            appraiserName: profile?.appraiserName ?? null,
            licenseNumber: profile?.licenseNumber ?? null,
            hasCertDraft: draftsByCap("draft_certification").length > 0,
            hasAlcDraft: draftsByCap("draft_assumptions_limiting_conditions").length > 0,
          },
          comps: {
            count: compList.length,
            unsupportedCount: compList.filter((c) =>
              (c.adjustments ?? []).some((x) => (x.amount ?? 0) !== 0 && !x.evidenceRef && !x.regressionExtracted),
            ).length,
          },
        });

        const summary = summarize(findings);
        const certified = wf.certifiedValue != null;
        const draftCount = wf.drafts.length;
        // Report is "ready" when at least one approach is developed, the
        // reconciliation is finalized, and there are no blocking findings.
        const reportReady = approaches.length >= 1 && typeof reconFinal === "number" && summary.blockers === 0;

        items.push({
          id: a.id,
          title: a.title,
          status: a.status,
          updatedAt: a.updatedAt,
          evidenceCount: wf.evidence.length,
          certified,
          draftCount,
          blockers: summary.blockers,
          warnings: summary.warnings,
          info: summary.info,
          approachesDeveloped: approaches.length,
          reconFinal: reconFinal ?? null,
          reportReady,
          // Queue membership (honest, derived):
          evidenceGap: wf.evidence.length === 0,
          reviewRequired: summary.blockers + summary.warnings > 0,
          certificationPending: typeof reconFinal === "number" && !certified,
          museDraftsPending: draftCount > 0 && !certified,
        });
      } catch (e) {
        errors.push({ id: a.id, error: msg(e) });
      }
    }

    const inQueue = (key: string) =>
      items.filter((i) => i[key] === true).map((i) => ({ id: i.id, title: i.title }));

    const queues = {
      evidenceGaps: inQueue("evidenceGap"),
      reviewRequired: inQueue("reviewRequired"),
      certificationPending: inQueue("certificationPending"),
      museDraftsPending: inQueue("museDraftsPending"),
      reportsReady: items.filter((i) => i.reportReady === true).map((i) => ({ id: i.id, title: i.title })),
      reportsTotal: items.length,
    };

    return NextResponse.json({ tier, assignments: items, queues, errors });
  } catch (e) {
    return NextResponse.json({ error: msg(e) }, { status: 500 });
  }
}
