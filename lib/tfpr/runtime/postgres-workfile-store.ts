/**
 * TFPR Runtime — PostgresWorkfileStore (v0 WorkfileStore implementation).
 *
 * Every row is stamped with ctx.tenantId and every read is tenant-filtered.
 * Backed by `pg`; fails loud if DATABASE_URL is unset (see db.ts).
 */
import type {
  Assignment,
  AssignmentSummary,
  CertifiedValue,
  CreateAssignmentInput,
  DraftArtifact,
  EvidenceItem,
  EvidenceRef,
  RunRecord,
  RuntimeContext,
  Workfile,
  WorkfileId,
  WorkfileStore,
  WorkfileSubject,
} from "../contracts";
import { iso, q } from "./db";

interface AssignmentRow {
  id: string;
  tenant_id: string;
  module_id: string;
  title: string;
  status: string;
  entitlement_tier: string;
  created_by: string;
  created_at: Date | string;
  updated_at: Date | string;
}
interface RunRow {
  run_id: string;
  tenant_id: string;
  workfile_id: string;
  run_type: string;
  actor_id: string;
  reason_code: string;
  correlation_id: string;
  status: string;
  started_at: Date | string;
  completed_at: Date | string | null;
  input_snapshot: Record<string, unknown>;
  output_snapshot: Record<string, unknown>;
  evidence_refs: EvidenceRef[];
  narrative_ready: boolean;
}
interface EvidenceRow {
  evidence_id: string;
  tenant_id: string;
  workfile_id: string;
  source_type: string;
  source_id: string;
  source_label: string;
  retrieved_at: Date | string;
  confidence: string | number;
  notes: string | null;
  created_at: Date | string;
}
interface DraftRow {
  draft_id: string;
  tenant_id: string;
  workfile_id: string;
  capability_id: string;
  draft_text: string;
  provider_id: string;
  is_final: boolean;
  risk: string;
  created_by: string;
  correlation_id: string;
  created_at: Date | string;
}
interface CertifiedRow {
  workfile_id: string;
  tenant_id: string;
  value: string | number;
  certified_by: string;
  reason_code: string;
  correlation_id: string;
  certified_at: Date | string;
}
interface SubjectRow {
  subject_json: WorkfileSubject;
}

function toAssignment(r: AssignmentRow): Assignment {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    moduleId: r.module_id,
    title: r.title,
    status: r.status as Assignment["status"],
    entitlementTier: r.entitlement_tier as Assignment["entitlementTier"],
    createdBy: r.created_by,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}
function toEvidenceItem(r: EvidenceRow): EvidenceItem {
  return {
    evidenceId: r.evidence_id,
    tenantId: r.tenant_id,
    workfileId: r.workfile_id,
    sourceType: r.source_type,
    sourceId: r.source_id,
    sourceLabel: r.source_label,
    retrievedAt: iso(r.retrieved_at),
    confidence: Number(r.confidence),
    notes: r.notes,
    createdAt: iso(r.created_at),
  };
}
function toRun(r: RunRow): RunRecord {
  return {
    runId: r.run_id,
    tenantId: r.tenant_id,
    workfileId: r.workfile_id,
    runType: r.run_type,
    actorId: r.actor_id,
    reasonCode: r.reason_code,
    correlationId: r.correlation_id,
    status: r.status as RunRecord["status"],
    startedAt: iso(r.started_at),
    completedAt: r.completed_at ? iso(r.completed_at) : null,
    inputSnapshot: r.input_snapshot,
    outputSnapshot: r.output_snapshot,
    evidenceRefs: r.evidence_refs,
    narrativeReady: r.narrative_ready,
  };
}
function toDraft(r: DraftRow): DraftArtifact {
  return {
    draftId: r.draft_id,
    tenantId: r.tenant_id,
    workfileId: r.workfile_id,
    capabilityId: r.capability_id,
    text: r.draft_text,
    providerId: r.provider_id as DraftArtifact["providerId"],
    final: false,
    risk: "write_low",
    createdBy: r.created_by,
    correlationId: r.correlation_id,
    createdAt: iso(r.created_at),
  };
}
function toCertified(r: CertifiedRow): CertifiedValue {
  return {
    value: Number(r.value),
    certifiedBy: r.certified_by,
    reasonCode: r.reason_code,
    correlationId: r.correlation_id,
    certifiedAt: iso(r.certified_at),
  };
}

