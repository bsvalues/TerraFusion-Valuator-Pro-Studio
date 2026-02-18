"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  calculateValuation,
  analyzeMarket,
  assessRisk,
  generateComparables,
} from "@/lib/engines";
import type { Property } from "@/lib/types";
import {
  FileText,
  Printer,
  ArrowLeft,
  MapPin,
  Ruler,
  BedDouble,
  Bath,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  DollarSign,
  Clock,
} from "lucide-react";
import Link from "next/link";

function ReportContent() {
  const searchParams = useSearchParams();

  const property: Property = useMemo(
    () => ({
      id: searchParams.get("id") || "TF-00001",
      address: searchParams.get("address") || "123 Main Street",
      squareFeet: Number(searchParams.get("sqft")) || 2000,
      bedrooms: Number(searchParams.get("beds")) || 3,
      bathrooms: Number(searchParams.get("baths")) || 2,
    }),
    [searchParams]
  );

  const region = searchParams.get("region") || "Downtown";

  const valuation = useMemo(() => calculateValuation(property), [property]);
  const market = useMemo(() => analyzeMarket(region), [region]);
  const risk = useMemo(
    () => assessRisk(property, market, valuation),
    [property, market, valuation]
  );
  const comps = useMemo(
    () => generateComparables(property, region),
    [property, region]
  );

  const avgAdjusted = Math.round(
    comps.reduce((s, c) => s + c.adjustedPrice, 0) / comps.length
  );
  const reconciledValue = Math.round(
    valuation.estimatedValue * 0.4 + avgAdjusted * 0.6
  );
  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const RiskIcon =
    risk.riskLevel === "Low"
      ? ShieldCheck
      : risk.riskLevel === "Medium"
        ? ShieldAlert
        : ShieldX;
  const riskColor =
    risk.riskLevel === "Low"
      ? "text-primary"
      : risk.riskLevel === "Medium"
        ? "text-chart-2"
        : "text-destructive";

  const TrendIcon =
    market.marketTrend === "Rising"
      ? TrendingUp
      : market.marketTrend === "Declining"
        ? TrendingDown
        : Minus;
  const trendColor =
    market.marketTrend === "Rising"
      ? "text-primary"
      : market.marketTrend === "Declining"
        ? "text-destructive"
        : "text-chart-2";

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-3 print:hidden">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK TO DASHBOARD
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-mono text-xs font-semibold tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Printer className="h-3.5 w-3.5" />
          PRINT REPORT
        </button>
      </div>

      {/* Report body */}
      <div className="mx-auto max-w-4xl px-6 py-10 print:max-w-none print:px-12 print:py-6">
        {/* Report header */}
        <header className="mb-10 border-b border-border pb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5 text-primary" />
                <h1 className="font-mono text-lg font-bold tracking-wider text-foreground">
                  PROPERTY APPRAISAL REPORT
                </h1>
              </div>
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
                TERRAFUSION VALUATOR PRO STUDIO / CLOUD COACH AGENT / AUTOMATED
                VALUATION
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] text-muted-foreground">
                REPORT DATE
              </p>
              <p className="font-mono text-xs text-foreground">{reportDate}</p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                FILE #{property.id}
              </p>
            </div>
          </div>
        </header>

        {/* Section 1: Subject property */}
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 font-mono text-[10px] font-bold text-primary">
              1
            </span>
            SUBJECT PROPERTY
          </h2>
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">
                {property.address}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div className="flex items-center gap-3">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    GLA
                  </p>
                  <p className="font-mono text-sm font-bold text-foreground">
                    {property.squareFeet.toLocaleString()} sqft
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <BedDouble className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    BEDROOMS
                  </p>
                  <p className="font-mono text-sm font-bold text-foreground">
                    {property.bedrooms}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Bath className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    BATHROOMS
                  </p>
                  <p className="font-mono text-sm font-bold text-foreground">
                    {property.bathrooms}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    MARKET REGION
                  </p>
                  <p className="font-mono text-sm font-bold text-foreground">
                    {region}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Valuation */}
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 font-mono text-[10px] font-bold text-primary">
              2
            </span>
            AUTOMATED VALUATION
          </h2>
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <p className="font-mono text-[10px] text-muted-foreground">
                    AVM ESTIMATE
                  </p>
                </div>
                <p className="font-mono text-2xl font-bold text-primary">
                  ${valuation.estimatedValue.toLocaleString()}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <p className="font-mono text-[10px] text-muted-foreground">
                    CONFIDENCE
                  </p>
                </div>
                <p className="font-mono text-2xl font-bold text-foreground">
                  {Math.round(valuation.confidenceLevel * 100)}%
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="font-mono text-[10px] text-muted-foreground">
                    METHODOLOGY
                  </p>
                </div>
                <p className="text-xs text-foreground/80">
                  {valuation.methodology}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Market */}
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 font-mono text-[10px] font-bold text-primary">
              3
            </span>
            MARKET CONDITIONS
          </h2>
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <p className="font-mono text-[10px] text-muted-foreground mb-1">
                  MARKET TREND
                </p>
                <div className="flex items-center gap-2">
                  <TrendIcon className={cn("h-5 w-5", trendColor)} />
                  <span className={cn("font-mono text-lg font-bold", trendColor)}>
                    {market.marketTrend}
                  </span>
                </div>
              </div>
              <div>
                <p className="font-mono text-[10px] text-muted-foreground mb-1">
                  MEDIAN PRICE
                </p>
                <p className="font-mono text-lg font-bold text-foreground">
                  ${market.medianPrice.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-muted-foreground mb-1">
                  AVG PRICE/SQFT
                </p>
                <p className="font-mono text-lg font-bold text-foreground">
                  ${market.averagePricePerSqft}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Comparable Sales */}
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 font-mono text-[10px] font-bold text-primary">
              4
            </span>
            COMPARABLE SALES
          </h2>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-3 text-left font-mono text-[10px] font-medium tracking-wider text-muted-foreground">
                    COMP
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] font-medium tracking-wider text-muted-foreground">
                    ADDRESS
                  </th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] font-medium tracking-wider text-muted-foreground">
                    GLA
                  </th>
                  <th className="px-4 py-3 text-center font-mono text-[10px] font-medium tracking-wider text-muted-foreground">
                    BD/BA
                  </th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] font-medium tracking-wider text-muted-foreground">
                    SALE PRICE
                  </th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] font-medium tracking-wider text-muted-foreground">
                    ADJUSTED
                  </th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] font-medium tracking-wider text-muted-foreground">
                    DIST
                  </th>
                </tr>
              </thead>
              <tbody>
                {comps.map((comp) => (
                  <tr
                    key={comp.id}
                    className="border-b border-border/30 last:border-0"
                  >
                    <td className="px-4 py-2.5 font-mono text-[10px] font-semibold text-muted-foreground">
                      {comp.id}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-foreground">
                      {comp.address}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-foreground">
                      {comp.squareFeet.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono text-xs text-foreground">
                      {comp.bedrooms}/{comp.bathrooms}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-foreground">
                      ${comp.salePrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-primary">
                      ${comp.adjustedPrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[10px] text-muted-foreground">
                      {comp.distance}mi
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Risk */}
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 font-mono text-[10px] font-bold text-primary">
              5
            </span>
            RISK PROFILE
          </h2>
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <RiskIcon className={cn("h-5 w-5", riskColor)} />
              <span
                className={cn(
                  "rounded-md px-3 py-1 font-mono text-xs font-bold tracking-wider",
                  risk.riskLevel === "Low"
                    ? "bg-primary/10 text-primary"
                    : risk.riskLevel === "Medium"
                      ? "bg-chart-2/10 text-chart-2"
                      : "bg-destructive/10 text-destructive"
                )}
              >
                {risk.riskLevel.toUpperCase()} RISK
              </span>
              <span className="font-mono text-sm font-bold text-foreground">
                Score: {Math.round(risk.riskScore * 100)}%
              </span>
            </div>
            <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full",
                  risk.riskLevel === "Low"
                    ? "bg-primary"
                    : risk.riskLevel === "Medium"
                      ? "bg-chart-2"
                      : "bg-destructive"
                )}
                style={{
                  width: `${Math.max(risk.riskScore * 100, 3)}%`,
                }}
              />
            </div>
            <ul className="flex flex-col gap-1.5">
              {risk.factors.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-xs text-foreground/80"
                >
                  <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Section 6: Reconciliation */}
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 font-mono text-[10px] font-bold text-primary">
              6
            </span>
            RECONCILIATION OF VALUE
          </h2>
          <div className="rounded-lg border-2 border-primary/30 bg-card p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <p className="font-mono text-[10px] text-muted-foreground mb-1">
                  AVM ESTIMATE
                </p>
                <p className="font-mono text-lg font-bold text-foreground">
                  ${valuation.estimatedValue.toLocaleString()}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  Weight: 40%
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-muted-foreground mb-1">
                  AVG COMP ADJUSTED
                </p>
                <p className="font-mono text-lg font-bold text-foreground">
                  ${avgAdjusted.toLocaleString()}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  Weight: 60%
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-muted-foreground mb-1">
                  RECONCILED VALUE
                </p>
                <p className="font-mono text-2xl font-bold text-primary">
                  ${reconciledValue.toLocaleString()}
                </p>
                <p className="font-mono text-[10px] text-primary/70">
                  Final Opinion of Value
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Certification */}
        <footer className="border-t border-border pt-6">
          <p className="mb-4 font-mono text-[10px] tracking-wider text-muted-foreground">
            CERTIFICATION
          </p>
          <p className="mb-6 text-xs leading-relaxed text-foreground/70">
            This automated valuation report was generated by the TerraFusion
            Cloud Coach multi-agent swarm system. The estimated values are
            based on the TerraFusion Automated Valuation Model (AVM),
            comparable sales analysis with appropriate adjustments, and
            market conditions data for the {region} region. This report is
            intended for informational purposes and does not constitute a
            formal appraisal per USPAP standards.
          </p>
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] text-muted-foreground/50">
              TerraFusion Valuator Pro Studio v1.0.0 -- Cloud Coach Agent --
              Ralph Wiggum Mode
            </p>
            <p className="font-mono text-[10px] text-muted-foreground/50">
              Generated {reportDate}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="font-mono text-xs text-muted-foreground">
            Generating report...
          </p>
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
