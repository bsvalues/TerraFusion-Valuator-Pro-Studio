/**
 * POST /api/narrative
 *
 * AI narrative generation endpoint for TerraFusion Valuator Pro.
 * Accepts real SubjectContext + runHistory from the workbench (not mock data).
 * Generates USPAP-compliant narratives for each report section.
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const getClient = () =>
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  });

type NarrativeType =
  | "property_description"
  | "scope_of_work"
  | "market_conditions"
  | "highest_best_use"
  | "cost_approach"
  | "sales_comparison"
  | "income_approach"
  | "reconciliation";

const SYSTEM_PROMPT = `You are a Certified General Appraiser writing sections of a USPAP-compliant appraisal report.
Write in a professional, formal appraisal report style.
Be specific and data-driven. Reference actual numbers when provided.
Do not use bullet points — write in complete paragraphs.
Do not include headers or titles — just the narrative text.
Keep each section to 2–4 paragraphs unless otherwise specified.
Do not mention Marshall & Swift or any specific cost manual by name.`;

function buildPrompt(body: Record<string, unknown>): string {
  const type = body.type as NarrativeType;
  const s = (body.subject ?? body.property ?? {}) as Record<string, unknown>;
  const a = (body.approaches ?? {}) as Record<string, unknown>;
  const m = (body.market ?? {}) as Record<string, unknown>;
  const runHistory = (body.runHistory ?? []) as Array<{runType: string; status: string; outputSnapshot?: Record<string, unknown>}>;

  const subjectDesc = [
    s.address && `${s.address}, ${s.city}, ${s.state} ${s.zip ?? ""}`,
    s.county && `${s.county} County`,
    s.propertyType && `Property Type: ${s.propertyType}`,
    (s.squareFeet ?? s.gla) && `GLA/Rentable Area: ${((s.squareFeet ?? s.gla) as number).toLocaleString()} sq ft`,
    s.yearBuilt && `Year Built: ${s.yearBuilt}`,
    s.condition && `Condition: ${s.condition}`,
    s.quality && `Quality: ${s.quality}`,
    s.bedrooms && `Bedrooms: ${s.bedrooms}`,
    s.bathrooms && `Bathrooms: ${s.bathrooms}`,
    (s.landAreaAcres ?? s.lotSize) && `Lot Size: ${s.landAreaAcres ?? s.lotSize} acres`,
    s.zoning && `Zoning: ${s.zoning}`,
    s.numberOfUnits && `Units: ${s.numberOfUnits}`,
    s.parkingSpaces && `Parking: ${s.parkingSpaces} spaces`,
  ].filter(Boolean).join("\n");

  const runSummary = runHistory
    .filter((r) => r.status === "complete")
    .map((r) => `${r.runType}: ${JSON.stringify(r.outputSnapshot ?? {}).slice(0, 200)}`)
    .join("\n");

  switch (type) {
    case "property_description":
      return `Write the Subject Property Description section (USPAP SR 2-2(a)(vii)).
${subjectDesc}
Intended Use: ${body.intendedUse ?? "Mortgage Finance"}
Property Rights: ${body.propertyRights ?? "Fee Simple"}
Effective Date: ${body.effectiveDate ?? "Current"}`;

    case "scope_of_work":
      return `Write the Scope of Work section (USPAP SR 2-2(a)(iii)).
Property Type: ${s.propertyType ?? "Commercial"}
Intended Use: ${body.intendedUse ?? "Mortgage Finance"}
Inspection Type: ${body.inspectionType ?? "Interior and Exterior"}
Report Type: ${body.reportType ?? "Appraisal Report"}
Approaches Developed: ${[a.cost ? "Cost" : null, a.salesComp ? "Sales Comparison" : null, a.income ? "Income" : null].filter(Boolean).join(", ") || "Sales Comparison"}
${body.scopeOfWork ? `Appraiser Notes: ${body.scopeOfWork}` : ""}`;

    case "market_conditions":
      return `Write the Market Conditions section (USPAP SR 1-3(a)).
Location: ${s.address ?? ""}, ${s.city ?? ""}, ${s.state ?? ""}, ${s.county ?? ""} County
Property Type: ${s.propertyType ?? "Commercial"}
Market Trend: ${m.marketTrend ?? "Stable"}
Median Price: ${m.medianPrice ? "$" + (m.medianPrice as number).toLocaleString() : "N/A"}
Avg Price/SF: ${m.averagePricePerSqft ? "$" + m.averagePricePerSqft : "N/A"}
Avg DOM: ${m.averageDaysOnMarket ?? "N/A"} days
List/Sale: ${m.listToSaleRatio ? ((m.listToSaleRatio as number) * 100).toFixed(1) + "%" : "N/A"}
Vacancy: ${m.vacancyRate ? ((m.vacancyRate as number) * 100).toFixed(1) + "%" : "N/A"}
Cap Rate: ${m.averageCapRate ? ((m.averageCapRate as number) * 100).toFixed(2) + "%" : "N/A"}
Effective Date: ${body.effectiveDate ?? "Current"}`;

    case "highest_best_use":
      return `Write the Highest and Best Use section (USPAP SR 1-3(b)). Apply four tests: legally permissible, physically possible, financially feasible, maximally productive. Two paragraphs: as vacant, as improved.
${subjectDesc}
Market Trend: ${m.marketTrend ?? "Stable"}`;

    case "cost_approach":
      return `Write the Cost Approach section (USPAP SR 1-4(b)).
${subjectDesc}
${a.cost ? `Indicated Value by Cost Approach: $${(a.cost as number).toLocaleString()}` : ""}
${runSummary ? `Run Data:\n${runSummary}` : ""}`;

    case "sales_comparison":
      return `Write the Sales Comparison Approach section (USPAP SR 1-4(a)).
${subjectDesc}
${a.salesComp ? `Indicated Value by Sales Comparison: $${(a.salesComp as number).toLocaleString()}` : ""}
${runSummary ? `Run Data:\n${runSummary}` : ""}`;

    case "income_approach":
      return `Write the Income Approach section (USPAP SR 1-4(c)).
${subjectDesc}
${a.income ? `Indicated Value by Income Approach: $${(a.income as number).toLocaleString()}` : ""}
${runSummary ? `Run Data:\n${runSummary}` : ""}`;

    case "reconciliation":
      return `Write the Value Reconciliation and Final Opinion section (USPAP SR 1-6).
${subjectDesc}
${a.cost ? `Cost Approach: $${(a.cost as number).toLocaleString()} (Weight: ${a.costWeight ?? 0}%)` : "Cost Approach: Not developed"}
${a.salesComp ? `Sales Comparison: $${(a.salesComp as number).toLocaleString()} (Weight: ${a.salesCompWeight ?? 0}%)` : "Sales Comparison: Not developed"}
${a.income ? `Income Approach: $${(a.income as number).toLocaleString()} (Weight: ${a.incomeWeight ?? 0}%)` : "Income Approach: Not developed"}
${a.final ? `Final Opinion of Value: $${(a.final as number).toLocaleString()}` : ""}
Effective Date: ${body.effectiveDate ?? "Current"}
Intended Use: ${body.intendedUse ?? "Mortgage Finance"}`;

    default:
      return `Write a USPAP-compliant appraisal narrative for section: ${type}`;
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const validTypes: NarrativeType[] = [
    "property_description", "scope_of_work", "market_conditions", "highest_best_use",
    "cost_approach", "sales_comparison", "income_approach", "reconciliation",
  ];

  if (!validTypes.includes(body.type as NarrativeType)) {
    return NextResponse.json({ error: `Invalid narrative type: ${body.type}` }, { status: 400 });
  }

  try {
    const client = getClient();
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildPrompt(body) },
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    const narrative = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ narrative, type: body.type });
  } catch (err) {
    console.error("Narrative API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Narrative generation failed" },
      { status: 500 }
    );
  }
}
