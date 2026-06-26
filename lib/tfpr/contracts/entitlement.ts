/**
 * TFPR Contracts — Entitlement
 *
 * Billing lives OUTSIDE the workflow (commercial checkout/account layer).
 * Inside TFPR the workbench sees ENTITLEMENT STATE ONLY (TFPR_DECISION_RECORD §4).
 */
import type { RuntimeContext } from "./common";

export type EntitlementTier =
  | "trial"
  | "solo"
  | "pro"
  | "firm"
  | "report"
  | "expired";

export interface Entitlement {
  /** Current tier for the context's tenant/actor. */
  tierFor(ctx: RuntimeContext): Promise<EntitlementTier>;
  /** Whether a named capability is permitted under the current tier. */
  can(ctx: RuntimeContext, capability: string): Promise<boolean>;
}
