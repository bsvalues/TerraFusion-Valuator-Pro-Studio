/**
 * TFPR Contracts — write-lanes + governed actions
 *
 * A module may only write to a lane it owns. write_high / irreversible actions
 * require confirmation + reason and are traced. (Mirrors OS ToolRunner gates.)
 */
import type { PilotMode, RiskClass } from "./common";

/** A write lane and its owning module/suite. */
export interface WriteLane {
  /** Lane key, e.g. "valuator:workfile". */
  lane: string;
  /** Owning module id; a module may only write to lanes it owns. */
  owner: string;
}

/**
 * The envelope around any TerraPilot/MUSE action. Drafting actions are
 * `mode: "muse"`, `risk: "write_low"`; acting actions are `mode: "pilot"`.
 */
export interface GovernedAction {
  id: string;
  label: string;
  mode: PilotMode;
  risk: RiskClass;
  lane?: WriteLane;
  /** Policy: write_high/irreversible MUST set both true. */
  requires: {
    confirm: boolean;
    reason: boolean;
  };
}
