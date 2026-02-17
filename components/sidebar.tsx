"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Network,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  Radio,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { label: "Agent Swarm", icon: Network, id: "swarm" },
  { label: "Valuations", icon: DollarSign, id: "valuations" },
  { label: "Market Analysis", icon: TrendingUp, id: "market" },
  { label: "Risk Assessment", icon: ShieldAlert, id: "risk" },
] as const;

interface SidebarProps {
  systemOnline: boolean;
}

export function Sidebar({ systemOnline }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Radio className="h-4 w-4 text-primary" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="truncate font-mono text-xs font-semibold tracking-wider text-foreground">
              TERRAFUSION
            </span>
            <span className="truncate font-mono text-[10px] tracking-widest text-muted-foreground">
              CLOUD COACH
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                className={cn(
                  "group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  item.id === "dashboard" &&
                    "bg-secondary text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer -- system status */}
      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              systemOnline
                ? "bg-primary animate-pulse-glow"
                : "bg-destructive"
            )}
          />
          {!collapsed && (
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
              {systemOnline ? "ALL SYSTEMS NOMINAL" : "SYSTEM ALERT"}
            </span>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-7 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  );
}
