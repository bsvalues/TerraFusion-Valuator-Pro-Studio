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
  Menu,
  X,
  Globe,
  Terminal,
  BadgeCheck,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, id: "dashboard", section: "key-metrics" },
  { label: "Agent Swarm", icon: Network, id: "swarm", section: "agent-status" },
  { label: "Pipeline", icon: DollarSign, id: "pipeline", section: "swarm-pipeline" },
  { label: "Market Intel", icon: TrendingUp, id: "market", section: "multi-region-analysis" },
  { label: "Terminal", icon: Terminal, id: "terminal", section: "cloud-coach-terminal" },
  { label: "Compliance", icon: BadgeCheck, id: "compliance", section: "regulatory-compliance" },
] as const;

interface SidebarProps {
  systemOnline: boolean;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ systemOnline, collapsed, onToggle }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  // Track which section is in view via IntersectionObserver
  useEffect(() => {
    const sections = navItems
      .map((item) => ({
        id: item.id,
        el: document.querySelector(`[aria-label="${item.section.replace(/-/g, " ").replace(/\b\w/g, (c) => c)}"]`) ||
            document.querySelector(`[aria-label="${item.section}"]`),
      }))
      .filter((s) => s.el);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          const el = visible[0].target;
          const match = sections.find((s) => s.el === el);
          if (match) setActiveSection(match.id);
        }
      },
      { rootMargin: "-10% 0px -60% 0px", threshold: 0.1 }
    );

    sections.forEach((s) => {
      if (s.el) observer.observe(s.el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = useCallback((sectionLabel: string) => {
    // Try matching the aria-label
    const el =
      document.querySelector(`[aria-label="${sectionLabel}"]`) ||
      document.querySelector(`[aria-label="${sectionLabel.replace(/-/g, " ")}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMobileOpen(false);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Map aria-label values for scrolling
  const ariaLabelMap: Record<string, string> = {
    dashboard: "Key metrics",
    swarm: "Agent status",
    pipeline: "Swarm pipeline",
    market: "Multi-region analysis",
    terminal: "Cloud Coach terminal",
    compliance: "Regulatory compliance",
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-card transition-all duration-300",
          "max-lg:translate-x-[-100%]",
          collapsed ? "lg:w-16" : "lg:w-60",
          mobileOpen && "max-lg:translate-x-0 max-lg:w-60"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Radio className="h-4 w-4 text-primary" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate font-mono text-xs font-semibold tracking-wider text-foreground">
                TERRAFUSION
              </span>
              <span className="truncate font-mono text-[10px] tracking-widest text-muted-foreground">
                CLOUD COACH
              </span>
            </div>
          )}
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() =>
                      scrollToSection(ariaLabelMap[item.id] ?? item.section)
                    }
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-primary" : ""
                      )}
                    />
                    {(!collapsed || mobileOpen) && (
                      <span className="truncate">{item.label}</span>
                    )}
                    {isActive && (!collapsed || mobileOpen) && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Hotkey hint */}
        {(!collapsed || mobileOpen) && (
          <div className="border-t border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[8px] text-muted-foreground">
                Ctrl+K
              </kbd>
              <span className="font-mono text-[9px] text-muted-foreground/50">
                Quick dispatch
              </span>
            </div>
          </div>
        )}

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
            {(!collapsed || mobileOpen) && (
              <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
                {systemOnline ? "ALL SYSTEMS NOMINAL" : "SYSTEM ALERT"}
              </span>
            )}
          </div>
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-7 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </aside>
    </>
  );
}
