/**
 * TFPR Contracts — ProductModule
 *
 * How a product (Valuator Pro, later Housing Truth Pro, Legislative Pulse Pro)
 * mounts inside the runtime shell. A module declares its home surface, its MUSE
 * capabilities, and its write_high actions; the runtime provides everything else.
 */
import type { GovernedAction } from "./write-lane";
import type { MuseCapability } from "./muse";

export interface ProductModule {
  /** Stable module id, e.g. "valuator". */
  id: string;
  label: string;
  /** Route/component key for the module's home surface inside the shell. */
  homeSurface: string;
  /** MUSE (write_low) drafting capabilities this module exposes. */
  museCapabilities: MuseCapability[];
  /** write_high actions (e.g. "certify opinion of value"). */
  writeHighActions: GovernedAction[];
}
