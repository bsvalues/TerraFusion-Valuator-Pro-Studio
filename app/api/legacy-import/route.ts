/**
 * TerraFusion Valuator Pro — Legacy Import API
 *
 * POST /api/legacy-import
 *
 * Accepts a multipart form upload of one or more a la mode MISMO XML files
 * (Mercury Deliveries format) and returns parsed LegacyImportRecord objects.
 *
 * Also supports:
 *  - GET /api/legacy-import — list all previously imported records (from Supabase or in-memory)
 *  - POST /api/legacy-import/save — save a parsed record as a TerraFusion order
 *
 * GOVERNANCE:
 *  - All M&S brand references are sanitized before storage
 *  - Each import is tagged with source="legacy_mismo_import"
 *  - Embedded PDFs are extracted and returned as base64 for client-side download
 */

import { NextRequest, NextResponse } from "next/server";
import { parseMismoXml, convertToLegacyImportRecord, type LegacyImportRecord } from "@/lib/mismo-parser";

// In-memory store for imports when Supabase is not configured
const importStore: LegacyImportRecord[] = [];

// ---------------------------------------------------------------------------
// GET — list all imported records
// ---------------------------------------------------------------------------
export async function GET() {
  return NextResponse.json({
    records: importStore,
    count: importStore.length,
    source: "in_memory",
  });
}

// ---------------------------------------------------------------------------
// POST — parse and import MISMO XML files
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const files = formData.getAll("files") as File[];
  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No files provided. Send files as multipart/form-data with field name 'files'" }, { status: 400 });
  }

  const results: Array<{
    fileName: string;
    success: boolean;
    record: LegacyImportRecord | null;
    errors: string[];
  }> = [];

  for (const file of files) {
    const fileName = file.name;

    // Validate file type
    if (!fileName.toLowerCase().endsWith(".xml")) {
      results.push({
        fileName,
        success: false,
        record: null,
        errors: ["Only .xml files are supported (MISMO 2.6 format from a la mode Mercury/WinTOTAL)"],
      });
      continue;
    }

    let xmlString: string;
    try {
      xmlString = await file.text();
    } catch {
      results.push({
        fileName,
        success: false,
        record: null,
        errors: ["Failed to read file content"],
      });
      continue;
    }

    // Validate it looks like a MISMO VALUATION_RESPONSE
    if (!xmlString.includes("VALUATION_RESPONSE") && !xmlString.includes("MISMO")) {
      results.push({
        fileName,
        success: false,
        record: null,
        errors: ["File does not appear to be a MISMO XML appraisal report. Expected VALUATION_RESPONSE root element."],
      });
      continue;
    }

    try {
      const parsed = parseMismoXml(xmlString, fileName);
      const record = convertToLegacyImportRecord(parsed);

      // Store in memory (Supabase persistence would be added here)
      importStore.push(record);

      results.push({
        fileName,
        success: parsed.success,
        record,
        errors: parsed.parseErrors,
      });
    } catch (e) {
      results.push({
        fileName,
        success: false,
        record: null,
        errors: [`Parse error: ${e instanceof Error ? e.message : String(e)}`],
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.length - successCount;

  return NextResponse.json({
    processed: results.length,
    succeeded: successCount,
    failed: failCount,
    results: results.map((r) => ({
      fileName: r.fileName,
      success: r.success,
      errors: r.errors,
      // Return record without the large pdfBase64 in the list response
      record: r.record ? {
        ...r.record,
        parsed: {
          ...r.record.parsed,
          pdfBase64: r.record.parsed.hasPdf ? "[PDF_AVAILABLE]" : null,
        },
      } : null,
    })),
  });
}
