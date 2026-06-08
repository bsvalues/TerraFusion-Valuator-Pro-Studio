/**
 * TFPR Contracts — ReportPackage
 *
 * Output/export boundary so modules don't each invent export.
 * Contract only in Slice 1; real assembly is a later slice.
 */
import type { Iso8601, RuntimeContext, WorkfileId } from "./common";

export interface PackageRef {
  packageId: string;
  workfileId: WorkfileId;
  format: "pdf" | "html" | "bundle";
  createdAt: Iso8601;
  /** Reference to the produced artifact (URL/path/blob key). */
  locationRef: string;
}

export interface ReportPackage {
  assemble(ctx: RuntimeContext, workfileId: WorkfileId): Promise<PackageRef>;
}
