"use client";

import type { AgentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Cpu, Zap, Database } from "lucide-react";

interface SystemHealthProps {
  agents: AgentStatus[];
  totalRuns: number;
  uptime: number; // seconds
}

export function SystemHealth({ agents, totalRuns, uptime }: SystemHealthProps) {
  const avgHealth = Math.round(
    agents.reduce((sum, a) => sum + a.health, 0) / agents.length
  );
  const totalTasks = agents.reduce((sum, a) => sum + a.taskCount, 0);
  const onlineCount = agents.filter(
    (a) => a.status === "online" || a.status === "processing"
  ).length;

  function formatUptime(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  const systemMetrics = [
    {
      label: "SYSTEM HEALTH",
      value: `${avgHealth}%`,
      icon: Cpu,
      color: avgHealth >= 80 ? "text-primary" : avgHealth >= 50 ? "text-chart-2" : "text-destructive",
      barColor: avgHealth >= 80 ? "bg-primary" : avgHealth >= 50 ? "bg-chart-2" : "bg-destructive",
      barWidth: avgHealth,
    },
    {
      label: "AGENT UPTIME",
      value: formatUptime(uptime),
      icon: Zap,
      color: "text-chart-3",
      barColor: "bg-chart-3",
      barWidth: 100,
    },
    {
      label: "THROUGHPUT",
      value: `${totalTasks} tasks`,
      icon: Database,
      color: "text-foreground",
      barColor: "bg-muted-foreground",
      barWidth: Math.min((totalTasks / 20) * 100, 100),
    },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs font-medium tracking-wider text-foreground">
          SYSTEM TELEMETRY
        </h3>
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "h-1.5 w-1.5 rounded-full",
            onlineCount === 3 ? "bg-primary animate-pulse-glow" : "bg-chart-2"
          )} />
          <span className="font-mono text-[10px] text-muted-foreground">
            {onlineCount}/3 ONLINE
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {systemMetrics.map((metric) => (
          <div key={metric.label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <metric.icon className={cn("h-3 w-3", metric.color)} />
                <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
                  {metric.label}
                </span>
              </div>
              <span className={cn("font-mono text-sm font-bold", metric.color)}>
                {metric.value}
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn("h-full rounded-full transition-all duration-700", metric.barColor)}
                style={{ width: `${metric.barWidth}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline runs counter */}
      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
            TOTAL PIPELINE RUNS
          </span>
          <span className="font-mono text-lg font-bold text-foreground">
            {totalRuns}
          </span>
        </div>
      </div>
    </div>
  );
}
