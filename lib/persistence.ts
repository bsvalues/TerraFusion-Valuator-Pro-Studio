/**
 * TerraFusion Valuator Pro — Persistence Layer
 *
 * All Supabase CRUD operations for the appraisal workbench.
 * Gracefully degrades to no-op when Supabase is not configured.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { getSupabaseClient } from "./supabase";
import type { SubjectContext, RunRecord } from "./subject-context";
import type { DbAppraisalOrder, DbAnalyticalRun, DbAppraiserProfile } from "./supabase";

// ---------------------------------------------------------------------------
// Appraisal Orders
// ---------------------------------------------------------------------------

export async function saveOrder(subject: SubjectContext): Promise<{ id: string } | null> {
  const db = getSupabaseClient();
  if (!db || !subject.fileNumber) return null;

  const payload = {
    file_number: subject.fileNumber,
    client_name: subject.clientName,
    client_email: subject.clientEmail,
    lender_name: subject.lenderName,
    loan_number: subject.loanNumber,
    property_address: subject.address,
    property_city: subject.city,
    property_state: subject.state,
    property_zip: subject.zip,
    property_county: subject.county,
    property_type: subject.propertyType,
    intended_use: subject.intendedUse,
    property_rights: subject.propertyRights,
    report_type: subject.reportType,
    inspection_type: subject.inspectionType,
    effective_date: subject.effectiveDate,
    report_date: subject.reportDate,
    due_date: subject.dueDate,
    status: "analysis",
    appraiser_id: null as string | null,
    final_value: null as number | null,
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any)
    .from("appraisal_orders")
    .upsert(payload, { onConflict: "file_number" })
    .select("id")
    .single();

  if (error) {
    console.error("saveOrder error:", error.message);
    return null;
  }
  return data as { id: string };
}

export async function loadOrders(): Promise<DbAppraisalOrder[]> {
  const db = getSupabaseClient();
  if (!db) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any)
    .from("appraisal_orders")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("loadOrders error:", error.message);
    return [];
  }
  return (data ?? []) as DbAppraisalOrder[];
}

export async function updateOrderStatus(fileNumber: string, status: string, finalValue?: number): Promise<void> {
  const db = getSupabaseClient();
  if (!db) return;

  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (finalValue !== undefined) update.final_value = finalValue;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db as any)
    .from("appraisal_orders")
    .update(update)
    .eq("file_number", fileNumber);

  if (error) console.error("updateOrderStatus error:", error.message);
}

// ---------------------------------------------------------------------------
// Subject Context
// ---------------------------------------------------------------------------

export async function saveSubjectContext(orderId: string, subject: SubjectContext): Promise<void> {
  const db = getSupabaseClient();
  if (!db || !subject.fileNumber) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db as any)
    .from("subject_contexts")
    .upsert(
      {
        order_id: orderId,
        file_number: subject.fileNumber,
        context_json: subject,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "order_id" }
    );

  if (error) console.error("saveSubjectContext error:", error.message);
}

export async function loadSubjectContext(fileNumber: string): Promise<SubjectContext | null> {
  const db = getSupabaseClient();
  if (!db) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any)
    .from("subject_contexts")
    .select("context_json")
    .eq("file_number", fileNumber)
    .single();

  if (error || !data) return null;
  return (data as { context_json: SubjectContext }).context_json;
}

// ---------------------------------------------------------------------------
// Analytical Runs
// ---------------------------------------------------------------------------

export async function saveRun(orderId: string, run: RunRecord): Promise<void> {
  const db = getSupabaseClient();
  if (!db) return;

  const payload: Omit<DbAnalyticalRun, "id" | "created_at"> = {
    order_id: orderId,
    run_id: run.runId,
    correlation_id: run.correlationId,
    run_type: run.runType,
    file_number: run.fileNumber,
    status: run.status,
    reason_code: run.reasonCode,
    started_at: run.startedAt,
    completed_at: run.completedAt,
    input_snapshot: run.inputSnapshot,
    output_snapshot: run.outputSnapshot,
    evidence_refs: run.evidenceRefs,
    narrative_ready: run.narrativeReady,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db as any)
    .from("analytical_runs")
    .upsert(payload, { onConflict: "run_id" });

  if (error) console.error("saveRun error:", error.message);
}

export async function loadRunHistory(fileNumber: string): Promise<RunRecord[]> {
  const db = getSupabaseClient();
  if (!db) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any)
    .from("analytical_runs")
    .select("*")
    .eq("file_number", fileNumber)
    .order("started_at", { ascending: true });

  if (error) {
    console.error("loadRunHistory error:", error.message);
    return [];
  }

  return ((data ?? []) as DbAnalyticalRun[]).map((row) => ({
    runId: row.run_id,
    runType: row.run_type as RunRecord["runType"],
    fileNumber: row.file_number,
    propertyId: null,
    triggeredBy: "appraiser",
    reasonCode: row.reason_code,
    correlationId: row.correlation_id,
    status: row.status as RunRecord["status"],
    startedAt: row.started_at,
    completedAt: row.completed_at,
    inputSnapshot: row.input_snapshot,
    outputSnapshot: row.output_snapshot,
    evidenceRefs: row.evidence_refs as RunRecord["evidenceRefs"],
    narrativeReady: row.narrative_ready,
  }));
}

// ---------------------------------------------------------------------------
// Appraiser Profile
// ---------------------------------------------------------------------------

export async function saveAppraiserProfile(profile: Partial<DbAppraiserProfile>): Promise<void> {
  const db = getSupabaseClient();
  if (!db) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db as any)
    .from("appraiser_profiles")
    .upsert(
      { ...profile, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );

  if (error) console.error("saveAppraiserProfile error:", error.message);
}

export async function loadAppraiserProfile(): Promise<DbAppraiserProfile | null> {
  const db = getSupabaseClient();
  if (!db) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any)
    .from("appraiser_profiles")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as DbAppraiserProfile;
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export async function checkSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  const db = getSupabaseClient();
  if (!db) {
    return {
      connected: false,
      message: "Supabase not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set). Running in in-memory mode.",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db as any).from("appraisal_orders").select("id").limit(1);

  if (error) {
    return { connected: false, message: `Supabase connection failed: ${error.message}` };
  }
  return { connected: true, message: "Supabase connected successfully." };
}
