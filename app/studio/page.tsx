"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  Property,
  AgentStatus,
  SwarmEvent,
  SwarmPipelineResult,
  ComparableSale,
} from "@/lib/types";
import type { PipelineRun } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar";
import { MetricsGrid } from "@/components/metrics-grid";
import { AgentCard } from "@/components/agent-card";
import { SwarmActivityFeed } from "@/components/swarm-activity-feed";
import { PropertyForm } from "@/components/property-form";
import { SwarmOrchestrator } from "@/components/swarm-orchestrator";
import { NetworkTopology } from "@/components/network-topology";
import { PipelineHistory } from "@/components/pipeline-history";
import { SystemHealth } from "@/components/system-health";
import { CommandTerminal } from "@/components/command-terminal";
import { LiveTicker } from "@/components/live-ticker";
import { RegionRadar } from "@/components/region-radar";
import { ComplianceBadge } from "@/components/compliance-badge";
import { DispatchCenter } from "@/components/dispatch-center";
import { ExportSummary } from "@/components/export-summary";
import { CompGrid } from "@/components/comp-grid";
import { IncomeApproach } from "@/components/income-approach";
import { DCFIncomeApproach } from "@/components/dcf-income-approach";
import { CompSearch } from "@/components/comp-search";
import type { CompSearchResult } from "@/components/comp-search";
import { AppraiserProfilePage } from "@/components/appraiser-profile";
import { CostApproach } from "@/components/cost-approach";
import { ValueReconciliation } from "@/components/value-reconciliation";
import { OrderManagement } from "@/components/order-management";
import { NarrativeDrafting } from "@/components/narrative-drafting";
import { USPAPCertification } from "@/components/uspap-certification";
import { AppraiserDashboard } from "@/components/appraiser-dashboard";
import { generateComparableSales, analyzeMarket } from "@/lib/engines";
import {
  Building2,
  ClipboardList,
  Scale,
  TrendingUp,
  HardHat,
  Shield,
  Radio,
  ChevronDown,
  ChevronUp,
  Settings,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ActiveTab = "dashboard" | "pipeline" | "orders" | "approaches" | "compliance" | "settings";

export default function TerraFusionValuatorPro() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<SwarmPipelineResult | null>(null);
  const [totalRuns, setTotalRuns] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uptime, setUptime] = useState(0);
  const [comps, setComps] = useState<ComparableSale[]>([]);
  const [lastProperty, setLastProperty] = useState<Property | null>(null);
  const [lastRegion, setLastRegion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [salesCompValue, setSalesCompValue] = useState<number | undefined>();
  const [incomeValue, setIncomeValue] = useState<number | undefined>();
  const [costValue, setCostValue] = useState<number | undefined>();
  const [finalValue, setFinalValue] = useState<number | undefined>();
  const [showAgents, setShowAgents] = useState(false);
  const [searchedComps, setSearchedComps] = useState<CompSearchResult[]>([]);
  const [showDCF, setShowDCF] = useState(false);
  const router = useRouter();

  // Pipeline completion chime
  const playSuccessSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch { /* silent fail */ }
  }, []);

  // Uptime counter
  useEffect(() => {
    const interval = setInterval(() => setUptime((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // SWR data feeds
  const { data: swarmData } = useSWR<{ agents: AgentStatus[] }>("/api/swarm", fetcher, { refreshInterval: 3000 });
  const { data: eventsData } = useSWR<{ events: SwarmEvent[] }>("/api/swarm/events", fetcher, { refreshInterval: 2000 });
  const { data: historyData } = useSWR<{ history: PipelineRun[] }>("/api/swarm/history", fetcher, { refreshInterval: 3000 });

  const agents = swarmData?.agents ?? [
    { name: "Market Intelligence Agent" as const, status: "online" as const, lastRun: null, taskCount: 0, health: 100 },
    { name: "Comparable Sales Agent" as const,    status: "online" as const, lastRun: null, taskCount: 0, health: 100 },
    { name: "Income Analysis Agent" as const,     status: "idle" as const,   lastRun: null, taskCount: 0, health: 100 },
    { name: "Risk Assessment Agent" as const,     status: "online" as const, lastRun: null, taskCount: 0, health: 100 },
    { name: "Narrative Drafting Agent" as const,  status: "idle" as const,   lastRun: null, taskCount: 0, health: 100 },
  ];

  const events = eventsData?.events ?? [];
  const history = historyData?.history ?? [];

  const handleRunPipeline = useCallback(async (property: Property, region: string) => {
    setIsRunning(true);
    setError(null);
    setLastProperty(property);
    setLastRegion(region);

    try {
      const res = await fetch("/api/swarm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property, region }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Pipeline execution failed");
      }

      const result: SwarmPipelineResult = await res.json();
      setLastResult(result);
      setTotalRuns((prev) => prev + 1);
      playSuccessSound();

      // Generate comparable sales
      const market = analyzeMarket(region);
      const generatedComps = generateComparableSales(property, market);
      setComps(generatedComps);

      // Set sales comp value
      const avgAdj = generatedComps.length > 0
        ? Math.round(generatedComps.reduce((s, c) => s + c.adjustedPrice, 0) / generatedComps.length)
        : result.valuation.estimatedValue;
      setSalesCompValue(avgAdj);

      mutate("/api/swarm");
      mutate("/api/swarm/events");
      mutate("/api/swarm/history");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsRunning(false);
    }
  }, [playSuccessSound]);

  const systemOnline = agents.every((a) => a.status !== "error");

  const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard",   label: "Dashboard",               icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { id: "pipeline",    label: "Appraisal Pipeline",      icon: <Radio className="h-3.5 w-3.5" /> },
    { id: "orders",      label: "Order Management",        icon: <ClipboardList className="h-3.5 w-3.5" /> },
    { id: "approaches",  label: "Three Approaches",        icon: <Scale className="h-3.5 w-3.5" /> },
    { id: "compliance",  label: "USPAP Compliance",        icon: <Shield className="h-3.5 w-3.5" /> },
    { id: "settings",    label: "Appraiser Profile",       icon: <Settings className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        systemOnline={systemOnline}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className={cn("flex-1 transition-all duration-300", sidebarCollapsed ? "lg:ml-16" : "lg:ml-60")}>
        <LiveTicker agents={agents} lastResult={lastResult} totalRuns={totalRuns} uptime={uptime} />

        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="mb-6 flex items-center justify-between pt-10 lg:pt-0">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  TerraFusion Valuator Pro
                </h1>
                <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
                  COMMERCIAL FEE APPRAISAL PLATFORM · USPAP COMPLIANT · MULTI-AGENT AI
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse-glow rounded-full bg-primary" />
              <span className="font-mono text-[10px] tracking-wider text-primary">LIVE</span>
            </div>
          </header>

          {/* KPI Metrics */}
          <section className="mb-6" aria-label="Key metrics">
            <MetricsGrid agents={agents} lastResult={lastResult} totalRuns={totalRuns} />
          </section>

          {/* Tab Navigation */}
          <div className="mb-6 flex gap-1 rounded-lg border border-border bg-card p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 font-mono text-[10px] font-semibold tracking-wider transition-all",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.icon}
                <span className="hidden sm:block">{tab.label.toUpperCase()}</span>
              </button>
            ))}
          </div>

          {/* ── Tab: Dashboard ── */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <AppraiserDashboard />
            </div>
          )}

          {/* ── Tab: Appraisal Pipeline ── */}
          {activeTab === "pipeline" && (
            <div className="space-y-6">
              {/* Agent Network (collapsible) */}
              <section aria-label="Agent network">
                <button
                  onClick={() => setShowAgents(!showAgents)}
                  className="mb-3 flex items-center gap-2 font-mono text-[10px] font-medium tracking-wider text-muted-foreground hover:text-foreground"
                >
                  {showAgents ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  AI AGENT NETWORK ({agents.length} AGENTS)
                </button>
                {showAgents && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-4">
                    <div className="xl:col-span-1 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      {agents.map((agent) => (
                        <AgentCard key={agent.name} agent={agent} />
                      ))}
                    </div>
                    <div className="xl:col-span-1">
                      <NetworkTopology agents={agents} isRunning={isRunning} />
                    </div>
                    <div className="flex flex-col gap-4">
                      <SystemHealth agents={agents} totalRuns={totalRuns} uptime={uptime} />
                      <SwarmActivityFeed events={events} />
                    </div>
                  </div>
                )}
              </section>

              {/* Property Input */}
              <section aria-label="Property input">
                <div className="mb-3">
                  <h2 className="font-mono text-xs font-medium tracking-wider text-muted-foreground">
                    SUBJECT PROPERTY INPUT
                  </h2>
                </div>
                <div className="rounded-lg border border-border bg-card p-5">
                  <PropertyForm onSubmit={handleRunPipeline} isLoading={isRunning} />
                </div>
              </section>

              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
                  <p className="font-mono text-xs text-destructive">{error}</p>
                </div>
              )}

              {/* Pipeline Results */}
              <SwarmOrchestrator result={lastResult} isRunning={isRunning} comps={comps} lastProperty={lastProperty} />

              {/* Comp Grid */}
              {comps.length > 0 && (
                <section aria-label="Comparable sales">
                  <CompGrid comps={comps} subjectValue={salesCompValue} />
                </section>
              )}

              {/* Export Summary */}
              {lastResult && lastProperty && lastRegion && (
                <ExportSummary result={lastResult} property={lastProperty} region={lastRegion} comps={comps} />
              )}

              {/* Pipeline History */}
              <PipelineHistory history={history} />

              {/* Region Analysis */}
              <section aria-label="Multi-region analysis">
                <div className="mb-3">
                  <h2 className="font-mono text-xs font-medium tracking-wider text-muted-foreground">
                    MULTI-REGION MARKET INTELLIGENCE
                  </h2>
                </div>
                <RegionRadar activeRegion={lastRegion} />
              </section>

              {/* Command Terminal */}
              <section aria-label="Command terminal">
                <div className="mb-3">
                  <h2 className="font-mono text-xs font-medium tracking-wider text-muted-foreground">
                    AI COMMAND TERMINAL
                  </h2>
                </div>
                <CommandTerminal
                  onRunPipeline={handleRunPipeline}
                  onOpenReport={
                    lastProperty
                      ? () => {
                          const params = new URLSearchParams({
                            id: lastProperty.id,
                            address: lastProperty.address,
                            sqft: String(lastProperty.squareFeet),
                            beds: String(lastProperty.bedrooms ?? 0),
                            baths: String(lastProperty.bathrooms ?? 0),
                            region: lastRegion ?? "Downtown Core",
                          });
                          router.push(`/report?${params.toString()}`);
                        }
                      : undefined
                  }
                  isRunning={isRunning}
                />
              </section>
            </div>
          )}

          {/* ── Tab: Order Management ── */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <OrderManagement />
            </div>
          )}

          {/* ── Tab: Three Approaches to Value ── */}
          {activeTab === "approaches" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                <p className="font-mono text-[10px] text-primary">
                  THREE APPROACHES TO VALUE — Run the Appraisal Pipeline first to pre-populate the Sales Comparison value.
                  Income and Cost approaches can be used independently.
                </p>
              </div>

              {/* Sales Comparison */}
              {comps.length > 0 ? (
                <section aria-label="Sales comparison approach">
                  <CompGrid comps={comps} subjectValue={salesCompValue} />
                </section>
              ) : (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <Scale className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="font-mono text-xs text-muted-foreground">
                    Run the pipeline on the &quot;Appraisal Pipeline&quot; tab to generate comparable sales data.
                  </p>
                </div>
              )}

              {/* Comp Search */}
              <section aria-label="Comp search">
                <div className="rounded-lg border border-border bg-card p-5">
                  <CompSearch
                    subjectAddress={lastProperty?.address}
                    subjectCity={lastProperty?.city}
                    subjectState={lastProperty?.state}
                    subjectGla={lastProperty?.squareFeet}
                    subjectPropertyType={lastProperty?.propertyType}
                    subjectYearBuilt={lastProperty?.yearBuilt}
                    onAddComp={(comp) => setSearchedComps((prev) => [...prev.filter((c) => c.id !== comp.id), comp])}
                    selectedComps={searchedComps}
                  />
                </div>
              </section>

              {/* Income Approach — Toggle between Simple and DCF */}
              <section aria-label="Income approach">
                <div className="rounded-lg border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-mono text-xs font-bold text-muted-foreground tracking-wider">INCOME CAPITALIZATION APPROACH</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setShowDCF(false)}
                        className={cn(
                          "px-3 py-1.5 text-xs font-mono rounded border transition-all",
                          !showDCF ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        DIRECT CAP
                      </button>
                      <button
                        onClick={() => setShowDCF(true)}
                        className={cn(
                          "px-3 py-1.5 text-xs font-mono rounded border transition-all",
                          showDCF ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        DCF MODEL
                      </button>
                    </div>
                  </div>
                  {showDCF ? (
                    <DCFIncomeApproach
                      initialSqft={lastProperty?.squareFeet ?? 20000}
                      initialPropertyType={lastProperty?.propertyType ?? "Office"}
                      onValueChange={setIncomeValue}
                    />
                  ) : (
                    <IncomeApproach
                      propertySquareFeet={lastProperty?.squareFeet}
                      onValueChange={setIncomeValue}
                    />
                  )}
                </div>
              </section>

              {/* Cost Approach */}
              <section aria-label="Cost approach">
                <CostApproach
                  propertySquareFeet={lastProperty?.squareFeet}
                  yearBuilt={lastProperty?.yearBuilt}
                  onValueChange={setCostValue}
                />
              </section>

              {/* Value Reconciliation */}
              <section aria-label="Value reconciliation">
                <ValueReconciliation
                  salesCompValue={salesCompValue}
                  incomeValue={incomeValue}
                  costValue={costValue}
                  propertyType={lastProperty?.propertyType}
                  onFinalValueChange={setFinalValue}
                />
              </section>

              {finalValue && (
                <div className="rounded-lg border-2 border-primary/40 bg-primary/10 p-6 text-center">
                  <p className="font-mono text-[10px] tracking-widest text-primary mb-2">FINAL OPINION OF MARKET VALUE</p>
                  <p className="font-mono text-4xl font-bold text-primary">${finalValue.toLocaleString()}</p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-2">
                    {lastProperty?.address ? `${lastProperty.address}, ${lastProperty.city}, ${lastProperty.state}` : "Subject Property"}
                    {" · "}As of {new Date().toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* AI Narrative Drafting */}
              <section aria-label="AI narrative drafting">
                <NarrativeDrafting
                  property={lastProperty ? {
                    address: lastProperty.address,
                    city: lastProperty.city,
                    state: lastProperty.state,
                    zip: lastProperty.zip,
                    county: lastProperty.county,
                    propertyType: lastProperty.propertyType,
                    squareFeet: lastProperty.squareFeet,
                    yearBuilt: lastProperty.yearBuilt,
                    condition: lastProperty.condition,
                    bedrooms: lastProperty.bedrooms,
                    bathrooms: lastProperty.bathrooms,
                    landAreaAcres: lastProperty.landAreaAcres,
                    zoning: lastProperty.zoning,
                  } : undefined}
                  market={lastResult ? {
                    region: lastRegion ?? undefined,
                    marketTrend: lastResult.marketData.marketTrend,
                    medianPrice: lastResult.marketData.medianPrice,
                    averagePricePerSqft: lastResult.marketData.averagePricePerSqft,
                    averageDaysOnMarket: lastResult.marketData.averageDaysOnMarket,
                    listToSaleRatio: lastResult.marketData.listToSaleRatio,
                  } : undefined}
                  approaches={{
                    salesComp: salesCompValue,
                    salesCompWeight: 70,
                    income: incomeValue,
                    incomeWeight: 15,
                    cost: costValue,
                    costWeight: 15,
                    final: finalValue,
                  }}
                  risk={lastResult ? { riskLevel: lastResult.riskAssessment.riskLevel } : undefined}
                />
              </section>
            </div>
          )}

          {/* ── Tab: Settings / Appraiser Profile ── */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <AppraiserProfilePage />
            </div>
          )}

          {/* ── Tab: USPAP Compliance ── */}
          {activeTab === "compliance" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
                <p className="font-mono text-[10px] text-yellow-500/80">
                  USPAP NOTICE — This platform assists fee appraisers in developing and communicating credible opinions
                  of value. The appraiser remains solely responsible for the appraisal and its compliance with USPAP,
                  applicable state law, and client requirements. This tool does not constitute an appraisal.
                </p>
              </div>
              <USPAPCertification />
              <ComplianceBadge />
            </div>
          )}

          {/* Footer */}
          <footer className="mt-8 border-t border-border pt-4 pb-6">
            <p className="font-mono text-[10px] text-muted-foreground/50">
              TerraFusion Valuator Pro Studio v2.0.0 — Commercial Fee Appraiser Platform —
              USPAP Compliant · Three Approaches to Value · Multi-Agent AI · Order Management
            </p>
          </footer>
        </div>
      </main>

      <DispatchCenter
        onRunPipeline={handleRunPipeline}
        onOpenReport={
          lastProperty
            ? () => {
                const params = new URLSearchParams({
                  id: lastProperty.id,
                  address: lastProperty.address,
                  sqft: String(lastProperty.squareFeet),
                  beds: String(lastProperty.bedrooms ?? 0),
                  baths: String(lastProperty.bathrooms ?? 0),
                  region: lastRegion ?? "Downtown Core",
                });
                router.push(`/report?${params.toString()}`);
              }
            : undefined
        }
        isRunning={isRunning}
      />
    </div>
  );
}
