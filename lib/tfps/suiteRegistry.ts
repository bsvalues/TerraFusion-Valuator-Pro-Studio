/**
 * TerraFusion Professional Suite — module registry (single source of truth).
 *
 * Mirrors the OS suiteRegistry.ts / ForgeSuiteHome source-honesty discipline.
 * Truth state is about USER-OPERABLE SUITE BEHAVIOR, not code existence:
 *
 *   live           = navigable from the suite, user-actionable, and
 *                    persistence-proven if it changes workfile state.
 *   candidate-live = real/bound code exists, but not yet proven navigable +
 *                    usable inside the suite shell. Preview-locked.
 *   queued         = partial/concept; not mounted/proven in the suite. Preview.
 *   unavailable    = placeholder only / no credible product path yet.
 *
 * A module may NOT claim `live` without a proven, navigable suite path.
 * Spec: docs/architecture/PROFESSIONAL_SUITE_ARCHITECTURE.md
 */

export const PRODUCT_NAME = "TerraFusion Professional Suite";

export type TfpsTruthState = "live" | "candidate-live" | "queued" | "unavailable";
export type TfpsGroup = "assignment" | "tool" | "evidence" | "guidance";

export interface TfpsModule {
  id: string;
  label: string;
  description: string;
  truthState: TfpsTruthState;
  group: TfpsGroup;
  /** Where the work happens: the whole suite, or inside a single assignment. */
  scope: "suite" | "assignment";
}

export const TFPS_MODULES: TfpsModule[] = [
  {
    id: "valuator",
    label: "Valuator Pro",
    description: "Assignment container — subject, scope, approaches, reconciliation, final opinion.",
    // Promoted to live in TFPS Slice 3: the Assignment Command Center is
    // navigable from the suite, user-actionable, and persistence-proven.
    truthState: "live",
    group: "assignment",
    scope: "assignment",
  },
  {
    id: "costforge",
    label: "CostForge Pro",
    description: "Cost approach — replacement cost, depreciation, entrepreneurial incentive, land value.",
    truthState: "live",
    group: "tool",
    scope: "assignment",
  },
  {
    id: "compforge",
    label: "CompForge / CompVault",
    description: "Sales comparison — comp selection, adjustment grid, market support, reliability.",
    truthState: "live",
    group: "tool",
    scope: "assignment",
  },
  {
    id: "incomeforge",
    label: "IncomeForge Pro",
    description: "Income approach — rent roll, market rent, vacancy, NOI, cap rate, DCF.",
    truthState: "live",
    group: "tool",
    scope: "assignment",
  },
  {
    id: "reportforge",
    label: "ReportForge",
    description: "Report assembly + export drawn from the workfile.",
    truthState: "live",
    group: "tool",
    scope: "assignment",
  },
  {
    id: "reviewforge",
    label: "ReviewForge",
    description: "Pre-delivery review — evidence gaps, weak support, USPAP-aware checks.",
    truthState: "live",
    group: "tool",
    scope: "assignment",
  },
  {
    id: "marketpulse",
    label: "MarketPulse",
    description: "Market context — trends, rent/sale movement, neighborhood narrative (real data only).",
    truthState: "queued",
    group: "tool",
    scope: "suite",
  },
  {
    id: "dossier",
    label: "Dossier / Workfile",
    description: "Evidence spine — evidence, runs, drafts, decisions, append-only audit trace.",
    truthState: "live",
    group: "evidence",
    scope: "assignment",
  },
  {
    id: "muse",
    label: "TerraPilot / MUSE",
    description: "Draft, explain, summarize, review — write_low, never the final author.",
    truthState: "live",
    group: "guidance",
    scope: "assignment",
  },
];

export const TRUTH_LABEL: Record<TfpsTruthState, string> = {
  live: "Live",
  "candidate-live": "In assignment",
  queued: "Preview",
  unavailable: "Unavailable",
};