export class PostgresWorkfileStore implements WorkfileStore {
  async createAssignment(ctx: RuntimeContext, input: CreateAssignmentInput): Promise<Assignment> {
    const rows = await q<AssignmentRow>(
      `INSERT INTO tfpr_assignments (tenant_id, module_id, title, status, entitlement_tier, created_by)
       VALUES ($1,$2,$3,'draft',$4,$5) RETURNING *`,
      [ctx.tenantId, input.moduleId, input.title, input.entitlementTier, ctx.actorId],
    );
    const assignment = toAssignment(rows[0]);
    if (input.subject) {
      await this.saveSubject(ctx, assignment.id, input.subject);
    }
    return assignment;
  }

  async getAssignment(ctx: RuntimeContext, id: WorkfileId): Promise<Assignment | null> {
    const rows = await q<AssignmentRow>(
      `SELECT * FROM tfpr_assignments WHERE id=$1 AND tenant_id=$2`,
      [id, ctx.tenantId],
    );
    return rows[0] ? toAssignment(rows[0]) : null;
  }

  async listAssignments(ctx: RuntimeContext): Promise<AssignmentSummary[]> {
    const rows = await q<AssignmentRow>(
      `SELECT * FROM tfpr_assignments WHERE tenant_id=$1 ORDER BY updated_at DESC LIMIT 200`,
      [ctx.tenantId],
    );
    return rows.map((r) => ({
      id: r.id,
      moduleId: r.module_id,
      title: r.title,
      status: r.status as AssignmentSummary["status"],
      updatedAt: iso(r.updated_at),
    }));
  }

  async getWorkfile(ctx: RuntimeContext, id: WorkfileId): Promise<Workfile | null> {
    const assignment = await this.getAssignment(ctx, id);
    if (!assignment) return null;

    const [subjectRows, runRows, evidenceRows, draftRows, certifiedRows] = await Promise.all([
      q<SubjectRow>(
        `SELECT subject_json FROM tfpr_workfile_subjects WHERE workfile_id=$1 AND tenant_id=$2`,
        [id, ctx.tenantId],
      ),
      q<RunRow>(
        `SELECT * FROM tfpr_workfile_runs WHERE workfile_id=$1 AND tenant_id=$2 ORDER BY started_at ASC`,
        [id, ctx.tenantId],
      ),
      q<EvidenceRow>(
        `SELECT * FROM tfpr_workfile_evidence WHERE workfile_id=$1 AND tenant_id=$2 ORDER BY created_at ASC`,
        [id, ctx.tenantId],
      ),
      q<DraftRow>(
        `SELECT * FROM tfpr_workfile_drafts WHERE workfile_id=$1 AND tenant_id=$2 ORDER BY created_at ASC`,
        [id, ctx.tenantId],
      ),
      q<CertifiedRow>(
        `SELECT * FROM tfpr_certified_values WHERE workfile_id=$1 AND tenant_id=$2`,
        [id, ctx.tenantId],
      ),
    ]);

    return {
      assignment,
      subject: subjectRows[0]?.subject_json ?? null,
      runs: runRows.map(toRun),
      evidence: evidenceRows.map(toEvidenceItem),
      drafts: draftRows.map(toDraft),
      certifiedValue: certifiedRows[0] ? toCertified(certifiedRows[0]) : null,
    };
  }

  async saveSubject(ctx: RuntimeContext, id: WorkfileId, subject: WorkfileSubject): Promise<void> {
    await q(
      `INSERT INTO tfpr_workfile_subjects (workfile_id, tenant_id, subject_json, updated_at)
       VALUES ($1,$2,$3,NOW())
       ON CONFLICT (workfile_id) DO UPDATE SET subject_json=EXCLUDED.subject_json, updated_at=NOW()`,
      [id, ctx.tenantId, JSON.stringify(subject)],
    );
    await this.touch(ctx, id, "in_progress");
  }

