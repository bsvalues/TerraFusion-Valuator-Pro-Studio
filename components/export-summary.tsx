"use client";

import { cn } from "@/lib/utils";
import type { SwarmPipelineResult, Property } from "@/lib/types";
import type { ComparableSale } from "@/lib/engines";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Layers,
  Clock,
  FileText,
} from "lucide-react";
import Link from "next/link";

interface ExportSummaryProps {
  result: SwarmPipelineResult;
  property: Property;
  region: string;
  comps: ComparableSale[];
}

export function ExportSummary({
  result,
  property,
  region,
  comps,
}: ExportSummaryProps) {
  const avgAdjusted =
    comps.length > 0
      ? Math.round(comps.reduce((s, c) => s + c.adjustedPrice, 0) / comps.length)
      : result.valuation.estimatedValue;
  const reconciledValue = Math.round(
    result.valuation.estimatedValue * 0.4 + avgAdjusted * 0.6
  );

  const TrendIcon =
    result.marketData.marketTrend === "Rising"
      ? TrendingUp
      : result.marketData.marketTrend === "Declining"
        ? TrendingDown
        : Minus;
  const trendColor =
    result.marketData.marketTrend === "Rising"
      ? "text-primary"
      : result.marketData.marketTrend === "Declining"
        ? "text-destructive"
        : "text-chart-2";

  const riskColor =
    result.riskAssessment.riskLevel === "Low"
      ? "text-primary"
      : result.riskAssessment.riskLevel === "Medium"
        ? "text-chart-2"
        : "text-destructive";

  const reportUrl = `/report?id=${property.id}&address=${encodeURIComponent(property.address)}&sqft=${property.squareFeet}&beds=${property.bedrooms}&baths=${property.bathrooms}&region=${encodeURIComponent(region)}`;

  return (
    <div className="rounded-lg border-2 border-primary/20 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h4 className="font-mono text-xs font-medium tracking-wider text-foreground">
            PIPELINE SUMMARY
          </h4>
        </div>
        <Link
          href={reportUrl}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-mono text-[10px] font-bold tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
        >
          <FileText className="h-3 w-3" />
          FULL REPORT
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Reconciled Value */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3 w-3 text-primary" />
            <span className="font-mono text-[9px] text-muted-foreground">
              RECONCILED VALUE
            </span>
          </div>
          <p className="font-mono text-lg font-bold text-primary">
            ${reconciledValue.toLocaleString()}
          </p>
        </div>

        {/* Market Trend */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <TrendIcon className={cn("h-3 w-3", trendColor)} />
            <span className="font-mono text-[9px] text-muted-foreground">
              MARKET TREND
            </span>
          </div>
          <p className={cn("font-mono text-lg font-bold", trendColor)}>
            {result.marketData.marketTrend}
          </p>
        </div>

        {/* Risk Level */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Shield className={cn("h-3 w-3", riskColor)} />
            <span className="font-mono text-[9px] text-muted-foreground">
              RISK LEVEL
            </span>
          </div>
          <p className={cn("font-mono text-lg font-bold", riskColor)}>
            {result.riskAssessment.riskLevel}
          </p>
        </div>

        {/* Pipeline Time */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-[9px] text-muted-foreground">
              PIPELINE TIME
            </span>
          </div>
          <p className="font-mono text-lg font-bold text-foreground">
            {result.pipelineDurationMs}ms
          </p>
        </div>
      </div>

      {/* Subject info */}
      <div className="flex flex-wrap items-center gap-3 rounded-md bg-secondary/30 px-3 py-2">
        <span className="font-mono text-[9px] text-muted-foreground">
          SUBJECT:
        </span>
        <span className="font-mono text-[10px] font-semibold text-foreground">
          {property.id}
        </span>
        <span className="h-3 w-px bg-border" />
        <span className="font-mono text-[10px] text-foreground/80">
          {property.address}
        </span>
        <span className="h-3 w-px bg-border" />
        <span className="font-mono text-[10px] text-foreground/80">
          {property.squareFeet.toLocaleString()} sqft
        </span>
        <span className="h-3 w-px bg-border" />
        <span className="font-mono text-[10px] text-foreground/80">
          {property.bedrooms}bd/{property.bathrooms}ba
        </span>
        <span className="h-3 w-px bg-border" />
        <span className="font-mono text-[10px] text-foreground/80">
          {region}
        </span>
      </div>
    </div>
  );
}
