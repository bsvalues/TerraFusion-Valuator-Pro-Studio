/**
 * TFPR Contracts — common primitives
 *
 * TerraFusion Professional Runtime (TFPR). These are SHARED CONTRACTS:
 * pure types, ZERO behavior, no dependencies. Product modules (e.g. Valuator)
 * import from `lib/tfpr/contracts` ONLY — never from `lib/tfpr/runtime`.
 *
 * Approved direction: docs/architecture/TFPR_DECISION_RECORD.md
 */

// ── ID + time aliases (readability; all string at runtime) ──────────────────
export type Iso8601 = string; // e.g. "2026-06-08T17:00:00.000Z"
export type TenantId = string;
export type ActorId = string; // user/license id, or "muse"/"system"
export type WorkfileId = string;
export type CorrelationId = string;

// ── Governance primitives (mirror TerraFusion OS) ───────────────────────────
/** Write risk class. Governs confirmation/trace policy. */
export type RiskClass = "read_only" | "write_low" | "write_high" | "irreversible";

/** Audit payload classification. */
export type Classification = "PUBLIC" | "CONFIDENTIAL" | "RESTRICTED";

/** TerraPilot mode a governed action runs in. */
export type PilotMode = "pilot" | "muse" | "both";

/** Sovereign AI provider identity. `template` is the sovereign default. */
export type AiProviderId = "template" | "openai" | "anthropic" | "local" | "disabled";

/**
 * The execution context every runtime call is scoped by.
 * Per TFPR_DECISION_RECORD §6.4: tenantId is REQUIRED on every persisted
 * row/event; implementations stamp it from this context.
 */
export interface RuntimeContext {
  tenantId: TenantId;
  actorId: ActorId;
}
