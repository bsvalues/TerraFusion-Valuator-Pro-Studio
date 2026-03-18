/**
 * TerraFusion Valuator Pro — Legacy Import Save Endpoint
 *
 * POST /api/legacy-import/save
 *
 * Converts a parsed LegacyImportRecord into a full TerraFusion SubjectContext
 * and saves it to the orders store (Supabase or in-memory).
 *
 * Body: { record: LegacyImportRecord }
 *
 * Returns: { orderId, fileNumber, message }
 */

import { NextRequest, NextResponse } from "next/server";
import type { LegacyImportRecord } from "@/lib/mismo-parser";
import { saveOrder } from "@/lib/persistence";
import type { SubjectContext } from "@/lib/subject-context";

export async function POST(req: NextRequest) {
  let body: { record: LegacyImportRecord };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { record } = body;
  if (!record || !record.subjectContext) {
    return NextResponse.json({ error: "Missing record or subjectContext" }, { status: 400 });
  }

  const sc = record.subjectContext;
  const parsed = record.parsed;

  // Map LegacyImportRecord → SubjectContext
  const subjectContext: SubjectContext = {
    // Order Identity
    fileNumber: sc.fileNumber,
    clientName: parsed.borrower.name || null,
    clientEmail: null,
    lenderName: parsed.lender.name || null,
    loanNumber: parsed.report.additionalFileNumber || null,
    effectiveDate: sc.effectiveDate || null,
    reportDate: parsed.report.signedDate || null,
    dueDate: null,
    // USPAP Assignment Conditions
    intendedUse: sc.intendedUse,
    intendedUsers: ["Client", "Lender"],
    propertyRights: sc.propertyRights,
    reportType: "Appraisal Report",
    inspectionType: "Interior and Exterior",
    scopeOfWork: null,
    // Subject Property Identity
    propertyId: null,
    parcelNumber: parsed.subject.parcelId || null,
    address: sc.address,
    city: sc.city,
    county: sc.county || null,
    state: sc.state,
    zip: sc.zip || null,
    latitude: null,
    longitude: null,
    // Subject Property Characteristics
    propertyType: sc.propertyType || "Single Family Residential",
    yearBuilt: sc.yearBuilt ?? null,
    gla: sc.gla ?? null,
    siteArea: parsed.subject.siteArea
      ? parseFloat(parsed.subject.siteArea.replace(/[^0-9.]/g, "")) || null
      : null,
    bedrooms: sc.bedrooms ?? null,
    bathrooms: sc.bathrooms ?? null,
    garageSpaces: null,
    condition: null,
    quality: null,
    view: parsed.subject.view || null,
    location: null,
    // Commercial-specific
    numberOfUnits: parsed.subject.livingUnits ?? null,
    numberOfFloors: parsed.subject.stories ?? null,
    occupancyRate: null,
    capRate: null,
    parkingSpaces: null,
    zoning: parsed.subject.zoningClass || null,
    landUse: null,
  };

  // Try to save to Supabase (will no-op gracefully if not configured)
  const savedId = await saveOrder(subjectContext);

  return NextResponse.json({
    success: true,
    orderId: savedId ?? `local_${Date.now()}`,
    fileNumber: sc.fileNumber,
    address: `${sc.address}, ${sc.city}, ${sc.state}`,
    finalValue: record.valueSummary.finalValue,
    effectiveDate: sc.effectiveDate,
    message: savedId
      ? `Order saved to database with ID: ${savedId}`
      : `Order created locally (Supabase not configured). File: ${sc.fileNumber}`,
    persistence: savedId ? "supabase" : "local",
  });
}
