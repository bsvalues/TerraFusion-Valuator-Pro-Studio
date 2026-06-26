/**
 * TerraFusion Valuator Pro — Regression Extraction API Route
 *
 * POST /api/regression-extraction
 *
 * Governance:
 *  - Requires fileNumber, correlationId, and reasonCode (>= 3 chars)
 *  - Minimum 3 comps required
 *  - All computation is server-side — no client-side math
 *  - Emits full input_snapshot and output_snapshot for audit trail
 */

import { NextRequest, NextResponse } from "next/server";
import {
  extractMarketAdjustments,
  applyExtractionToComps,
  type RegressionExtractionRequest,
  type RegressionExtractionResponse,
} from "@/lib/regression-extraction";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: RegressionExtractionRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  // --- Governance gate ---
  if (!body.fileNumber?.trim()) {
    return NextResponse.json({ ok: false, error: "fileNumber is required." }, { status: 400 });
  }
  if (!body.correlationId?.trim()) {
    return NextResponse.json({ ok: false, error: "correlationId is required." }, { status: 400 });
  }
  if (!body.reasonCode || body.reasonCode.trim().length < 3) {
    return NextResponse.json(
      { ok: false, error: "reasonCode must be at least 3 characters." },
      { status: 400 }
    );
  }
  if (!body.salePrices || body.salePrices.length < 3) {
    return NextResponse.json(
      { ok: false, error: "Minimum 3 comparable sales required for regression extraction." },
      { status: 400 }
    );
  }
  if (!body.variables || body.variables.length < 1) {
    return NextResponse.json(
      { ok: false, error: "At least one regression variable is required." },
      { status: 400 }
    );
  }
  if (body.salePrices.length !== body.compIds.length) {
    return NextResponse.json(
      { ok: false, error: "salePrices and compIds must have the same length." },
      { status: 400 }
    );
  }
  // Validate all sale prices are positive
  if (body.salePrices.some((p) => p <= 0)) {
    return NextResponse.json(
      { ok: false, error: "All sale prices must be positive." },
      { status: 400 }
    );
  }
  // Validate variable value arrays match n
  const n = body.salePrices.length;
  for (const v of body.variables) {
    if (v.values.length !== n) {
      return NextResponse.json(
        { ok: false, error: `Variable "${v.name}" has ${v.values.length} values but expected ${n}.` },
        { status: 400 }
      );
    }
  }

  // --- Run extraction ---
  let extraction;
  try {
    extraction = extractMarketAdjustments(
      {
        salePrices: body.salePrices,
        variables: body.variables,
        compIds: body.compIds,
      },
      `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      body.correlationId
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Regression computation failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 422 });
  }

  // --- Apply adjustments to comps ---
  let appliedAdjustments: RegressionExtractionResponse["appliedAdjustments"] = [];
  if (body.subject && body.compValues) {
    try {
      appliedAdjustments = applyExtractionToComps(extraction, body.subject, body.compValues);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to apply adjustments.";
      return NextResponse.json({ ok: false, error: message }, { status: 422 });
    }
  }

  const response: RegressionExtractionResponse = {
    ok: true,
    extraction,
    appliedAdjustments,
  };

  return NextResponse.json(response, { status: 200 });
}
