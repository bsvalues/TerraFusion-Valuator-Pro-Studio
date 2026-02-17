import { cn } from "@/lib/utils";
import type { SwarmEvent, EventSeverity } from "@/lib/types";

const severityColors: Record<EventSeverity, string> = {
  info: "bg-chart-3",
  success: "bg-primary",
  warning: "bg-chart-2",
  error: "bg-destructive",
};

interface SwarmActivityFeedProps {
  events: SwarmEvent[];
}

export function SwarmActivityFeed({ events }: SwarmActivityFeedProps) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h3 className="font-mono text-xs font-medium tracking-wider text-foreground">
          SWARM ACTIVITY LOG
        </h3>
      </div>
      <div className="h-[240px] overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-xs text-muted-foreground">
              Awaiting swarm events...
            </p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex gap-3 border-b border-border/50 px-5 py-3 last:border-b-0 animate-slide-in"
              >
                <div className="flex flex-col items-center pt-1.5">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      severityColors[event.severity]
                    )}
                  />
                  <span className="mt-1 h-full w-px bg-border" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-semibold tracking-wider text-muted-foreground">
                      {event.agent.toUpperCase().replace(" AGENT", "")}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground/60">
                      {event.action}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80">{event.detail}</p>
                  <p className="font-mono text-[10px] text-muted-foreground/50">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
