/**
 * TFPR Contracts — public surface
 *
 * The shared contracts of TerraFusion Professional Runtime. Pure types, zero
 * behavior. Product modules import from here ONLY (never `lib/tfpr/runtime`).
 *
 * Approved direction: docs/architecture/TFPR_DECISION_RECORD.md
 */
export * from "./common";
export * from "./write-lane";
export * from "./evidence";
export * from "./run-record";
export * from "./workfile";
export * from "./workfile-store";
export * from "./audit-trace";
export * from "./sovereign-ai";
export * from "./muse";
export * from "./entitlement";
export * from "./report-package";
export * from "./product-module";
