"use client";

import { useState } from "react";
import { FileText, Sparkles, Copy, Check, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface NarrativeDraftingProps {
  property?: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    county?: string;
    propertyType?: string;
    squareFeet?: number;
    yearBuilt?: number;
    condition?: string;
    bedrooms?: number;
    bathrooms?: number;
    landAreaAcres?: number;
    zoning?: string;
    legalDescription?: string;
  };
  market?: {
    region?: string;
    marketTrend?: string;
    medianPrice?: number;
    averagePricePerSqft?: number;
    averageDaysOnMarket?: number;
    listToSaleRatio?: number;
    vacancyRate?: number;
    averageCapRate?: number;
  };
  approaches?: {
    salesComp?: number;
    salesCompWeight?: number;
    income?: number;
    incomeWeight?: number;
    cost?: number;
    costWeight?: number;
    final?: number;
  };
  risk?: {
    riskLevel?: string;
  };
}

type NarrativeType = "reconciliation" | "market_conditions" | "highest_best_use" | "property_description" | "scope_of_work";

const NARRATIVE_TYPES: { type: NarrativeType; label: string; description: string; uspap: string }[] = [
  {
    type: "property_description",
    label: "Property Description",
    description: "Subject property characteristics and improvements",
    uspap: "SR 1-2(e)",
  },
  {
    type: "scope_of_work",
    label: "Scope of Work",
    description: "What was and was not inspected, researched, and analyzed",
    uspap: "SR 1-2",
  },
  {
    type: "market_conditions",
    label: "Market Conditions",
    description: "Neighborhood, market area, and supply/demand analysis",
    uspap: "SR 1-3",
  },
  {
    type: "highest_best_use",
    label: "Highest & Best Use",
    description: "As vacant and as improved analysis (four tests)",
    uspap: "SR 1-3(b)",
  },
  {
    type: "reconciliation",
    label: "Value Reconciliation",
    description: "Approach weighting and final opinion of value",
    uspap: "SR 1-6",
  },
];

export function NarrativeDrafting({ property, market, approaches, risk }: NarrativeDraftingProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeType, setActiveType] = useState<NarrativeType>("reconciliation");
  const [narratives, setNarratives] = useState<Partial<Record<NarrativeType, string>>>({});
  const [loading, setLoading] = useState<NarrativeType | null>(null);
  const [copied, setCopied] = useState<NarrativeType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async (type: NarrativeType) => {
    setLoading(type);
    setError(null);
    try {
      const res = await fetch("/api/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, property, market, approaches, risk }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNarratives((prev) => ({ ...prev, [type]: data.narrative }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    }
    setLoading(null);
  };

  const copyToClipboard = async (type: NarrativeType) => {
    const text = narratives[type];
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const totalGenerated = Object.values(narratives).filter(Boolean).length;

  return (
    <div className={cn(
      "rounded-lg border bg-card transition-colors",
      totalGenerated === NARRATIVE_TYPES.length ? "border-primary/30" : "border-border"
    )}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground">
            AI NARRATIVE DRAFTING AGENT
          </h3>
          <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">AI-assisted</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-muted-foreground">
            {totalGenerated}/{NARRATIVE_TYPES.length} sections drafted
          </span>
          <div className="flex gap-0.5">
            {NARRATIVE_TYPES.map((n) => (
              <div key={n.type} className={cn("h-1.5 w-4 rounded-full",
                narratives[n.type] ? "bg-primary" : "bg-border/40"
              )} />
            ))}
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/30 px-5 pb-5 pt-4">
          {/* Section Tabs */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {NARRATIVE_TYPES.map((n) => (
              <button
                key={n.type}
                onClick={() => setActiveType(n.type)}
                className={cn(
                  "rounded px-2.5 py-1 font-mono text-[10px] font-semibold transition-colors",
                  activeType === n.type
                    ? "bg-primary text-primary-foreground"
                    : narratives[n.type]
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-background border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {narratives[n.type] && <span className="mr-1">✓</span>}
                {n.label.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Active Section */}
          {NARRATIVE_TYPES.filter((n) => n.type === activeType).map((n) => (
            <div key={n.type}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-mono text-xs font-semibold text-foreground">{n.label}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {n.description} · <span className="text-primary">{n.uspap}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  {narratives[n.type] && (
                    <button
                      onClick={() => copyToClipboard(n.type)}
                      className="flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied === n.type ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copied === n.type ? "COPIED" : "COPY"}
                    </button>
                  )}
                  <button
                    onClick={() => generate(n.type)}
                    disabled={loading === n.type}
                    className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 font-mono text-[10px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
                  >
                    {loading === n.type ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {loading === n.type ? "DRAFTING..." : narratives[n.type] ? "REDRAFT" : "DRAFT WITH AI"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-3 rounded border border-red-400/30 bg-red-400/5 px-3 py-2">
                  <p className="font-mono text-[10px] text-red-400">{error}</p>
                </div>
              )}

              {loading === n.type && (
                <div className="rounded border border-primary/20 bg-primary/5 p-6 text-center">
                  <RefreshCw className="h-6 w-6 text-primary animate-spin mx-auto mb-2" />
                  <p className="font-mono text-[10px] text-primary">
                    AI Narrative Agent drafting {n.label.toLowerCase()}...
                  </p>
                  <p className="font-mono text-[9px] text-muted-foreground mt-1">
                    Applying USPAP {n.uspap} standards
                  </p>
                </div>
              )}

              {narratives[n.type] && loading !== n.type && (
                <div className="rounded border border-border/50 bg-background/50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="font-mono text-[9px] tracking-wider text-emerald-400">USPAP-AWARE DRAFT</span>
                  </div>
                  <textarea
                    value={narratives[n.type]}
                    onChange={(e) => setNarratives((prev) => ({ ...prev, [n.type]: e.target.value }))}
                    className="w-full bg-transparent font-mono text-[11px] text-foreground/90 leading-relaxed resize-none focus:outline-none"
                    rows={8}
                  />
                  <p className="mt-2 font-mono text-[9px] text-muted-foreground/60">
                    ↑ Editable — modify as needed before including in your report
                  </p>
                </div>
              )}

              {!narratives[n.type] && loading !== n.type && (
                <div className="rounded border border-dashed border-border/40 bg-background/20 p-6 text-center">
                  <FileText className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="font-mono text-[10px] text-muted-foreground">
                    Click &quot;Draft with AI&quot; to generate a USPAP-aware {n.label.toLowerCase()} narrative
                  </p>
                  <p className="font-mono text-[9px] text-muted-foreground/60 mt-1">
                    Uses property data, market conditions, and valuation results
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Generate All Button */}
          {totalGenerated < NARRATIVE_TYPES.length && (
            <div className="mt-4 pt-4 border-t border-border/30">
              <button
                onClick={async () => {
                  for (const n of NARRATIVE_TYPES) {
                    if (!narratives[n.type]) await generate(n.type);
                  }
                }}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-4 py-2.5 font-mono text-[10px] font-semibold text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                DRAFT ALL {NARRATIVE_TYPES.length} SECTIONS WITH AI
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
