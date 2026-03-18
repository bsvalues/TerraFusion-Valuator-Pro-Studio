/**
 * POST /api/reconciliation/calculate
 *
 * Governed value reconciliation endpoint.
 * Accepts a ReconciliationVault + governance fields.
 * Returns ReconciliationResult and ReconciliationEvidence.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  ReconciliationVault,
  computeReconciliation,
  emitReconciliationEvidence,
} from "@/lib/reconciliation-vault";

interface ReconciliationRequest {
  vault: ReconciliationVault;
  reason_code: string;
  correlation_id: string;
  run_id: string;
}

export async function POST(req: NextRequest) {
  let body: ReconciliationRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { vault, reason_code, correlation_id, run_id } = body;

  if (!reason_code || reason_code.trim().length < 3) {
    return NextResponse.json({ error: "reason_code is required (min 3 chars)." }, { status: 422 });
  }
  if (!correlation_id || !run_id) {
    return NextResponse.json({ error: "correlation_id and run_id are required." }, { status: 422 });
  }
  if (!vault) {
    return NextResponse.json({ error: "vault payload is required." }, { status: 422 });
  }

  const result = computeReconciliation(vault);
  const evidence = emitReconciliationEvidence(vault, result, run_id, correlation_id);

  return NextResponse.json({
    status: "ok",
    run_id,
    correlation_id,
    reason_code,
    computed_at: evidence.computedAt,
    result,
    evidence,
  });
}
