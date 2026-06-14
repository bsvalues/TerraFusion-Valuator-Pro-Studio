/**
 * ReviewForge — pre-delivery review engine (pure, read-only).
 *
 * Reads the derived workfile state and FLAGS issues. It never fixes anything and
 * never mutates the workfile. USPAP-aware in structure — it does not assert USPAP
 * compliance, it surfaces gaps for the appraiser to address.
 */

export type ReviewSeverity = "blocker" | "warning" | "info";

export interface ReviewFinding {
  id: string;
  severity: ReviewSeverity;
  /** Module route segment where the issue is addressed (e.g. "subject", "cost"). */
  module: string;
  title: string;
  detail: string;
}

export interface ReviewInput {
  subjectReady: boolean;
  missingFields: string[];
  evidenceCount: number;
  costValue?: number;
  salesValue?: number;
  incomeValue?: number;
  reconFinal?: number;
  certifiedValue?: number | null;
  draftCount: number;
  /** Assignment-context completeness (REC-001). */
  assignment?: {
    clientName?: string | null;
    lenderName?: string | null;
    intendedUsersCount?: number;
    reportDate?: string | null;
    inspectionDate?: string | null;
    reportType?: string | null;
    scopeOfWork?: string | null;
    fee?: number | null;
  };
}

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function reviewWorkfile(i: ReviewInput): ReviewFinding[] {
  const f: ReviewFinding[] = [];

  // 1. Assignment / subject completeness
  if (!i.subjectReady) {
    f.push({
      id: "subject-incomplete",
      severity: "blocker",
      module: "subject",
      title: "Subject / scope incomplete",
      detail: `Required assignment fields are missing: ${i.missingFields.join(", ") || "unknown"}.`,
    });
  }

  // 1b. Assignment-context completeness (REC-001) — USPAP SR 1-2 / 2-2 elements.
  const a = i.assignment;
  if (a) {
    if (!a.clientName) f.push({ id: "no-client", severity: "warning", module: "subject", title: "Client not identified", detail: "USPAP SR 2-2(a)(i): the client must be identified in the report." });
    if (!a.intendedUsersCount) f.push({ id: "no-intended-users", severity: "warning", module: "subject", title: "Intended users not stated", detail: "USPAP SR 2-2(a)(ii): the intended users must be stated." });
    if (!a.scopeOfWork || a.scopeOfWork.trim().length < 10) f.push({ id: "no-scope", severity: "warning", module: "subject", title: "Scope of work not stated", detail: "USPAP SR 2-2(a)(vii): a scope-of-work statement is required." });
    if (!a.reportType) f.push({ id: "no-report-type", severity: "info", module: "subject", title: "Report type not selected", detail: "Select Appraisal Report or Restricted Appraisal Report." });
    if (!a.inspectionDate) f.push({ id: "no-inspection-date", severity: "info", module: "subject", title: "Inspection date not recorded", detail: "Record the date of inspection." });
    if (!a.reportDate) f.push({ id: "no-report-date", severity: "info", module: "subject", title: "Report date not recorded", detail: "Record the date of the report." });
    if (a.fee === null || a.fee === undefined) f.push({ id: "no-fee", severity: "info", module: "subject", title: "Appraisal fee not recorded", detail: "Record the assignment fee for the workfile." });
  }

  // 2. Evidence support
  if (i.evidenceCount === 0) {
    f.push({
      id: "no-evidence",
      severity: "warning",
      module: "evidence",
      title: "No evidence recorded",
      detail: "The analysis has no supporting items in the evidence ledger.",
    });
  }

  // 3. Approaches developed
  const approaches = [i.costValue, i.salesValue, i.incomeValue].filter(
    (v): v is number => typeof v === "number" && v > 0,
  );
  if (approaches.length === 0) {
    f.push({
      id: "no-approach",
      severity: "blocker",
      module: "cost",
      title: "No approach developed",
      detail: "At least one approach to value must be developed before delivery.",
    });
  } else if (approaches.length === 1) {
    f.push({
      id: "single-approach",
      severity: "info",
      module: "reconcile",
      title: "Single approach developed",
      detail: "Only one approach was developed; corroboration from another approach strengthens the opinion.",
    });
  }

  // 4. Reconciliation finalized
  if (approaches.length >= 1 && typeof i.reconFinal !== "number") {
    f.push({
      id: "recon-not-final",
      severity: "warning",
      module: "reconcile",
      title: "Reconciliation not finalized",
      detail: "Approaches are developed but no final reconciliation value has been recorded.",
    });
  }

  // 5. Spread across approaches (USPAP SR 1-6 reconciliation rationale)
  if (approaches.length >= 2) {
    const lo = Math.min(...approaches);
    const hi = Math.max(...approaches);
    const spreadPct = lo > 0 ? ((hi - lo) / lo) * 100 : 0;
    if (spreadPct > 15) {
      f.push({
        id: "wide-spread",
        severity: "warning",
        module: "reconcile",
        title: "Wide spread across approaches",
        detail: `Approaches range ${usd(lo)}–${usd(hi)} (${spreadPct.toFixed(0)}%); the reconciliation rationale should explain the divergence.`,
      });
    }
  }

  // 6. Reconciliation narrative drafted
  if (typeof i.reconFinal === "number" && i.draftCount === 0) {
    f.push({
      id: "no-narrative",
      severity: "info",
      module: "reconcile",
      title: "No reconciliation narrative",
      detail: "Consider drafting a reconciliation narrative (MUSE) to support the report.",
    });
  }

  // 7. Certification
  if (i.certifiedValue === null || i.certifiedValue === undefined) {
    f.push({
      id: "not-certified",
      severity: "info",
      module: "certify",
      title: "Not yet certified",
      detail: "The opinion of value has not been certified.",
    });
  } else if (typeof i.reconFinal === "number" && i.reconFinal > 0) {
    const diffPct = Math.abs(i.certifiedValue - i.reconFinal) / i.reconFinal * 100;
    if (diffPct > 2) {
      f.push({
        id: "certified-differs",
        severity: "warning",
        module: "certify",
        title: "Certified value differs from reconciliation",
        detail: `Certified ${usd(i.certifiedValue)} vs reconciliation ${usd(i.reconFinal)} (${diffPct.toFixed(0)}% apart) — confirm this is intended.`,
      });
    }
  }

  return f;
}

export function summarize(findings: ReviewFinding[]) {
  return {
    total: findings.length,
    blockers: findings.filter((x) => x.severity === "blocker").length,
    warnings: findings.filter((x) => x.severity === "warning").length,
    info: findings.filter((x) => x.severity === "info").length,
  };
}
