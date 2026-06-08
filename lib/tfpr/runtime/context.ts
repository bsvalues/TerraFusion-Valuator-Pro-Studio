/**
 * TFPR Runtime — RuntimeContext resolution.
 *
 * Slice 1: single-tenant stub. tenantId/actorId come from env, but the scoping
 * shape is real — every persisted row/event carries this tenantId. Real
 * auth/multi-tenancy replaces this without changing the contract.
 */
import type { RuntimeContext } from "../contracts";

export function resolveContext(): RuntimeContext {
  return {
    tenantId: process.env.TFPR_TENANT_ID || "tenant_dev",
    actorId: process.env.TFPR_ACTOR_ID || "appraiser",
  };
}
