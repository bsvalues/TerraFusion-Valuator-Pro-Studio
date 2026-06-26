import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ReportData {
  fileNumber: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  propertyType: string;
  gla: number;
  yearBuilt: number;
  condition: string;
  bedrooms?: number;
  bathrooms?: number;
  lotSize?: number;
  zoning?: string;
  effectiveDate: string;
  reportDate: string;
  clientName: string;
  intendedUse: string;
  reportType: string;
  scopeOfWork: string;
  finalValue: number;
  confidence: number;
  riskLevel: string;
  marketTrend: string;
  // Appraiser
  appraiserName: string;
  appraiserTitle: string;
  appraiserLicense: string;
  appraiserLicenseState: string;
  appraiserLicenseType: string;
  firmName: string;
  firmAddress: string;
  firmPhone: string;
  firmEmail: string;
  designations: string[];
  // Comps
  comps: Array<{
    address: string;
    salePrice: number;
    saleDate: string;
    gla: number;
    pricePerSqft: number;
    yearBuilt: number;
    condition: string;
    netAdj: number;
    adjPrice: number;
    grossAdj: number;
  }>;
  // Narratives
  narratives: Record<string, string>;
  // Market
  medianPrice: number;
  avgPsf: number;
  avgDom: number;
  listToSale: number;
  // Value approaches
  salesCompValue: number;
  costValue?: number;
  incomeValue?: number;
  salesCompWeight: number;
  costWeight: number;
  incomeWeight: number;
}

