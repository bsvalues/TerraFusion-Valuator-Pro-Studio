import { NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:8080";

/**
 * GET /api/workfiles/[id]/mismo
 *
 * Returns a MISMO 2.6-skeleton XML for the workfile.
 * Phase 3: structure only — field values wired in. Full XSD validation in Phase 4.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const { id } = params;

  // Fetch workfile from Rust API
  const upstream = await fetch(`${API_BASE}/api/v1/workfiles/${id}`);
  if (!upstream.ok) {
    return new NextResponse(`Workfile ${id} not found`, { status: 404 });
  }

  const record = (await upstream.json()) as {
    id: string;
    data: {
      contract_id: string;
      subject: {
        address?: string;
        city?: string;
        state?: string;
        zip?: string;
        county?: string;
        apn?: string;
        gla?: number | null;
        year_built?: number | null;
        quality?: string | null;
        condition?: string | null;
        bedrooms?: number | null;
        baths?: number | null;
        rooms?: number | null;
      };
      comparables: Array<{
        address?: string | null;
        sale_price?: number | null;
        sale_date?: string | null;
        gla?: number | null;
        year_built?: number | null;
        net_adj?: number | null;
        adj_sale_price?: number | null;
      }>;
      reconciliation: {
        final_value?: number | null;
        effective_date?: string | null;
        appraiser_name?: string | null;
        license_num?: string | null;
      };
    };
  };

  const wf = record.data;
  const s = wf.subject;
  const r = wf.reconciliation;
  const now = new Date().toISOString();

  const esc = (v: string | number | null | undefined): string => {
    if (v === null || v === undefined) return "";
    return String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  const compXml = wf.comparables
    .filter((c) => c.address)
    .map(
      (c, i) => `
  <COMPARABLE_SALE SequenceNumber="${i + 1}">
    <ADDRESS>${esc(c.address)}</ADDRESS>
    <SALE_PRICE>${esc(c.sale_price)}</SALE_PRICE>
    <SALE_DATE>${esc(c.sale_date)}</SALE_DATE>
    <GROSS_LIVING_AREA>${esc(c.gla)}</GROSS_LIVING_AREA>
    <YEAR_BUILT>${esc(c.year_built)}</YEAR_BUILT>
    <NET_ADJUSTMENT>${esc(c.net_adj)}</NET_ADJUSTMENT>
    <ADJUSTED_SALE_PRICE>${esc(c.adj_sale_price)}</ADJUSTED_SALE_PRICE>
  </COMPARABLE_SALE>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  MISMO 2.6 Appraisal Data — Phase 3 skeleton
  Workfile ID: ${esc(record.id)}
  Generated:   ${esc(now)}
  NOTE: Full XSD validation target Gate-4 (Phase 4).
-->
<MISMO_APPRAISAL_DATA xmlns="urn:mismo:appraisal:2.6" Version="2.6">

  <APPRAISAL_REPORT FormType="${esc(wf.contract_id)}">

    <SUBJECT_PROPERTY>
      <ADDRESS>${esc(s.address)}</ADDRESS>
      <CITY>${esc(s.city)}</CITY>
      <STATE>${esc(s.state)}</STATE>
      <ZIP_CODE>${esc(s.zip)}</ZIP_CODE>
      <COUNTY>${esc(s.county)}</COUNTY>
      <ASSESSORS_PARCEL_NUMBER>${esc(s.apn)}</ASSESSORS_PARCEL_NUMBER>
      <GROSS_LIVING_AREA>${esc(s.gla)}</GROSS_LIVING_AREA>
      <YEAR_BUILT>${esc(s.year_built)}</YEAR_BUILT>
      <UAD_QUALITY_RATING>${esc(s.quality)}</UAD_QUALITY_RATING>
      <UAD_CONDITION_RATING>${esc(s.condition)}</UAD_CONDITION_RATING>
      <TOTAL_ROOMS>${esc(s.rooms)}</TOTAL_ROOMS>
      <BEDROOMS>${esc(s.bedrooms)}</BEDROOMS>
      <FULL_BATHS>${esc(s.baths)}</FULL_BATHS>
    </SUBJECT_PROPERTY>

    <SALES_COMPARISON_APPROACH>
${compXml}
    </SALES_COMPARISON_APPROACH>

    <RECONCILIATION>
      <FINAL_VALUE_OPINION>${esc(r.final_value)}</FINAL_VALUE_OPINION>
      <EFFECTIVE_DATE>${esc(r.effective_date)}</EFFECTIVE_DATE>
    </RECONCILIATION>

    <APPRAISER>
      <NAME>${esc(r.appraiser_name)}</NAME>
      <LICENSE_NUMBER>${esc(r.license_num)}</LICENSE_NUMBER>
    </APPRAISER>

  </APPRAISAL_REPORT>

</MISMO_APPRAISAL_DATA>
`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="workfile-${id.slice(0, 8)}-mismo26.xml"`,
    },
  });
}
