/**
 * TFPR Runtime — PostgresAuditTrace (append-only).
 *
 * emit() only ever INSERTs. There is no UPDATE/DELETE path here, by contract.
 */
import type {
  AuditTrace,
  RuntimeContext,
  TraceEvent,
  TraceEventInput,
  WorkfileId,
} from "../contracts";
import { iso, q } from "./db";

interface TraceRow {
  event_id: string;
  tenant_id: string;
  workfile_id: string;
  type: string;
  actor_id: string;
  correlation_id: string;
  at: Date | string;
  risk: string | null;
  lane: string | null;
  reason_code: string | null;
  classification: string;
  summary: string;
  payload_ref: string | null;
}

function toEvent(r: TraceRow): TraceEvent {
  return {
    eventId: r.event_id,
    tenantId: r.tenant_id,
    workfileId: r.workfile_id,
    type: r.type as TraceEvent["type"],
    actorId: r.actor_id,
    correlationId: r.correlation_id,
    at: iso(r.at),
    risk: (r.risk as TraceEvent["risk"]) ?? undefined,
    lane: r.lane ?? undefined,
    reasonCode: r.reason_code,
    classification: r.classification as TraceEvent["classification"],
    summary: r.summary,
    payloadRef: r.payload_ref,
  };
}

export class PostgresAuditTrace implements AuditTrace {
  async emit(ctx: RuntimeContext, event: TraceEventInput): Promise<void> {
    await q(
      `INSERT INTO tfpr_trace_events
        (tenant_id, workfile_id, type, actor_id, correlation_id, risk, lane, reason_code, classification, summary, payload_ref)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        ctx.tenantId, event.workfileId, event.type, event.actorId, event.correlationId,
        event.risk ?? null, event.lane ?? null, event.reasonCode ?? null,
        event.classification, event.summary, event.payloadRef ?? null,
      ],
    );
  }

  async list(ctx: RuntimeContext, workfileId: WorkfileId): Promise<TraceEvent[]> {
    const rows = await q<TraceRow>(
      `SELECT * FROM tfpr_trace_events WHERE workfile_id=$1 AND tenant_id=$2 ORDER BY at ASC, event_id ASC`,
      [workfileId, ctx.tenantId],
    );
    return rows.map(toEvent);
  }
}
