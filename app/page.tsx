"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  Property,
  AgentStatus,
  SwarmEvent,
  SwarmPipelineResult,
} from "@/lib/types";
import type { PipelineRun } from "@/lib/swarm";
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
import { Radio } from "lucide-react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CloudCoachDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<SwarmPipelineResult | null>(null);
  const [totalRuns, setTotalRuns] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uptime, setUptime] = useState(0);

  // Uptime counter
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch agent statuses and events via SWR
  const { data: swarmData } = useSWR<{ agents: AgentStatus[] }>(
    "/api/swarm",
    fetcher,
    { refreshInterval: 3000 }
  );

  const { data: eventsData } = useSWR<{ events: SwarmEvent[] }>(
    "/api/swarm/events",
    fetcher,
    { refreshInterval: 2000 }
  );

  const { data: historyData } = useSWR<{ history: PipelineRun[] }>(
    "/api/swarm/history",
    fetcher,
    { refreshInterval: 3000 }
  );

  const agents = swarmData?.agents ?? [
    { name: "Valuation Agent" as const, status: "online" as const, lastRun: null, taskCount: 0, health: 100 },
    { name: "Market Agent" as const, status: "online" as const, lastRun: null, taskCount: 0, health: 100 },
    { name: "Risk Agent" as const, status: "online" as const, lastRun: null, taskCount: 0, health: 100 },
  ];

  const events = eventsData?.events ?? [];
  const history = historyData?.history ?? [];

  const handleRunPipeline = useCallback(
    async (property: Property, region: string) => {
      setIsRunning(true);
      setError(null);

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

        // Refresh SWR caches
        mutate("/api/swarm");
        mutate("/api/swarm/events");
        mutate("/api/swarm/history");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unknown error occurred"
        );
      } finally {
        setIsRunning(false);
      }
    },
    []
  );

  const systemOnline = agents.every((a) => a.status !== "error");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        systemOnline={systemOnline}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content area */}
      <main
        className={cn(
          "flex-1 px-4 py-6 transition-all duration-300 sm:px-6 lg:px-8",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-60"
        )}
      >
        {/* Header */}
        <header className="mb-8 flex items-center justify-between pt-10 lg:pt-0">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Radio className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-balance text-xl font-semibold text-foreground">
                TerraFusion Cloud Coach
              </h1>
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
                ELITE GOVERNMENT OS / MULTI-AGENT SWARM / RALPH WIGGUM MODE
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse-glow rounded-full bg-primary" />
            <span className="font-mono text-[10px] tracking-wider text-primary">
              LIVE
            </span>
          </div>
        </header>

        {/* KPI Metrics */}
        <section className="mb-6" aria-label="Key metrics">
          <MetricsGrid
            agents={agents}
            lastResult={lastResult}
            totalRuns={totalRuns}
          />
        </section>

        {/* Agent Status + Activity Feed + Topology */}
        <section className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-12" aria-label="Agent status">
          {/* Agent Cards */}
          <div className="flex flex-col gap-4 xl:col-span-4">
            <h2 className="font-mono text-xs font-medium tracking-wider text-muted-foreground">
              AGENT SWARM STATUS
            </h2>
            <div className="flex flex-col gap-4">
              {agents.map((agent) => (
                <AgentCard key={agent.name} agent={agent} />
              ))}
            </div>
          </div>

          {/* Network Topology */}
          <div className="xl:col-span-4">
            <NetworkTopology agents={agents} isRunning={isRunning} />
          </div>

          {/* Activity Feed + System Health */}
          <div className="flex flex-col gap-4 xl:col-span-4">
            <SystemHealth
              agents={agents}
              totalRuns={totalRuns}
              uptime={uptime}
            />
            <SwarmActivityFeed events={events} />
          </div>
        </section>

        {/* Pipeline Orchestrator */}
        <section className="mb-6" aria-label="Swarm pipeline">
          <div className="mb-4">
            <h2 className="font-mono text-xs font-medium tracking-wider text-muted-foreground">
              SWARM PIPELINE ORCHESTRATOR
            </h2>
          </div>

          {/* Property input form */}
          <div className="mb-6 rounded-lg border border-border bg-card p-5">
            <h3 className="mb-4 font-mono text-xs font-medium tracking-wider text-foreground">
              PROPERTY INPUT
            </h3>
            <PropertyForm onSubmit={handleRunPipeline} isLoading={isRunning} />
          </div>

          {/* Error display */}
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
              <p className="font-mono text-xs text-destructive">{error}</p>
            </div>
          )}

          {/* Pipeline results */}
          <SwarmOrchestrator result={lastResult} isRunning={isRunning} />
        </section>

        {/* Pipeline History */}
        <section className="mb-6" aria-label="Pipeline history">
          <PipelineHistory history={history} />
        </section>

        {/* Footer */}
        <footer className="border-t border-border pt-4">
          <p className="font-mono text-[10px] text-muted-foreground/50">
            TerraFusion Valuator Pro Studio v1.0.0 -- Cloud Coach Agent --
            Multi-Agent Swarm Architecture -- Rust Backend + Next.js Control
            Plane -- Ralph Wiggum Mode Active
          </p>
        </footer>
      </main>
    </div>
  );
}
