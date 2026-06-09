/**
 * MarketPulse R1 — workfile-derived market context (pure, read-only).
 *
 * Summarizes ONLY the market evidence already in this assignment's workfile:
 * selected comps, approach indications, income evidence, evidence ledger.
 * It does NOT connect any external market feed and NEVER fabricates comps,
 * rents, cap rates, trends, or forecasts. Source is always "Workfile-derived".
 *
 * Roadmap (not this slice): R2 = connected market data; R3 = source-governed
 * external market intelligence.
 */

export type MarketSupport = "weak" | "developing" | "supported";

export interface CompSummary {
  count: number;
  priceMin: number | null;
  priceMax: number | null;
  adjustedMin: number | null;
  adjustedMax: number | null;
  dateMin: string | null;
  dateMax: string | null;
}

export interface MarketPulseInput {
  approachValues: { cost?: number; sales?: number; income?: number };
  reconFinal?: number;
  compSummary?: CompSummary | null;
  capRate?: number | null;
  noi?: number | null;
  evidenceByType: Record<string, number>;
  evidenceTotal: number;
  /** Age (months) of the most recent comp sale, computed by the caller. */
  newestSaleAgeMonths?: number | null;
}

export interface MarketPulseMetric {
  label: string;
  value: string;
  note?: string;
}

export interface MarketPulseResult {
  source: "Workfile-derived";
  externalFeed: false;
  metrics: MarketPulseMetric[];
  gaps: string[];
  warnings: string[];
  support: MarketSupport;
  sufficient: boolean;
}

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const range = (lo: number | null, hi: number | null) =>
  lo != null && hi != null ? (lo === hi ? usd(lo) : `${usd(lo)} – ${usd(hi)}`) : null;

export function marketPulse(i: MarketPulseInput): MarketPulseResult {
  const metrics: MarketPulseMetric[] = [];
  const gaps: string[] = [];
  const warnings: string[] = [];

  const approaches = [i.approachValues.cost, i.approachValues.sales, i.approachValues.income].filter(
    (v): v is number => typeof v === "number" && v > 0,
  );

  // Indicated value range across developed approaches
  if (approaches.length >= 1) {
    const lo = Math.min(...approaches);
    const hi = Math.max(...approaches);
    metrics.push({
      label: "Indicated value range (approaches)",
      value: range(lo, hi) ?? "—",
      note: `${approaches.length} approach${approaches.length === 1 ? "" : "es"} developed`,
    });
  } else {
    gaps.push("No approach indications recorded.");
  }

  if (typeof i.reconFinal === "number") {
    metrics.push({ label: "Reconciled indication", value: usd(i.reconFinal) });
  }

  // Sales-comparison evidence
  const cs = i.compSummary;
  if (cs && cs.count > 0) {
    metrics.push({ label: "Comps selected", value: String(cs.count) });
    const pr = range(cs.priceMin, cs.priceMax);
    if (pr) metrics.push({ label: "Comp sale price range", value: pr });
    const ar = range(cs.adjustedMin, cs.adjustedMax);
    if (ar) metrics.push({ label: "Adjusted indication range", value: ar });
    if (cs.dateMin && cs.dateMax) {
      metrics.push({
        label: "Comp sale dates",
        value: cs.dateMin === cs.dateMax ? cs.dateMin : `${cs.dateMin} → ${cs.dateMax}`,
        note: i.newestSaleAgeMonths != null ? `most recent ~${i.newestSaleAgeMonths} mo ago` : undefined,
      });
    }
    if (cs.count < 3) warnings.push(`Only ${cs.count} comp${cs.count === 1 ? "" : "s"} selected (fewer than 3).`);
    if (i.newestSaleAgeMonths != null && i.newestSaleAgeMonths > 12)
      warnings.push(`Most recent comp is ~${i.newestSaleAgeMonths} months old.`);
  } else {
    gaps.push("No sales-comparison evidence recorded.");
  }

  // Income evidence
  if (typeof i.capRate === "number" && i.capRate > 0) {
    metrics.push({ label: "Cap rate (income evidence)", value: `${(i.capRate * 100).toFixed(2)}%` });
    if (typeof i.noi === "number" && i.noi > 0) metrics.push({ label: "NOI (income evidence)", value: usd(i.noi) });
  } else {
    gaps.push("No income (cap-rate) evidence recorded.");
  }

  // Evidence ledger composition
  if (i.evidenceTotal > 0) {
    const by = Object.entries(i.evidenceByType)
      .map(([k, n]) => `${k}: ${n}`)
      .join(", ");
    metrics.push({ label: "Evidence ledger", value: `${i.evidenceTotal} item(s)`, note: by });
  } else {
    gaps.push("Evidence ledger is empty.");
  }

  // Dispersion across approaches
  if (approaches.length >= 2) {
    const lo = Math.min(...approaches);
    const hi = Math.max(...approaches);
    const spread = lo > 0 ? ((hi - lo) / lo) * 100 : 0;
    if (spread > 15) warnings.push(`Wide dispersion across approaches (${spread.toFixed(0)}%).`);
  } else {
    gaps.push("Fewer than two approaches developed (limited corroboration).");
  }

  // Market support strength (workfile-derived only)
  const support: MarketSupport =
    approaches.length >= 2 && (cs?.count ?? 0) >= 3 && i.evidenceTotal >= 1
      ? "supported"
      : approaches.length >= 1
        ? "developing"
        : "weak";

  return {
    source: "Workfile-derived",
    externalFeed: false,
    metrics,
    gaps,
    warnings,
    support,
    sufficient: support !== "weak" && metrics.length > 0,
  };
}
