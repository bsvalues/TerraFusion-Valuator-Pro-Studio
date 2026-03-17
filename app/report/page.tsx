"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  calculateValuation,
  analyzeMarket,
  assessRisk,
  generateComparableSales,
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
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from "recharts";

function ReportContent() {
  const searchParams = useSearchParams();

  const property: Property = useMemo(
    () => ({
      id: searchParams.get("id") || "TF-00001",
      address: searchParams.get("address") || "123 Main Street",
      city: searchParams.get("city") || "Austin",
      state: searchParams.get("state") || "TX",
      zip: searchParams.get("zip") || "78701",
      county: searchParams.get("county") || "Travis",
      propertyType: (searchParams.get("propertyType") as Property["propertyType"]) || "single_family",
      condition: (searchParams.get("condition") as Property["condition"]) || "Average",
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
    () => generateComparableSales(property, analyzeMarket(region)),
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

  // Generate 12-month trend data for market sparkline
  const marketTrendData = useMemo(() => {
    const basePrice = market.medianPrice;
    const trendMultiplier =
      market.marketTrend === "Rising" ? 1.005 : market.marketTrend === "Declining" ? 0.997 : 1.001;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const seed = property.squareFeet;
    return months.map((month, i) => {
      const noise = ((seed * (i + 7)) % 20000 - 10000);
      const trendedPrice = Math.round(basePrice * Math.pow(trendMultiplier, i) + noise);
      return { month, price: trendedPrice };
    });
  }, [market, property.squareFeet]);

  // Comp adjustment bar data
  const compAdjustmentData = useMemo(
    () =>
      comps.map((c) => ({
        name: c.id,
        sale: c.salePrice,
        adjusted: c.adjustedPrice,
        diff: c.adjustedPrice - c.salePrice,
      })),
    [comps]
  );

  const RiskIcon =
    risk.riskLevel === "Low"
      ? ShieldCheck
      : risk.riskLevel === "Moderate" || risk.riskLevel === "Elevated"
        ? ShieldAlert
        : ShieldX;
  const riskColor =
    risk.riskLevel === "Low"
      ? "text-primary"
      : risk.riskLevel === "Moderate" || risk.riskLevel === "Elevated"
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

        {/* Section 2b: Confidence visualization */}
        <section className="mb-8">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Confidence ring */}
              <div className="flex flex-col items-center gap-3">
                <p className="font-mono text-[10px] tracking-wider text-muted-foreground">
                  CONFIDENCE GAUGE
                </p>
                <div className="relative h-36 w-36">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="hsl(240 4% 14%)"
                      strokeWidth="8"
                    />
                    {/* Confidence arc */}
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="hsl(160 84% 39%)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${valuation.confidenceLevel * 264} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono text-2xl font-bold text-primary">
                      {Math.round(valuation.confidenceLevel * 100)}%
                    </span>
                    <span className="font-mono text-[8px] text-muted-foreground">
                      CONFIDENCE
                    </span>
                  </div>
                </div>
              </div>

              {/* Valuation breakdown bar */}
              <div className="flex flex-col gap-3">
                <p className="font-mono text-[10px] tracking-wider text-muted-foreground">
                  VALUATION COMPONENTS
                </p>
                {[
                  { label: "Base (sqft x $200)", value: property.squareFeet * 200 },
                  { label: "Bedroom adj", value: (property.bedrooms ?? 0) * 25000 },
                  { label: "Bathroom adj", value: (property.bathrooms ?? 0) * 15000 },
                ].map((comp) => (
                  <div key={comp.label} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-foreground/70">
                        {comp.label}
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-foreground">
                        ${comp.value.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary/60"
                        style={{
                          width: `${Math.min((comp.value / valuation.estimatedValue) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
                <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                  <span className="font-mono text-[10px] font-semibold text-foreground">
                    Total AVM Estimate
                  </span>
                  <span className="font-mono text-sm font-bold text-primary">
                    ${valuation.estimatedValue.toLocaleString()}
                  </span>
                </div>
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

        {/* Section 3b: Market trend sparkline */}
        <section className="mb-8">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <p className="font-mono text-[10px] tracking-wider text-muted-foreground">
                12-MONTH MEDIAN PRICE TREND -- {region.toUpperCase()}
              </p>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={marketTrendData}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(240 4% 16%)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "hsl(240 4% 55%)", fontSize: 9, fontFamily: "var(--font-geist-mono)" }}
                    axisLine={{ stroke: "hsl(240 4% 16%)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(240 4% 55%)", fontSize: 9, fontFamily: "var(--font-geist-mono)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(240 5% 8%)",
                      border: "1px solid hsl(240 4% 16%)",
                      borderRadius: "8px",
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: "10px",
                      color: "hsl(0 0% 93%)",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Median Price"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="hsl(160 84% 39%)"
                    strokeWidth={2}
                    fill="url(#trendFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
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

        {/* Section 4b: Comp adjustment visualization */}
        <section className="mb-8">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-chart-2" />
              <p className="font-mono text-[10px] tracking-wider text-muted-foreground">
                COMP SALE PRICE vs ADJUSTED PRICE
              </p>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compAdjustmentData} barGap={2}>
                  <CartesianGrid stroke="hsl(240 4% 16%)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "hsl(240 4% 55%)", fontSize: 9, fontFamily: "var(--font-geist-mono)" }}
                    axisLine={{ stroke: "hsl(240 4% 16%)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(240 4% 55%)", fontSize: 9, fontFamily: "var(--font-geist-mono)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(240 5% 8%)",
                      border: "1px solid hsl(240 4% 16%)",
                      borderRadius: "8px",
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: "10px",
                      color: "hsl(0 0% 93%)",
                    }}
                    formatter={(value: number, name: string) => [
                      `$${value.toLocaleString()}`,
                      name === "sale" ? "Sale Price" : "Adjusted",
                    ]}
                  />
                  <Bar dataKey="sale" fill="hsl(240 4% 35%)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="adjusted" radius={[2, 2, 0, 0]}>
                    {compAdjustmentData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.diff >= 0
                            ? "hsl(160 84% 39%)"
                            : "hsl(38 92% 50%)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-[hsl(240_4%_35%)]" />
                <span className="font-mono text-[9px] text-muted-foreground">
                  Sale Price
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-primary" />
                <span className="font-mono text-[9px] text-muted-foreground">
                  Adjusted (+ adj)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-chart-2" />
                <span className="font-mono text-[9px] text-muted-foreground">
                  Adjusted (- adj)
                </span>
              </div>
            </div>
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
                    : risk.riskLevel === "Moderate" || risk.riskLevel === "Elevated"
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
                    : risk.riskLevel === "Moderate" || risk.riskLevel === "Elevated"
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