  async appendRun(ctx: RuntimeContext, id: WorkfileId, run: RunRecord): Promise<void> {
    await q(
      `INSERT INTO tfpr_workfile_runs
        (run_id, tenant_id, workfile_id, run_type, actor_id, reason_code, correlation_id,
         status, started_at, completed_at, input_snapshot, output_snapshot, evidence_refs, narrative_ready)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (run_id) DO UPDATE SET
         status=EXCLUDED.status, completed_at=EXCLUDED.completed_at,
         output_snapshot=EXCLUDED.output_snapshot, evidence_refs=EXCLUDED.evidence_refs,
         narrative_ready=EXCLUDED.narrative_ready`,
      [
        run.runId, ctx.tenantId, id, run.runType, run.actorId, run.reasonCode, run.correlationId,
        run.status, run.startedAt, run.completedAt, JSON.stringify(run.inputSnapshot),
        JSON.stringify(run.outputSnapshot), JSON.stringify(run.evidenceRefs), run.narrativeReady,
      ],
    );
    await this.touch(ctx, id, "in_progress");
  }

  async appendEvidence(ctx: RuntimeContext, id: WorkfileId, evidence: EvidenceRef): Promise<EvidenceItem> {
    const rows = await q<EvidenceRow>(
      `INSERT INTO tfpr_workfile_evidence
        (tenant_id, workfile_id, source_type, source_id, source_label, retrieved_at, confidence, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        ctx.tenantId, id, evidence.sourceType, evidence.sourceId, evidence.sourceLabel,
        evidence.retrievedAt, evidence.confidence, evidence.notes,
      ],
    );
    await this.touch(ctx, id, "in_progress");
    return toEvidenceItem(rows[0]);
  }

  async appendDraft(ctx: RuntimeContext, id: WorkfileId, draft: DraftArtifact): Promise<void> {
    await q(
      `INSERT INTO tfpr_workfile_drafts
        (draft_id, tenant_id, workfile_id, capability_id, draft_text, provider_id, is_final, risk, created_by, correlation_id)
       VALUES ($1,$2,$3,$4,$5,$6,FALSE,'write_low',$7,$8)`,
      [
        draft.draftId, ctx.tenantId, id, draft.capabilityId, draft.text,
        draft.providerId, draft.createdBy, draft.correlationId,
      ],
    );
    await this.touch(ctx, id, "in_progress");
  }

  async saveCertifiedValue(ctx: RuntimeContext, id: WorkfileId, value: CertifiedValue): Promise<void> {
    await q(
      `INSERT INTO tfpr_certified_values
        (workfile_id, tenant_id, value, certified_by, reason_code, correlation_id, certified_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (workfile_id) DO UPDATE SET
         value=EXCLUDED.value, certified_by=EXCLUDED.certified_by, reason_code=EXCLUDED.reason_code,
         correlation_id=EXCLUDED.correlation_id, certified_at=EXCLUDED.certified_at`,
      [id, ctx.tenantId, value.value, value.certifiedBy, value.reasonCode, value.correlationId, value.certifiedAt],
    );
    await this.touch(ctx, id, "certified");
  }

  async saveModuleState(ctx: RuntimeContext, id: WorkfileId, moduleKey: string, state: unknown): Promise<void> {
    await q(
      `INSERT INTO tfpr_workfile_module_state (workfile_id, tenant_id, module_key, state_json, updated_at)
       VALUES ($1,$2,$3,$4,NOW())
       ON CONFLICT (workfile_id, module_key) DO UPDATE SET state_json=EXCLUDED.state_json, updated_at=NOW()`,
      [id, ctx.tenantId, moduleKey, JSON.stringify(state)],
    );
    await this.touch(ctx, id, "in_progress");
  }

  async getModuleState(ctx: RuntimeContext, id: WorkfileId, moduleKey: string): Promise<unknown | null> {
    const rows = await q<{ state_json: unknown }>(
      `SELECT state_json FROM tfpr_workfile_module_state WHERE workfile_id=$1 AND tenant_id=$2 AND module_key=$3`,
      [id, ctx.tenantId, moduleKey],
    );
    return rows[0]?.state_json ?? null;
  }

  private async touch(ctx: RuntimeContext, id: WorkfileId, status: string): Promise<void> {
    await q(
      `UPDATE tfpr_assignments SET updated_at=NOW(),
         status = CASE WHEN status='certified' THEN status ELSE $3 END
       WHERE id=$1 AND tenant_id=$2`,
      [id, ctx.tenantId, status],
    );
  }
}
