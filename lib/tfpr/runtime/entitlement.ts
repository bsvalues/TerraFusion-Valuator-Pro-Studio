/**
 * TFPR Runtime — Entitlement (stub).
 *
 * Billing lives outside the workflow. Slice 1 reads the tier from env so the
 * gate is real (e.g. set TFPR_ENTITLEMENT_TIER=expired to prove blocking),
 * while real account/billing integration comes later.
 */
import type { Entitlement, EntitlementTier, RuntimeContext } from "../contracts";

export class StubEntitlement implements Entitlement {
  async tierFor(_ctx: RuntimeContext): Promise<EntitlementTier> {
    const tier = process.env.TFPR_ENTITLEMENT_TIER as EntitlementTier | undefined;
    return tier ?? "trial";
  }

  async can(ctx: RuntimeContext, _capability: string): Promise<boolean> {
    const tier = await this.tierFor(ctx);
    return tier !== "expired";
  }
}
