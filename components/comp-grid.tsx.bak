"use client";

import { cn } from "@/lib/utils";
import type { ComparableSale } from "@/lib/engines";
import { MapPin, Calendar, Ruler, BedDouble, Bath, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface CompGridProps {
  comps: ComparableSale[];
  subjectValue: number;
}

export function CompGrid({ comps, subjectValue }: CompGridProps) {
  const [expandedComp, setExpandedComp] = useState<string | null>(null);

  if (comps.length === 0) return null;

  const avgAdjustedPrice = Math.round(
    comps.reduce((sum, c) => sum + c.adjustedPrice, 0) / comps.length
  );
  const deviation = ((subjectValue - avgAdjustedPrice) / avgAdjustedPrice) * 100;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-xs font-medium tracking-wider text-foreground">
          COMPARABLE SALES ANALYSIS
        </h4>
        <span className="font-mono text-[10px] text-muted-foreground">
          {comps.length} comps
        </span>
      </div>

      {/* Reconciliation summary */}
      <div className="grid grid-cols-3 gap-4 rounded-md border border-border/50 bg-background/50 px-4 py-3">
        <div>
          <p className="font-mono text-[10px] text-muted-foreground">
            AVG ADJUSTED
          </p>
          <p className="font-mono text-sm font-bold text-foreground">
            ${avgAdjustedPrice.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] text-muted-foreground">
            AVM ESTIMATE
          </p>
          <p className="font-mono text-sm font-bold text-primary">
            ${subjectValue.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] text-muted-foreground">
            DEVIATION
          </p>
          <p
            className={cn(
              "font-mono text-sm font-bold",
              Math.abs(deviation) < 5
                ? "text-primary"
                : Math.abs(deviation) < 15
                  ? "text-chart-2"
                  : "text-destructive"
            )}
          >
            {deviation > 0 ? "+" : ""}
            {deviation.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Comp cards */}
      <div className="flex flex-col gap-2">
        {comps.map((comp) => {
          const isExpanded = expandedComp === comp.id;
          return (
            <div
              key={comp.id}
              className="rounded-md border border-border/50 bg-background/30 transition-colors hover:bg-background/50"
            >
              <button
                onClick={() =>
                  setExpandedComp(isExpanded ? null : comp.id)
                }
                className="flex w-full items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[10px] font-semibold text-muted-foreground">
                    {comp.id}
                  </span>
                  <span className="text-xs text-foreground">
                    {comp.address}
                  </span>
                  <span className="font-mono text-xs font-bold text-primary">
                    ${comp.adjustedPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-2.5 w-2.5" />
                    <span className="font-mono text-[10px]">
                      {comp.distance}mi
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border/30 px-4 py-3 animate-slide-in">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                    <div className="flex items-center gap-1.5">
                      <Ruler className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {comp.squareFeet.toLocaleString()} sqft
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BedDouble className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {comp.bedrooms} bed
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bath className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {comp.bathrooms} bath
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {comp.saleDate}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        Sale: ${comp.salePrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Adjustment factors */}
                  <div className="mt-3 flex flex-col gap-1">
                    <p className="font-mono text-[10px] font-medium text-muted-foreground">
                      ADJUSTMENTS
                    </p>
                    {comp.adjustmentFactors.map((factor, i) => (
                      <span
                        key={i}
                        className="font-mono text-[10px] text-foreground/70"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
