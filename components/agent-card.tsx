import { cn } from "@/lib/utils";
import type { AgentStatus, AgentStatusCode } from "@/lib/types";
import { Bot, Activity, AlertTriangle, Loader2 } from "lucide-react";

const statusConfig: Record<
  AgentStatusCode,
  { label: string; dotColor: string; textColor: string }
> = {
  online: {
    label: "Online",
    dotColor: "bg-primary",
    textColor: "text-primary",
  },
  processing: {
    label: "Processing",
    dotColor: "bg-chart-2",
    textColor: "text-chart-2",
  },
  error: {
    label: "Error",
    dotColor: "bg-destructive",
    textColor: "text-destructive",
  },
  idle: {
    label: "Idle",
    dotColor: "bg-muted-foreground",
    textColor: "text-muted-foreground",
  },
};

interface AgentCardProps {
  agent: AgentStatus;
}

export function AgentCard({ agent }: AgentCardProps) {
  const config = statusConfig[agent.status];

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
            <Bot className="h-4 w-4 text-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">
              {agent.name}
            </h3>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  config.dotColor,
                  agent.status === "processing" && "animate-pulse-glow"
                )}
              />
              <span className={cn("font-mono text-[10px]", config.textColor)}>
                {config.label.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {agent.status === "processing" ? (
          <Loader2 className="h-4 w-4 animate-spin text-chart-2" />
        ) : agent.status === "error" ? (
          <AlertTriangle className="h-4 w-4 text-destructive" />
        ) : (
          <Activity className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="font-mono text-[10px] text-muted-foreground">
            TASKS RUN
          </p>
          <p className="font-mono text-lg font-semibold text-foreground">
            {agent.taskCount}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] text-muted-foreground">HEALTH</p>
          <p className="font-mono text-lg font-semibold text-foreground">
            {agent.health}%
          </p>
        </div>
      </div>

      {/* Health bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            agent.health >= 80
              ? "bg-primary"
              : agent.health >= 50
                ? "bg-chart-2"
                : "bg-destructive"
          )}
          style={{ width: `${agent.health}%` }}
        />
      </div>

      {/* Last run */}
      <p className="font-mono text-[10px] text-muted-foreground">
        {agent.lastRun
          ? `Last run: ${new Date(agent.lastRun).toLocaleTimeString()}`
          : "Awaiting first task"}
      </p>
    </div>
  );
}
