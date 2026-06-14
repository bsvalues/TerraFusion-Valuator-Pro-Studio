/**
 * TFPR Runtime — HtmlReportPackage (v0 of the ReportPackage contract).
 *
 * Assembles a print-ready HTML appraisal report STRICTLY from the workfile:
 * subject + persisted approach runs + evidence ledger + reconciliation/certified
 * value + audit trail. No parallel data path — every figure traces to a run or
 * the certified value. USPAP-aware language (not a compliance guarantee).
 */
import { randomUUID } from "crypto";
import type {
  PackageRef,
  ReportPackage,
  RuntimeContext,
  TraceEvent,
  Workfile,
  WorkfileId,
  WorkfileStore,
} from "../contracts";

function esc(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function usd(n: unknown): string {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v) || v === 0) return "—";
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function num(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}

interface ReportComp {
  address?: string;
  salePrice?: number;
  adjustedSalePrice?: number;
  saleDate?: string;
  netAdjustment?: number;
  condition?: string;
  quality?: string;
  gla?: number;
}
interface ReportCompVault {
  comps?: ReportComp[];
}

export function renderWorkfileHtml(wf: Workfile, events: TraceEvent[], compVault?: ReportCompVault | null, appraiserProfile?: Record<string, unknown> | null): string {
  const s = (wf.subject ?? {}) as Record<string, unknown>;
  const rev = [...wf.runs].reverse();
  const costValue = num(rev.find((r) => r.runType === "cost")?.outputSnapshot?.indicatedValue);
  const salesValue = num(rev.find((r) => r.runType === "sales_comparison")?.outputSnapshot?.reconciledValue);
  const incomeValue = num(
    rev.find((r) => r.runType === "income_direct_cap" || r.runType === "income_dcf")?.outputSnapshot?.directCapValue,
  );
  const reconFinal = num(rev.find((r) => r.runType === "reconciliation")?.outputSnapshot?.finalValue);
  const draftBy = (cap: string) => [...wf.drafts].reverse().find((d) => d.capabilityId === cap) ?? null;
  const reconDraft = draftBy("draft_reconciliation_narrative");
  const certDraft = draftBy("draft_certification");
  const alcDraft = draftBy("draft_assumptions_limiting_conditions");
  const certified = wf.certifiedValue;
  const ap = (appraiserProfile ?? {}) as Record<string, unknown>;

  const comps = compVault?.comps ?? [];
  const compRows = comps.length
    ? comps
        .map(
          (c) =>
            `<tr><td>${esc(c.address ?? "—")}</td><td>${typeof c.salePrice === "number" ? usd(c.salePrice) : "—"}</td><td>${typeof c.netAdjustment === "number" ? usd(c.netAdjustment) : "—"}</td><td>${typeof c.adjustedSalePrice === "number" ? usd(c.adjustedSalePrice) : "—"}</td><td>${esc(c.saleDate ?? "—")}</td><td>${esc(c.condition ?? "—")}/${esc(c.quality ?? "—")}</td><td>${esc(c.gla ?? "—")}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="7" class="muted">No comparable sales recorded in the workfile.</td></tr>`;

  const evidenceRows = wf.evidence.length
    ? wf.evidence
        .map((e) => `<tr><td>${esc(e.sourceType)}</td><td>${esc(e.sourceLabel)}</td><td>${esc(e.sourceId)}</td></tr>`)
        .join("")
    : `<tr><td colspan="3" class="muted">No evidence recorded.</td></tr>`;

  const traceRows = events
    .map(
      (e) =>
        `<tr><td>${esc(new Date(e.at).toLocaleString())}</td><td>${esc(e.type)}</td><td>${esc(e.risk ?? "")}</td><td>${esc(e.reasonCode ?? "")}</td><td>${esc(e.summary)}</td></tr>`,
    )
    .join("");

  const certBlock = certified
    ? `<div class="cert">
         <div class="cert-label">Final Opinion of Value (Certified)</div>
         <div class="cert-value">${usd(certified.value)}</div>
         <div class="muted">Certified by ${esc(certified.certifiedBy)} on ${esc(new Date(certified.certifiedAt).toLocaleString())} · reason: "${esc(certified.reasonCode)}"</div>
       </div>`
    : `<div class="cert draft">
         <div class="cert-label">DRAFT — NOT YET CERTIFIED</div>
         <div class="cert-value">${usd(reconFinal)}</div>
         <div class="muted">Indicated reconciliation value (not a certified opinion).</div>
       </div>`;

  // Approach detail (read only from persisted runs; honest "—" if absent).
  const costRun = rev.find((r) => r.runType === "cost");
  const incomeRun = rev.find((r) => r.runType === "income_direct_cap" || r.runType === "income_dcf");
  const co = (costRun?.outputSnapshot ?? {}) as Record<string, unknown>;
  const io = (incomeRun?.outputSnapshot ?? {}) as Record<string, unknown>;

  // Report readiness — honest warnings for missing required elements (never faked).
  const warn: string[] = [];
  const need = (ok: unknown, label: string) => {
    if (!ok) warn.push(label);
  };
  need(s.fileNumber, "File number");
  need(s.address && s.city && s.state, "Subject address (city/state)");
  need(s.effectiveDate, "Effective date");
  need(s.intendedUse, "Intended use");
  need(s.propertyRights, "Property rights");
  need(s.legalDescription, "Legal description");
  need(s.highestBestUse, "Highest & best use");
  need(s.condition && s.quality, "Condition/Quality rating");
  need(costValue || salesValue || incomeValue, "At least one approach value");
  need(comps.length >= 3, "At least 3 comparable sales");
  need(typeof reconFinal === "number", "Reconciliation final value");
  need(certified, "Certified opinion of value");
  need(ap.appraiserName, "Appraiser name");
  need(ap.licenseNumber, "Appraiser license #");
  need(certDraft, "Certification statements");
  need(alcDraft, "Assumptions & limiting conditions");
  const readinessBlock = warn.length
    ? `<div class="warn"><b>Report not delivery-ready</b> — missing or incomplete: ${warn.map(esc).join(" · ")}.</div>`
    : `<div class="ready"><b>Report is delivery-ready</b> — all required elements present and certified.</div>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>Appraisal Report — ${esc(s.fileNumber ?? wf.assignment.title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font: 13px/1.5 -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111; max-width: 860px; margin: 32px auto; padding: 0 24px; }
  h1 { font-size: 22px; margin: 0 0 2px; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .06em; color: #1a6; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin: 28px 0 10px; }
  .sub { color: #666; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0; }
  td, th { text-align: left; padding: 5px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #888; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; }
  .kv { display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding: 3px 0; }
  .kv b { font-weight: 600; }
  .approaches { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin: 8px 0; }
  .approaches .a { border: 1px solid #e3e3e3; border-radius: 8px; padding: 10px; }
  .approaches .a .l { font-size: 11px; text-transform: uppercase; color: #888; }
  .approaches .a .v { font-size: 18px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .cert { border: 2px solid #1a6; border-radius: 10px; padding: 14px 16px; margin: 10px 0; }
  .cert.draft { border-color: #c90; }
  .cert-label { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #1a6; }
  .cert.draft .cert-label { color: #c90; }
  .cert-value { font-size: 26px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .muted { color: #888; font-size: 12px; }
  pre { white-space: pre-wrap; font: inherit; background: #fafafa; border: 1px solid #eee; border-radius: 8px; padding: 10px; }
  footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #ddd; color: #999; font-size: 11px; }
  .warn { border:1px solid #c90; background:#fff8e6; color:#7a5b00; border-radius:8px; padding:10px 12px; margin:10px 0; font-size:12px; }
  .ready { border:1px solid #1a6; background:#eefaf3; color:#0a7a4a; border-radius:8px; padding:10px 12px; margin:10px 0; font-size:12px; }
  .pdfbtn { border:1px solid #1a6; background:#1a6; color:#fff; border-radius:8px; padding:8px 14px; font-size:13px; font-weight:600; cursor:pointer; }
  @media print { body { margin: 0; } h2 { break-after: avoid; } .noprint { display: none !important; } }
</style></head>
<body>
  <h1>Appraisal Report</h1>
  <div class="sub">File ${esc(s.fileNumber ?? "—")} · ${esc(wf.assignment.title)} · status: ${esc(wf.assignment.status)}</div>
  <div class="noprint" style="margin:10px 0"><button class="pdfbtn" onclick="window.print()">Save as PDF / Print</button></div>
  ${readinessBlock}

  <h2>Assignment</h2>
  <div class="grid">
    <div class="kv"><span>Intended use</span><b>${esc(s.intendedUse ?? "—")}</b></div>
    <div class="kv"><span>Intended users</span><b>${esc(Array.isArray(s.intendedUsers) && s.intendedUsers.length ? (s.intendedUsers as string[]).join(", ") : "—")}</b></div>
    <div class="kv"><span>Property rights</span><b>${esc(s.propertyRights ?? "—")}</b></div>
    <div class="kv"><span>Report type</span><b>${esc(s.reportType ?? "—")}</b></div>
    <div class="kv"><span>Effective date</span><b>${esc(s.effectiveDate ?? "—")}</b></div>
    <div class="kv"><span>Report date</span><b>${esc(s.reportDate ?? "—")}</b></div>
    <div class="kv"><span>Inspection date</span><b>${esc(s.inspectionDate ?? "—")}</b></div>
    <div class="kv"><span>Inspection type</span><b>${esc(s.inspectionType ?? "—")}</b></div>
    <div class="kv"><span>Client</span><b>${esc(s.clientName ?? "—")}</b></div>
    <div class="kv"><span>Lender</span><b>${esc(s.lenderName ?? "—")}</b></div>
    <div class="kv"><span>Loan #</span><b>${esc(s.loanNumber ?? "—")}</b></div>
    <div class="kv"><span>Appraisal fee</span><b>${typeof s.fee === "number" ? usd(s.fee) : "—"}</b></div>
  </div>

  <h2>Subject Property</h2>
  <div class="grid">
    <div class="kv"><span>Address</span><b>${esc(s.address ?? "—")}</b></div>
    <div class="kv"><span>City / State / ZIP</span><b>${esc(s.city ?? "—")}, ${esc(s.state ?? "—")} ${esc(s.zip ?? "")}</b></div>
    <div class="kv"><span>Property type</span><b>${esc(s.propertyType ?? "—")}</b></div>
    <div class="kv"><span>Occupancy</span><b>${esc(s.occupancy ?? "—")}</b></div>
    <div class="kv"><span>Year built</span><b>${esc(s.yearBuilt ?? "—")}</b></div>
    <div class="kv"><span>GLA / area (sqft)</span><b>${esc(s.gla ?? "—")}</b></div>
    <div class="kv"><span>Condition / Quality</span><b>${esc(s.condition ?? "—")} / ${esc(s.quality ?? "—")}</b></div>
    <div class="kv"><span>Zoning</span><b>${esc(s.zoning ?? "—")}</b></div>
    <div class="kv"><span>Parcel (APN)</span><b>${esc(s.parcelNumber ?? "—")}</b></div>
    <div class="kv"><span>Flood zone</span><b>${esc(s.floodZone ?? "—")}${s.femaPanel ? " (panel " + esc(s.femaPanel) + ")" : ""}</b></div>
    <div class="kv"><span>Assessed value</span><b>${typeof s.taxAssessedValue === "number" ? usd(s.taxAssessedValue) : "—"}${s.taxYear ? " (" + esc(s.taxYear) + ")" : ""}</b></div>
    <div class="kv"><span>Annual taxes</span><b>${typeof s.annualTaxes === "number" ? usd(s.annualTaxes) : "—"}</b></div>
  </div>
  <div style="margin-top:6px">
    <div class="kv"><span>Legal description</span><b>${esc(s.legalDescription ?? "—")}</b></div>
    <div class="kv"><span>Highest &amp; best use</span><b>${esc(s.highestBestUse ?? "—")}</b></div>
    <div class="kv"><span>Easements / access</span><b>${esc(s.easements ?? "—")}</b></div>
  </div>

  <h2>Approaches to Value</h2>
  <div class="approaches">
    <div class="a"><div class="l">Cost Approach</div><div class="v">${usd(costValue)}</div></div>
    <div class="a"><div class="l">Sales Comparison</div><div class="v">${usd(salesValue)}</div></div>
    <div class="a"><div class="l">Income Approach</div><div class="v">${usd(incomeValue)}</div></div>
  </div>
  <div class="muted">Each figure is drawn from a persisted analytical run in this workfile.</div>
  ${costValue ? `<div class="muted">Cost approach: RCN ${usd(co.cst_rcn)} − depreciation ${usd(co.cst_total_depreciation)} + site ${usd(co.cst_site_value)} → ${usd(costValue)}</div>` : ""}
  ${incomeValue ? `<div class="muted">Income approach: NOI ${usd(io.noi)} @ cap ${typeof io.capRate === "number" ? (io.capRate * 100).toFixed(2) + "%" : "—"} → ${usd(incomeValue)}${typeof io.dcfValue === "number" ? "; DCF " + usd(io.dcfValue) : ""}</div>` : ""}

  <h2>Sales Comparison Grid</h2>
  <table><thead><tr><th>Comparable</th><th>Sale price</th><th>Net adj.</th><th>Adjusted</th><th>Sale date</th><th>Cond/Qual</th><th>GLA</th></tr></thead><tbody>${compRows}</tbody></table>

  <h2>Reconciliation &amp; Final Opinion of Value</h2>
  ${certBlock}
  ${reconDraft ? `<div class="muted">Reconciliation narrative (appraiser draft, MUSE-assisted — non-final):</div><pre>${esc(reconDraft.text)}</pre>` : ""}

  <h2>Certification</h2>
  ${
    certified
      ? `<div class="muted">Opinion of value certified at ${usd(certified.value)} by ${esc(certified.certifiedBy)} on ${esc(new Date(certified.certifiedAt).toLocaleString())}.</div>`
      : `<div class="warn">Opinion of value not yet certified by the appraiser.</div>`
  }
  ${
    certDraft
      ? `<pre>${esc(certDraft.text)}</pre>`
      : `<div class="muted">No certification statements drafted. [Appraiser to add — MUSE can draft a non-final starting point.]</div>`
  }

  <h2>Assumptions &amp; Limiting Conditions</h2>
  ${
    alcDraft
      ? `<pre>${esc(alcDraft.text)}</pre>`
      : `<div class="muted">No assumptions &amp; limiting conditions drafted. [Appraiser to add — MUSE can draft a non-final starting point.]</div>`
  }

  <h2>Appraiser</h2>
  <div class="grid">
    <div class="kv"><span>Appraiser</span><b>${esc(ap.appraiserName ?? "—")}</b></div>
    <div class="kv"><span>License</span><b>${esc(ap.licenseNumber ?? "—")}${ap.licenseState ? ", " + esc(ap.licenseState) : ""}${ap.licenseType ? " (" + esc(ap.licenseType) + ")" : ""}</b></div>
    <div class="kv"><span>Company</span><b>${esc(ap.company ?? "—")}</b></div>
    <div class="kv"><span>Contact</span><b>${esc(ap.phone ?? "—")}${ap.email ? " · " + esc(ap.email) : ""}</b></div>
  </div>

  <h2>Evidence Ledger</h2>
  <table><thead><tr><th>Type</th><th>Source</th><th>ID</th></tr></thead><tbody>${evidenceRows}</tbody></table>

  <h2>Evidence / Audit Trail</h2>
  <table><thead><tr><th>When</th><th>Event</th><th>Risk</th><th>Reason</th><th>Detail</th></tr></thead><tbody>${traceRows}</tbody></table>

  <footer>
    Generated by Valuator Pro on TerraFusion Professional Runtime (Slice 3). This
    document is USPAP-aware in structure; it is not a certification of USPAP
    compliance. Figures trace to workfile runs and the certified value; the
    appraiser remains the author of record.
  </footer>
</body></html>`;
}

export class HtmlReportPackage implements ReportPackage {
  constructor(private readonly store: WorkfileStore) {}

  async assemble(ctx: RuntimeContext, workfileId: WorkfileId): Promise<PackageRef> {
    const wf = await this.store.getWorkfile(ctx, workfileId);
    if (!wf) throw new Error("Workfile not found.");
    return {
      packageId: randomUUID(),
      workfileId,
      format: "html",
      createdAt: new Date().toISOString(),
      locationRef: `/api/tfpr/assignments/${workfileId}/report`,
    };
  }
}
