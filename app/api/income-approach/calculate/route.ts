/**
 * POST /api/income-approach/calculate
 *
 * Governed income approach calculation endpoint.
 * Accepts an IncomeVault payload + governance fields, returns
 * DirectCapResult, DCFResult, and IncomeRunEvidence.
 *
 * GOVERNANCE REQUIREMENTS:
 *  - reason_code (min 3 chars)
 *  - correlation_id
 *  - run_id
 *  - Vault must pass validateIncomeVault()
 */

import { NextRequest, NextResponse } from "next/server";
import {
  IncomeVault,
  validateIncomeVault,
  computeDirectCap,
  computeDCF,
  emitIncomeEvidence,
} from "@/lib/income-vault";

interface IncomeCalculateRequest {
  vault: IncomeVault;
  reason_code: string;
  correlation_id: string;
  run_id: string;
  include_dcf?: boolean;
  initial_investment?: number;
}

export async function POST(req: NextRequest) {
  let body: IncomeCalculateRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { vault, reason_code, correlation_id, run_id, include_dcf = true, initial_investment } = body;

  // ── Governance gates ─────────────────────────────────────────────────────
  if (!reason_code || reason_code.trim().length < 3) {
    return NextResponse.json(
      { error: "reason_code is required and must be at least 3 characters." },
      { status: 422 }
    );
  }
  if (!correlation_id || !run_id) {
    return NextResponse.json(
      { error: "correlation_id and run_id are required for audit lineage." },
      { status: 422 }
    );
  }
  if (!vault) {
    return NextResponse.json({ error: "vault payload is required." }, { status: 422 });
  }

  // ── Domain validation ────────────────────────────────────────────────────
  const governance = validateIncomeVault(vault);
  if (!governance.valid) {
    return NextResponse.json(
      {
        error: "Income vault failed governance validation.",
        validation_errors: governance.errors,
        warnings: governance.warnings,
      },
      { status: 422 }
    );
  }

  // ── Calculations ─────────────────────────────────────────────────────────
  const directCap = computeDirectCap(vault);
  const dcf = include_dcf ? computeDCF(vault, initial_investment) : null;

  // ── Evidence emission ────────────────────────────────────────────────────
  const evidence = emitIncomeEvidence(vault, directCap, dcf, run_id, correlation_id);

  return NextResponse.json(
    {
      status: "ok",
      run_id,
      correlation_id,
      reason_code,
      computed_at: evidence.computedAt,
      direct_cap: directCap,
      dcf: dcf,
      evidence,
      warnings: governance.warnings,
    },
    { status: 200 }
  );
}