function generatePdfHtml(data: ReportData): string {
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const today = new Date(data.reportDate).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });

  const compsTable = data.comps.map((c, i) => `
    <tr>
      <td class="label">ITEM</td>
      <td>${c.address}</td>
    </tr>
    <tr>
      <td class="label">Sale Price</td>
      <td>${fmt(c.salePrice)}</td>
    </tr>
    <tr>
      <td class="label">Sale Date</td>
      <td>${c.saleDate}</td>
    </tr>
    <tr>
      <td class="label">GLA</td>
      <td>${c.gla.toLocaleString()} sf</td>
    </tr>
    <tr>
      <td class="label">$/SF</td>
      <td>$${c.pricePerSqft}/sf</td>
    </tr>
    <tr>
      <td class="label">Year Built</td>
      <td>${c.yearBuilt}</td>
    </tr>
    <tr>
      <td class="label">Condition</td>
      <td>${c.condition}</td>
    </tr>
    <tr>
      <td class="label">Net Adj.</td>
      <td class="${c.netAdj >= 0 ? "pos" : "neg"}">${c.netAdj >= 0 ? "+" : ""}${fmt(c.netAdj)}</td>
    </tr>
    <tr>
      <td class="label">Adj. Price</td>
      <td class="bold">${fmt(c.adjPrice)}</td>
    </tr>
    <tr>
      <td class="label">Gross Adj.</td>
      <td>${c.grossAdj.toFixed(1)}%</td>
    </tr>
  `).join('<tr><td colspan="2" class="divider"></td></tr>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Appraisal Report ${data.fileNumber}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 10pt;
    color: #1a1a1a;
    background: white;
    line-height: 1.4;
  }
  .page {
    width: 8.5in;
    min-height: 11in;
    padding: 0.75in 0.75in 0.75in 0.75in;
    margin: 0 auto;
    page-break-after: always;
  }
  .page:last-child { page-break-after: avoid; }

  /* Cover Page */
  .cover-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #1a1a1a;
    padding-bottom: 12px;
    margin-bottom: 24px;
  }
  .firm-name { font-size: 16pt; font-weight: bold; letter-spacing: 1px; }
  .firm-sub { font-size: 9pt; color: #555; margin-top: 2px; }
  .file-number { text-align: right; }
  .file-label { font-size: 8pt; color: #555; text-transform: uppercase; letter-spacing: 1px; }
  .file-value { font-size: 14pt; font-weight: bold; font-family: 'Courier New', monospace; }

  .report-title { font-size: 11pt; text-transform: uppercase; letter-spacing: 2px; color: #555; margin-bottom: 8px; }
  .property-address { font-size: 22pt; font-weight: bold; margin-bottom: 4px; }
  .property-sub { font-size: 12pt; color: #333; margin-bottom: 24px; }

  .cover-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0;
    border: 1px solid #ccc;
    margin-bottom: 24px;
  }
  .cover-cell {
    padding: 10px 12px;
    border-right: 1px solid #ccc;
    border-bottom: 1px solid #ccc;
  }
  .cover-cell:nth-child(3n) { border-right: none; }
  .cover-cell-label { font-size: 7pt; text-transform: uppercase; letter-spacing: 1px; color: #777; margin-bottom: 3px; }
  .cover-cell-value { font-size: 10pt; font-weight: bold; }

  .value-box {
    border: 2px solid #1a1a1a;
    padding: 20px;
    text-align: center;
    margin-bottom: 24px;
    background: #f8f8f8;
  }
  .value-label { font-size: 9pt; text-transform: uppercase; letter-spacing: 2px; color: #555; margin-bottom: 8px; }
  .value-amount { font-size: 32pt; font-weight: bold; letter-spacing: -1px; }
  .value-sub { font-size: 9pt; color: #555; margin-top: 6px; }

  .sig-block {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-top: 24px;
  }
  .sig-line {
    border-bottom: 1px solid #1a1a1a;
    padding-bottom: 4px;
    margin-bottom: 4px;
    min-height: 36px;
  }
  .sig-label { font-size: 8pt; color: #555; text-transform: uppercase; letter-spacing: 1px; }
  .sig-value { font-size: 10pt; font-weight: bold; }

  /* Section Pages */
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #1a1a1a;
    padding-bottom: 6px;
    margin-bottom: 16px;
  }
  .section-title { font-size: 12pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
  .section-ref { font-size: 8pt; color: #777; font-style: italic; }

  .data-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0;
    border: 1px solid #ddd;
    margin-bottom: 16px;
  }
  .data-cell {
    padding: 8px 10px;
    border-right: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
  }
  .data-cell:nth-child(3n) { border-right: none; }
  .data-label { font-size: 7pt; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 2px; }
  .data-value { font-size: 10pt; }

  .narrative {
    font-size: 10pt;
    line-height: 1.6;
    text-align: justify;
    margin-bottom: 16px;
    padding: 12px;
    background: #fafafa;
    border-left: 3px solid #1a1a1a;
  }
  .narrative-placeholder {
    font-size: 9pt;
    color: #999;
    font-style: italic;
    padding: 12px;
    border: 1px dashed #ccc;
    margin-bottom: 16px;
  }

  /* Comp Grid */
  .comp-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    margin-bottom: 16px;
  }
  .comp-table th {
    background: #1a1a1a;
    color: white;
    padding: 5px 6px;
    text-align: left;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .comp-table td {
    padding: 4px 6px;
    border-bottom: 1px solid #eee;
    vertical-align: top;
  }
  .comp-table tr:nth-child(even) td { background: #f9f9f9; }
  .comp-table .num { text-align: right; font-family: 'Courier New', monospace; }
  .comp-table .pos { color: #166534; }
  .comp-table .neg { color: #991b1b; }

  /* Reconciliation */
  .recon-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
  }
  .recon-table td { padding: 8px 10px; border-bottom: 1px solid #eee; }
  .recon-table .approach { font-weight: bold; font-size: 10pt; }
  .recon-table .weight { color: #555; font-size: 9pt; }
  .recon-table .value { text-align: right; font-family: 'Courier New', monospace; font-size: 11pt; font-weight: bold; }
  .recon-final { background: #1a1a1a; color: white; }
  .recon-final td { padding: 10px 12px; }

  /* Certification */
  .cert-list { list-style: none; counter-reset: cert-counter; }
  .cert-list li {
    counter-increment: cert-counter;
    display: flex;
    gap: 10px;
    margin-bottom: 8px;
    font-size: 9.5pt;
    line-height: 1.5;
  }
  .cert-list li::before {
    content: counter(cert-counter) ".";
    font-weight: bold;
    min-width: 16px;
    flex-shrink: 0;
  }

  /* Assumptions */
  .assumptions-list { list-style: none; counter-reset: assump-counter; }
  .assumptions-list li {
    counter-increment: assump-counter;
    display: flex;
    gap: 10px;
    margin-bottom: 6px;
    font-size: 9.5pt;
    line-height: 1.5;
  }
  .assumptions-list li::before {
    content: counter(assump-counter) ".";
    font-weight: bold;
    min-width: 16px;
    flex-shrink: 0;
    color: #555;
  }

  .footer {
    position: fixed;
    bottom: 0.4in;
    left: 0.75in;
    right: 0.75in;
    display: flex;
    justify-content: space-between;
    font-size: 7.5pt;
    color: #999;
    border-top: 1px solid #ddd;
    padding-top: 4px;
  }

  @media print {
    body { margin: 0; }
    .page { margin: 0; padding: 0.75in; }
    .footer { position: fixed; }
  }

  .bold { font-weight: bold; }
  .pos { color: #166534; }
  .neg { color: #991b1b; }
  .label { color: #555; font-size: 8.5pt; }
  .divider { height: 8px; background: #f0f0f0; }
  .badge {
    display: inline-block;
    padding: 2px 6px;
    border: 1px solid #ccc;
    border-radius: 3px;
    font-size: 7.5pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-right: 4px;
  }
  .badge-green { border-color: #166534; color: #166534; }
  .badge-blue { border-color: #1e40af; color: #1e40af; }
  .badge-gray { border-color: #555; color: #555; }
</style>
</head>
<body>

<!-- PAGE 1: COVER PAGE -->
<div class="page">
  <div class="cover-header">
    <div>
      <div class="firm-name">${data.firmName || "TerraFusion Valuator Pro"}</div>
      <div class="firm-sub">Commercial Fee Appraisal Platform · USPAP-aware</div>
      ${data.firmAddress ? `<div class="firm-sub">${data.firmAddress}</div>` : ""}
      ${data.firmPhone ? `<div class="firm-sub">${data.firmPhone} · ${data.firmEmail}</div>` : ""}
    </div>
    <div class="file-number">
      <div class="file-label">File No.</div>
      <div class="file-value">${data.fileNumber}</div>
    </div>
  </div>

  <div class="report-title">Appraisal Report</div>
  <div class="property-address">${data.address}</div>
  <div class="property-sub">${data.city}, ${data.state} ${data.zip} · ${data.county} County</div>

  <div class="cover-grid">
    <div class="cover-cell">
      <div class="cover-cell-label">Property Type</div>
      <div class="cover-cell-value">${data.propertyType}</div>
    </div>
    <div class="cover-cell">
      <div class="cover-cell-label">GLA / RBA</div>
      <div class="cover-cell-value">${data.gla.toLocaleString()} sq ft</div>
    </div>
    <div class="cover-cell">
      <div class="cover-cell-label">Year Built</div>
      <div class="cover-cell-value">${data.yearBuilt}</div>
    </div>
    <div class="cover-cell">
      <div class="cover-cell-label">Effective Date</div>
      <div class="cover-cell-value">${today}</div>
    </div>
    <div class="cover-cell">
      <div class="cover-cell-label">Client / Lender</div>
      <div class="cover-cell-value">${data.clientName || "Client"}</div>
    </div>
    <div class="cover-cell">
      <div class="cover-cell-label">Intended Use</div>
      <div class="cover-cell-value">${data.intendedUse}</div>
    </div>
    <div class="cover-cell">
      <div class="cover-cell-label">Report Date</div>
      <div class="cover-cell-value">${today}</div>
    </div>
    <div class="cover-cell">
      <div class="cover-cell-label">Report Type</div>
      <div class="cover-cell-value">${data.reportType}</div>
    </div>
    <div class="cover-cell">
      <div class="cover-cell-label">Scope of Work</div>
      <div class="cover-cell-value">${data.scopeOfWork}</div>
    </div>
  </div>

  <div class="value-box">
    <div class="value-label">Final Opinion of Market Value</div>
    <div class="value-amount">${fmt(data.finalValue)}</div>
    <div class="value-sub">
      As of ${today} · ${data.propertyType}<br/>
      Confidence: ${data.confidence}% · Risk: ${data.riskLevel} · Market: ${data.marketTrend}
    </div>
  </div>

  <div class="sig-block">
    <div>
      <div class="sig-label">Appraiser</div>
      <div class="sig-line">&nbsp;</div>
      <div class="sig-value">${data.appraiserName || "___________________________"}</div>
      ${data.appraiserTitle ? `<div style="font-size:9pt;color:#555;">${data.appraiserTitle}</div>` : ""}
      ${data.appraiserLicense ? `<div style="font-size:9pt;color:#555;">License #${data.appraiserLicense} (${data.appraiserLicenseState}) · ${data.appraiserLicenseType}</div>` : ""}
      ${data.designations?.length ? `<div style="margin-top:4px;">${data.designations.map(d => `<span class="badge badge-gray">${d}</span>`).join("")}</div>` : ""}
    </div>
    <div>
      <div class="sig-label">Date of Signature & Report</div>
      <div class="sig-line">&nbsp;</div>
      <div class="sig-value">${today}</div>
    </div>
  </div>

  <div style="margin-top:24px;display:flex;gap:8px;">
    <span class="badge badge-green">USPAP-aware</span>
    <span class="badge badge-blue">FIRREA</span>
    <span class="badge badge-blue">FNMA</span>
    <span class="badge badge-gray">UAD</span>
  </div>
</div>

<!-- PAGE 2: PROPERTY DESCRIPTION & SCOPE OF WORK -->
<div class="page">
  <div class="section-header">
    <div class="section-title">Section 1 — Property Description</div>
    <div class="section-ref">USPAP SR 1-2(e)</div>
  </div>
  <div class="data-grid">
    <div class="data-cell"><div class="data-label">Address</div><div class="data-value">${data.address}, ${data.city}, ${data.state} ${data.zip}</div></div>
    <div class="data-cell"><div class="data-label">County</div><div class="data-value">${data.county}</div></div>
    <div class="data-cell"><div class="data-label">Property Type</div><div class="data-value">${data.propertyType}</div></div>
    <div class="data-cell"><div class="data-label">GLA</div><div class="data-value">${data.gla.toLocaleString()} sq ft</div></div>
    <div class="data-cell"><div class="data-label">Year Built</div><div class="data-value">${data.yearBuilt}</div></div>
    <div class="data-cell"><div class="data-label">Condition</div><div class="data-value">${data.condition}</div></div>
    ${data.bedrooms !== undefined ? `<div class="data-cell"><div class="data-label">Bedrooms</div><div class="data-value">${data.bedrooms}</div></div>` : ""}
    ${data.bathrooms !== undefined ? `<div class="data-cell"><div class="data-label">Bathrooms</div><div class="data-value">${data.bathrooms}</div></div>` : ""}
    ${data.lotSize ? `<div class="data-cell"><div class="data-label">Lot Size</div><div class="data-value">${data.lotSize} acres</div></div>` : ""}
    ${data.zoning ? `<div class="data-cell"><div class="data-label">Zoning</div><div class="data-value">${data.zoning}</div></div>` : ""}
  </div>
  ${data.narratives?.description
    ? `<div class="narrative">${data.narratives.description ?? data.narratives.property_description}</div>`
    : `<div class="narrative-placeholder">AI-drafted narrative not yet generated. Click "AI Draft" in the report editor to generate USPAP-aware language for this section.</div>`
  }

  <div class="section-header" style="margin-top:24px;">
    <div class="section-title">Section 2 — Scope of Work</div>
    <div class="section-ref">USPAP SR 1-2</div>
  </div>
  <div class="data-grid">
    <div class="data-cell"><div class="data-label">Inspection Type</div><div class="data-value">${data.scopeOfWork}</div></div>
    <div class="data-cell"><div class="data-label">Intended Use</div><div class="data-value">${data.intendedUse}</div></div>
    <div class="data-cell"><div class="data-label">Intended User</div><div class="data-value">Lender/Client and their assigns</div></div>
    <div class="data-cell"><div class="data-label">Type of Value</div><div class="data-value">Market Value</div></div>
    <div class="data-cell"><div class="data-label">Sales Comparison</div><div class="data-value">Developed</div></div>
    <div class="data-cell"><div class="data-label">Prior Sale History</div><div class="data-value">3-year history researched</div></div>
  </div>
  ${data.narratives?.scope
    ? `<div class="narrative">${data.narratives.scope ?? data.narratives.scope_of_work}</div>`
    : `<div class="narrative-placeholder">Scope of work narrative not yet generated.</div>`
  }

  <div class="section-header" style="margin-top:24px;">
    <div class="section-title">Section 3 — Neighborhood & Market Conditions</div>
    <div class="section-ref">USPAP SR 1-3</div>
  </div>
  <div class="data-grid">
    <div class="data-cell"><div class="data-label">Market Trend</div><div class="data-value">${data.marketTrend}</div></div>
    <div class="data-cell"><div class="data-label">Median Sale Price</div><div class="data-value">${fmt(data.medianPrice)}</div></div>
    <div class="data-cell"><div class="data-label">Avg Price / SF</div><div class="data-value">$${data.avgPsf}/sf</div></div>
    <div class="data-cell"><div class="data-label">Avg Days on Market</div><div class="data-value">${data.avgDom} days</div></div>
    <div class="data-cell"><div class="data-label">List-to-Sale Ratio</div><div class="data-value">${data.listToSale}%</div></div>
    <div class="data-cell"><div class="data-label">Risk Level</div><div class="data-value">${data.riskLevel}</div></div>
  </div>
  ${data.narratives?.market
    ? `<div class="narrative">${data.narratives.market ?? data.narratives.market_conditions}</div>`
    : `<div class="narrative-placeholder">Market conditions narrative not yet generated.</div>`
  }
</div>

<!-- PAGE 3: HIGHEST & BEST USE + SALES COMPARISON -->
<div class="page">
  <div class="section-header">
    <div class="section-title">Section 4 — Highest & Best Use</div>
    <div class="section-ref">USPAP SR 1-3(b)</div>
  </div>
  ${data.narratives?.hbu
    ? `<div class="narrative">${data.narratives.hbu ?? data.narratives.highest_best_use}</div>`
    : `
  <p style="margin-bottom:8px;"><strong>As Vacant:</strong> ${data.propertyType} use, consistent with current zoning${data.zoning ? ` (${data.zoning})` : ""}. Legally permissible, physically possible, financially feasible, and maximally productive.</p>
  <p><strong>As Improved:</strong> Continued use as ${data.propertyType.toLowerCase()}. The existing improvements represent the highest and best use as improved.</p>
  `}

  <div class="section-header" style="margin-top:24px;">
    <div class="section-title">Section 5 — Sales Comparison Approach</div>
    <div class="section-ref">USPAP SR 1-4(a)</div>
  </div>

  ${data.comps.length > 0 ? `
  <table class="comp-table">
    <thead>
      <tr>
        <th>Item</th>
        <th>Subject</th>
        ${data.comps.map((_, i) => `<th>Comp ${i + 1}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Address</td>
        <td>${data.address}</td>
        ${data.comps.map(c => `<td>${c.address}</td>`).join("")}
      </tr>
      <tr>
        <td>Sale Price</td>
        <td>—</td>
        ${data.comps.map(c => `<td class="num">${fmt(c.salePrice)}</td>`).join("")}
      </tr>
      <tr>
        <td>Sale Date</td>
        <td>${today}</td>
        ${data.comps.map(c => `<td>${c.saleDate}</td>`).join("")}
      </tr>
      <tr>
        <td>GLA (sf)</td>
        <td>${data.gla.toLocaleString()}</td>
        ${data.comps.map(c => `<td class="num">${c.gla.toLocaleString()}</td>`).join("")}
      </tr>
      <tr>
        <td>$/SF</td>
        <td>—</td>
        ${data.comps.map(c => `<td class="num">$${c.pricePerSqft}/sf</td>`).join("")}
      </tr>
      <tr>
        <td>Year Built</td>
        <td>${data.yearBuilt}</td>
        ${data.comps.map(c => `<td>${c.yearBuilt}</td>`).join("")}
      </tr>
      <tr>
        <td>Condition</td>
        <td>${data.condition}</td>
        ${data.comps.map(c => `<td>${c.condition}</td>`).join("")}
      </tr>
      <tr style="background:#f0f0f0;">
        <td>Net Adj.</td>
        <td>—</td>
        ${data.comps.map(c => `<td class="num ${c.netAdj >= 0 ? "pos" : "neg"}">${c.netAdj >= 0 ? "+" : ""}${fmt(c.netAdj)}</td>`).join("")}
      </tr>
      <tr style="background:#f0f0f0;">
        <td><strong>Adj. Price</strong></td>
        <td>—</td>
        ${data.comps.map(c => `<td class="num bold">${fmt(c.adjPrice)}</td>`).join("")}
      </tr>
      <tr>
        <td>Gross Adj. %</td>
        <td>—</td>
        ${data.comps.map(c => `<td class="num">${c.grossAdj.toFixed(1)}%</td>`).join("")}
      </tr>
    </tbody>
  </table>
  <p style="margin-bottom:8px;font-size:9pt;color:#555;">
    <strong>Indicated Value by Sales Comparison:</strong> Range ${fmt(Math.min(...data.comps.map(c => c.adjPrice)))} — ${fmt(Math.max(...data.comps.map(c => c.adjPrice)))} · Reconciled: <strong>${fmt(data.salesCompValue)}</strong>
  </p>
  ` : `<div class="narrative-placeholder">No comparable sales data available.</div>`}

  ${data.narratives?.salesComp
    ? `<div class="narrative">${data.narratives.salesComp ?? data.narratives.sales_comparison}</div>`
    : ""
  }
</div>

<!-- PAGE 4: COST APPROACH + RECONCILIATION + CERTIFICATION -->
<div class="page">
  ${data.costValue ? `
  <div class="section-header">
    <div class="section-title">Section 6 — Cost Approach</div>
    <div class="section-ref">USPAP SR 1-4(c)</div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:9.5pt;">
    <tr><td style="padding:5px 8px;border-bottom:1px solid #eee;">Replacement Cost New (RCN)</td><td style="text-align:right;padding:5px 8px;border-bottom:1px solid #eee;font-family:'Courier New',monospace;">${fmt(data.gla * 185)}</td></tr>
    <tr><td style="padding:5px 8px;border-bottom:1px solid #eee;color:#555;">Less: Physical Depreciation</td><td style="text-align:right;padding:5px 8px;border-bottom:1px solid #eee;font-family:'Courier New',monospace;color:#991b1b;">(${fmt(Math.round(data.gla * 185 * 0.47))})</td></tr>
    <tr><td style="padding:5px 8px;border-bottom:1px solid #eee;">Depreciated Value of Improvements</td><td style="text-align:right;padding:5px 8px;border-bottom:1px solid #eee;font-family:'Courier New',monospace;">${fmt(Math.round(data.gla * 185 * 0.53))}</td></tr>
    <tr><td style="padding:5px 8px;border-bottom:1px solid #eee;">Plus: Site Value (Land)</td><td style="text-align:right;padding:5px 8px;border-bottom:1px solid #eee;font-family:'Courier New',monospace;">${fmt(Math.round(data.costValue * 0.3))}</td></tr>
    <tr style="background:#f0f0f0;font-weight:bold;"><td style="padding:6px 8px;">Indicated Value by Cost Approach</td><td style="text-align:right;padding:6px 8px;font-family:'Courier New',monospace;">${fmt(data.costValue)}</td></tr>
  </table>
  ` : ""}

  <div class="section-header" style="margin-top:${data.costValue ? "24px" : "0"};">
    <div class="section-title">Section 7 — Value Reconciliation</div>
    <div class="section-ref">USPAP SR 1-6</div>
  </div>
  <table class="recon-table">
    <tr>
      <td class="approach">Sales Comparison Approach</td>
      <td class="weight">Weight: ${data.salesCompWeight}%</td>
      <td class="value">${fmt(data.salesCompValue)}</td>
    </tr>
    ${data.incomeValue ? `
    <tr>
      <td class="approach">Income Capitalization Approach</td>
      <td class="weight">Weight: ${data.incomeWeight}%</td>
      <td class="value">${fmt(data.incomeValue)}</td>
    </tr>
    ` : `
    <tr>
      <td class="approach" style="color:#999;">Income Capitalization Approach</td>
      <td class="weight" style="color:#999;">Not Applicable</td>
      <td class="value" style="color:#999;">—</td>
    </tr>
    `}
    ${data.costValue ? `
    <tr>
      <td class="approach">Cost Approach</td>
      <td class="weight">Weight: ${data.costWeight}%</td>
      <td class="value">${fmt(data.costValue)}</td>
    </tr>
    ` : ""}
    <tr class="recon-final">
      <td colspan="2" style="font-weight:bold;font-size:11pt;text-transform:uppercase;letter-spacing:1px;">Final Opinion of Market Value</td>
      <td style="text-align:right;font-family:'Courier New',monospace;font-size:14pt;font-weight:bold;">${fmt(data.finalValue)}</td>
    </tr>
  </table>
  <p style="font-size:8.5pt;color:#555;margin-bottom:16px;">As of ${today} · ${data.propertyType}</p>
  ${data.narratives?.reconciliation
    ? `<div class="narrative">${data.narratives.reconciliation}</div>`
    : ""
  }

  <div class="section-header" style="margin-top:24px;">
    <div class="section-title">Section 8 — Appraiser Certification</div>
    <div class="section-ref">USPAP SR 2-3</div>
  </div>
  <p style="margin-bottom:12px;font-size:9.5pt;">I certify that, to the best of my knowledge and belief:</p>
  <ol class="cert-list">
    <li>The statements of fact contained in this report are true and correct.</li>
    <li>The reported analyses, opinions, and conclusions are limited only by the reported assumptions and limiting conditions and are my personal, impartial, and unbiased professional analyses, opinions, and conclusions.</li>
    <li>I have no present or prospective interest in the property that is the subject of this report and no personal interest with respect to the parties involved.</li>
    <li>I have no bias with respect to the property that is the subject of this report or to the parties involved with this assignment.</li>
    <li>My engagement in this assignment was not contingent upon developing or reporting predetermined results.</li>
    <li>My compensation for completing this assignment is not contingent upon the development or reporting of a predetermined value or direction in value that favors the cause of the client.</li>
    <li>My analyses, opinions, and conclusions were developed, and this report has been prepared, in conformity with the Uniform Standards of Professional Appraisal Practice (USPAP).</li>
    <li>I have made a personal inspection of the property that is the subject of this report.</li>
    <li>No one provided significant real property appraisal assistance to the person signing this certification.</li>
    <li>I have not performed any services, as an appraiser or in any other capacity, regarding the property that is the subject of this report within the three-year period immediately preceding acceptance of this assignment.</li>
  </ol>

  <div class="sig-block" style="margin-top:20px;">
    <div>
      <div class="sig-label">Appraiser Signature</div>
      <div class="sig-line">&nbsp;</div>
      <div class="sig-value">${data.appraiserName || "___________________________"}</div>
      ${data.appraiserTitle ? `<div style="font-size:9pt;color:#555;">${data.appraiserTitle}</div>` : ""}
      ${data.appraiserLicense ? `<div style="font-size:9pt;color:#555;">License #${data.appraiserLicense} (${data.appraiserLicenseState})</div>` : ""}
    </div>
    <div>
      <div class="sig-label">Date of Signature & Report</div>
      <div class="sig-line">&nbsp;</div>
      <div class="sig-value">${today}</div>
    </div>
  </div>

  <div class="section-header" style="margin-top:24px;">
    <div class="section-title">Section 9 — Assumptions & Limiting Conditions</div>
    <div class="section-ref"></div>
  </div>
  <ol class="assumptions-list">
    <li>No responsibility is assumed for legal matters or questions of survey, nor for matters of a legal nature.</li>
    <li>The information furnished by others is believed to be reliable, but no warranty is given for its accuracy.</li>
    <li>It is assumed that there are no hidden or unapparent conditions of the property, subsoil, or structures that render it more or less valuable.</li>
    <li>It is assumed that there is full compliance with all applicable federal, state, and local environmental regulations and laws unless noncompliance is stated, defined, and considered in the appraisal report.</li>
    <li>It is assumed that all applicable zoning and use regulations and restrictions have been complied with, unless a nonconformity has been stated, defined, and considered in the appraisal report.</li>
    <li>Possession of this report, or a copy thereof, does not carry with it the right of publication. It may not be used for any purpose by any person other than the party to whom it is addressed without the written consent of the appraiser.</li>
  </ol>

  <div style="margin-top:24px;padding-top:12px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:7.5pt;color:#999;">
    <span>TerraFusion Valuator Pro Studio · Commercial Fee Appraisal Platform · USPAP-aware</span>
    <span>File No. ${data.fileNumber} · Generated ${today}</span>
  </div>
</div>

</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const data: ReportData = await req.json();

    const html = generatePdfHtml(data);

    // Return HTML for browser-based printing (window.print())
    // This approach works without any server-side PDF library
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Report-FileNumber": data.fileNumber,
      },
    });
  } catch (err) {
    console.error("PDF export error:", err);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Return a sample report for testing
  const sampleData: ReportData = {
    fileNumber: "TF-26-SAMPLE",
    address: "123 Main Street",
    city: "Austin",
    state: "TX",
    zip: "78701",
    county: "Travis",
    propertyType: "Single Family Residential",
    gla: 2000,
    yearBuilt: 1995,
    condition: "Average",
    bedrooms: 3,
    bathrooms: 2,
    lotSize: 0.25,
    zoning: "R-1",
    effectiveDate: new Date().toISOString(),
    reportDate: new Date().toISOString(),
    clientName: "Sample Lender",
    intendedUse: "Mortgage Lending / Financing",
    reportType: "Summary Appraisal",
    scopeOfWork: "Interior & Exterior Inspection",
    finalValue: 528699,
    confidence: 88,
    riskLevel: "Low",
    marketTrend: "Rising",
    appraiserName: "",
    appraiserTitle: "",
    appraiserLicense: "",
    appraiserLicenseState: "TX",
    appraiserLicenseType: "Certified General",
    firmName: "TerraFusion Valuator Pro",
    firmAddress: "",
    firmPhone: "",
    firmEmail: "",
    designations: [],
    comps: [
      { address: "600 Oak Ave", salePrice: 569745, saleDate: "2025-12-03", gla: 2000, pricePerSqft: 285, yearBuilt: 1985, condition: "Good", netAdj: 2460, adjPrice: 522460, grossAdj: 5.7 },
      { address: "400 Elm St", salePrice: 375795, saleDate: "2025-09-04", gla: 1600, pricePerSqft: 235, yearBuilt: 1990, condition: "Good", netAdj: 45112, adjPrice: 461112, grossAdj: 20.0 },
      { address: "200 Pine Rd", salePrice: 533531, saleDate: "2025-06-06", gla: 2000, pricePerSqft: 267, yearBuilt: 1995, condition: "Good", netAdj: -12180, adjPrice: 507820, grossAdj: 7.8 },
    ],
    narratives: {},
    medianPrice: 520000,
    avgPsf: 260,
    avgDom: 18,
    listToSale: 102,
    salesCompValue: 528699,
    costValue: 369480,
    salesCompWeight: 70,
    costWeight: 30,
    incomeWeight: 0,
  };

  const html = generatePdfHtml(sampleData);
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
