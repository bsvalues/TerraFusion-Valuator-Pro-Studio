import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  // Initialize lazily so missing env var only fails at request time, not build time
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  });
  try {
    const body = await request.json();
    const {
      type,
      property,
      market,
      valuation,
      risk,
      incomeResult,
      costResult,
      comps,
      approaches,
    } = body;

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "reconciliation") {
      systemPrompt = `You are a Certified Residential Appraiser (CRA) and MAI-designated commercial appraiser with 20+ years of experience writing USPAP-compliant appraisal reports. 
Write in professional, formal appraisal report language. Be concise but thorough. 
Use proper appraisal terminology. Do not use bullet points — write in flowing paragraphs.
Maximum 3 paragraphs. Do not include headers.`;

      userPrompt = `Write the Value Reconciliation section for an appraisal report with the following data:

Property: ${property?.address || "Subject Property"}, ${property?.city || ""}, ${property?.state || ""}
Property Type: ${property?.propertyType || "residential"}
GLA: ${property?.squareFeet?.toLocaleString() || "N/A"} sq ft
Year Built: ${property?.yearBuilt || "N/A"}
Condition: ${property?.condition || "Average"}

Approaches to Value:
${approaches?.salesComp ? `- Sales Comparison Approach: $${approaches.salesComp.toLocaleString()} (Weight: ${approaches.salesCompWeight || 70}%)` : "- Sales Comparison Approach: Not developed"}
${approaches?.income ? `- Income Capitalization Approach: $${approaches.income.toLocaleString()} (Weight: ${approaches.incomeWeight || 15}%)` : "- Income Capitalization Approach: Not applicable"}
${approaches?.cost ? `- Cost Approach: $${approaches.cost.toLocaleString()} (Weight: ${approaches.costWeight || 15}%)` : "- Cost Approach: Not developed"}

Final Opinion of Value: $${approaches?.final?.toLocaleString() || "N/A"}
Market Trend: ${market?.marketTrend || "Stable"}
Risk Level: ${risk?.riskLevel || "Moderate"}

Write the reconciliation narrative explaining the weight given to each approach and the final opinion of value.`;

    } else if (type === "market_conditions") {
      systemPrompt = `You are a senior real estate appraiser writing the Neighborhood and Market Conditions section of a USPAP-compliant appraisal report. 
Write 2-3 professional paragraphs in formal appraisal language. No bullet points. No headers.`;

      userPrompt = `Write the Market Conditions section for an appraisal report:

Subject Property: ${property?.address || "Subject Property"}, ${property?.city || ""}, ${property?.state || ""}
Market Region: ${market?.region || "Local Market"}
Market Trend: ${market?.marketTrend || "Stable"}
Median Price: $${market?.medianPrice?.toLocaleString() || "N/A"}
Average Price/SqFt: $${market?.averagePricePerSqft || "N/A"}
Average Days on Market: ${market?.averageDaysOnMarket || "N/A"} days
List-to-Sale Ratio: ${market?.listToSaleRatio ? (market.listToSaleRatio * 100).toFixed(1) + "%" : "N/A"}
Vacancy Rate: ${market?.vacancyRate ? (market.vacancyRate * 100).toFixed(1) + "%" : "N/A"}
Average Cap Rate: ${market?.averageCapRate ? (market.averageCapRate * 100).toFixed(2) + "%" : "N/A"}

Describe current market conditions, supply/demand dynamics, and how they affect the subject property's value.`;

    } else if (type === "highest_best_use") {
      systemPrompt = `You are a certified appraiser writing the Highest and Best Use section of a USPAP-compliant appraisal report. 
Analyze the four tests: legally permissible, physically possible, financially feasible, and maximally productive.
Write 2 paragraphs — one for "as vacant" and one for "as improved." Use formal appraisal language.`;

      userPrompt = `Write the Highest and Best Use analysis:

Property: ${property?.address || "Subject Property"}, ${property?.city || ""}, ${property?.state || ""}
Property Type: ${property?.propertyType || "residential"}
Zoning: ${property?.zoning || "Residential"}
GLA: ${property?.squareFeet?.toLocaleString() || "N/A"} sq ft
Year Built: ${property?.yearBuilt || "N/A"}
Condition: ${property?.condition || "Average"}
Market Trend: ${market?.marketTrend || "Stable"}`;

    } else if (type === "property_description") {
      systemPrompt = `You are a certified appraiser writing the Property Description section of a USPAP-compliant appraisal report. 
Write 1-2 professional paragraphs describing the subject property. Use formal appraisal language.`;

      userPrompt = `Write a property description for the appraisal report:

Address: ${property?.address || "Subject Property"}, ${property?.city || ""}, ${property?.state || ""} ${property?.zip || ""}
County: ${property?.county || "N/A"}
Legal Description: ${property?.legalDescription || "See public records"}
Property Type: ${property?.propertyType || "residential"}
GLA: ${property?.squareFeet?.toLocaleString() || "N/A"} sq ft
Year Built: ${property?.yearBuilt || "N/A"}
Condition: ${property?.condition || "Average"}
Bedrooms: ${property?.bedrooms || "N/A"}
Bathrooms: ${property?.bathrooms || "N/A"}
Lot Size: ${property?.landAreaAcres || "N/A"} acres
Zoning: ${property?.zoning || "N/A"}`;

    } else if (type === "scope_of_work") {
      systemPrompt = `You are a certified appraiser writing the Scope of Work section of a USPAP-compliant appraisal report per USPAP SR 1-2. 
Write 1-2 professional paragraphs. Be specific about what was and was not inspected, researched, and analyzed.`;

      userPrompt = `Write the Scope of Work section:

Property Type: ${property?.propertyType || "residential"}
Intended Use: Mortgage lending / financing
Intended User: Lender/client and their assigns
Approaches Developed: ${approaches?.salesComp ? "Sales Comparison" : ""}${approaches?.income ? ", Income Capitalization" : ""}${approaches?.cost ? ", Cost Approach" : ""}
Inspection Type: Interior and exterior inspection
Report Type: Summary Appraisal Report`;

    } else {
      return NextResponse.json({ error: "Invalid narrative type" }, { status: 400 });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 600,
      temperature: 0.3,
    });

    const narrative = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ narrative });

  } catch (err) {
    console.error("Narrative API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Narrative generation failed" },
      { status: 500 }
    );
  }
}
