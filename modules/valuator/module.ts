/**
 * Valuator Pro — ProductModule registration (the first module inside TFPR).
 *
 * Imports CONTRACTS ONLY (never lib/tfpr/runtime), per the boundary rule.
 */
import type { ProductModule } from "@/lib/tfpr/contracts";

const LANE = { lane: "valuator:workfile", owner: "valuator" };

export const valuatorModule: ProductModule = {
  id: "valuator",
  label: "Valuator Pro",
  homeSurface: "/assignments",
  museCapabilities: [
    {
      id: "draft_reconciliation_narrative",
      label: "Draft reconciliation narrative",
      lane: LANE,
    },
    {
      id: "draft_certification",
      label: "Draft certification statements",
      lane: LANE,
    },
    {
      id: "draft_assumptions_limiting_conditions",
      label: "Draft assumptions & limiting conditions",
      lane: LANE,
    },
  ],
  writeHighActions: [
    {
      id: "certify_opinion_of_value",
      label: "Certify Opinion of Value",
      mode: "pilot",
      risk: "write_high",
      lane: LANE,
      requires: { confirm: true, reason: true },
    },
  ],
};
