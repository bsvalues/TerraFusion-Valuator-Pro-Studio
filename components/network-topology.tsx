"use client";

import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/lib/types";

interface NetworkTopologyProps {
  agents: AgentStatus[];
  isRunning: boolean;
}

const AGENT_POSITIONS = [
  { x: 50, y: 18, label: "CLOUD COACH", role: "orchestrator" },
  { x: 15, y: 72, label: "VALUATION", role: "agent" },
  { x: 50, y: 85, label: "MARKET", role: "agent" },
  { x: 85, y: 72, label: "RISK", role: "agent" },
] as const;

const AGENT_DESCRIPTIONS: Record<string, { codename: string; specialty: string }> = {
  "Valuation Agent": {
    codename: "APPRAISER-1",
    specialty: "AVM Engine / Price Modeling",
  },
  "Market Agent": {
    codename: "ANALYST-2",
    specialty: "Regional Data / Trend Analysis",
  },
  "Risk Agent": {
    codename: "SENTINEL-3",
    specialty: "Factor Analysis / Threat Detection",
  },
};

function getStatusColor(status: string): string {
  switch (status) {
    case "online": return "hsl(160 84% 39%)";
    case "processing": return "hsl(38 92% 50%)";
    case "error": return "hsl(0 72% 51%)";
    default: return "hsl(240 4% 55%)";
  }
}

export function NetworkTopology({ agents, isRunning }: NetworkTopologyProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs font-medium tracking-wider text-foreground">
          SWARM NETWORK TOPOLOGY
        </h3>
        <span className={cn(
          "rounded-sm px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider",
          isRunning
            ? "bg-chart-2/10 text-chart-2"
            : "bg-primary/10 text-primary"
        )}>
          {isRunning ? "EXECUTING" : "STANDBY"}
        </span>
      </div>

      <div className="relative h-64 w-full">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Connection lines from coach to each agent */}
          {[1, 2, 3].map((i) => {
            const agentStatus = agents[i - 1];
            const color = getStatusColor(agentStatus?.status ?? "idle");
            return (
              <line
                key={`line-${i}`}
                x1={AGENT_POSITIONS[0].x}
                y1={AGENT_POSITIONS[0].y + 5}
                x2={AGENT_POSITIONS[i].x}
                y2={AGENT_POSITIONS[i].y - 5}
                stroke={color}
                strokeWidth="0.3"
                strokeDasharray={isRunning ? "2 1" : "none"}
                opacity={0.5}
              >
                {isRunning && (
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="-6"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                )}
              </line>
            );
          })}

          {/* Inter-agent connections */}
          <line x1={AGENT_POSITIONS[1].x} y1={AGENT_POSITIONS[1].y} x2={AGENT_POSITIONS[2].x} y2={AGENT_POSITIONS[2].y} stroke="hsl(240 4% 22%)" strokeWidth="0.2" opacity="0.3" />
          <line x1={AGENT_POSITIONS[2].x} y1={AGENT_POSITIONS[2].y} x2={AGENT_POSITIONS[3].x} y2={AGENT_POSITIONS[3].y} stroke="hsl(240 4% 22%)" strokeWidth="0.2" opacity="0.3" />
          <line x1={AGENT_POSITIONS[3].x} y1={AGENT_POSITIONS[3].y} x2={AGENT_POSITIONS[1].x} y2={AGENT_POSITIONS[1].y} stroke="hsl(240 4% 22%)" strokeWidth="0.2" opacity="0.3" />

          {/* Cloud Coach node */}
          <g>
            <circle
              cx={AGENT_POSITIONS[0].x}
              cy={AGENT_POSITIONS[0].y}
              r="6"
              fill="hsl(240 5% 8%)"
              stroke="hsl(160 84% 39%)"
              strokeWidth="0.5"
            />
            <circle
              cx={AGENT_POSITIONS[0].x}
              cy={AGENT_POSITIONS[0].y}
              r="2.5"
              fill="hsl(160 84% 39%)"
              opacity={isRunning ? "0.8" : "0.4"}
            >
              {isRunning && (
                <animate
                  attributeName="r"
                  values="2.5;3.5;2.5"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              )}
            </circle>
            <text
              x={AGENT_POSITIONS[0].x}
              y={AGENT_POSITIONS[0].y + 10}
              textAnchor="middle"
              fill="hsl(0 0% 93%)"
              fontSize="2.5"
              fontFamily="var(--font-geist-mono)"
              fontWeight="600"
              letterSpacing="0.1"
            >
              {AGENT_POSITIONS[0].label}
            </text>
          </g>

          {/* Agent nodes */}
          {agents.map((agent, i) => {
            const pos = AGENT_POSITIONS[i + 1];
            const color = getStatusColor(agent.status);
            const meta = AGENT_DESCRIPTIONS[agent.name];
            return (
              <g key={agent.name}>
                {/* Outer ring */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="5"
                  fill="hsl(240 5% 8%)"
                  stroke={color}
                  strokeWidth="0.4"
                />
                {/* Inner dot */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="2"
                  fill={color}
                  opacity={agent.status === "processing" ? "0.9" : "0.5"}
                >
                  {agent.status === "processing" && (
                    <animate
                      attributeName="opacity"
                      values="0.9;0.3;0.9"
                      dur="0.8s"
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
                {/* Label */}
                <text
                  x={pos.x}
                  y={pos.y + 8.5}
                  textAnchor="middle"
                  fill="hsl(240 4% 55%)"
                  fontSize="2"
                  fontFamily="var(--font-geist-mono)"
                  letterSpacing="0.08"
                >
                  {pos.label}
                </text>
                {/* Codename */}
                <text
                  x={pos.x}
                  y={pos.y + 11}
                  textAnchor="middle"
                  fill="hsl(240 4% 35%)"
                  fontSize="1.5"
                  fontFamily="var(--font-geist-mono)"
                  letterSpacing="0.05"
                >
                  {meta?.codename}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Agent persona cards */}
      <div className="grid grid-cols-3 gap-3">
        {agents.map((agent) => {
          const meta = AGENT_DESCRIPTIONS[agent.name];
          const color = getStatusColor(agent.status);
          return (
            <div
              key={agent.name}
              className="flex flex-col gap-1 rounded-md border border-border/50 bg-background/50 px-3 py-2"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="font-mono text-[10px] font-semibold tracking-wider text-foreground">
                  {meta?.codename}
                </span>
              </div>
              <p className="font-mono text-[9px] text-muted-foreground">
                {meta?.specialty}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
