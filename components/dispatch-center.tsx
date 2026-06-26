"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { AVAILABLE_REGIONS } from "@/lib/engines";
import type { Property } from "@/lib/types";
import {
  Command,
  Zap,
  Play,
  FileText,
  BarChart3,
  Shield,
  Search,
  X,
} from "lucide-react";

interface DispatchAction {
  id: string;
  label: string;
  description: string;
  shortcut: string;
  icon: typeof Command;
  category: "pipeline" | "navigate" | "system";
}

const ACTIONS: DispatchAction[] = [
  {
    id: "run-downtown",
    label: "Run Pipeline: Downtown",
    description: "Execute swarm pipeline with sample property in Downtown",
    shortcut: "1",
    icon: Play,
    category: "pipeline",
  },
  {
    id: "run-suburbs",
    label: "Run Pipeline: Suburbs",
    description: "Execute swarm pipeline with sample property in Suburbs",
    shortcut: "2",
    icon: Play,
    category: "pipeline",
  },
  {
    id: "run-urban",
    label: "Run Pipeline: Urban Core",
    description: "Execute swarm pipeline with sample property in Urban Core",
    shortcut: "3",
    icon: Play,
    category: "pipeline",
  },
  {
    id: "run-rural",
    label: "Run Pipeline: Rural County",
    description: "Execute swarm pipeline in Rural County",
    shortcut: "4",
    icon: Play,
    category: "pipeline",
  },
  {
    id: "run-waterfront",
    label: "Run Pipeline: Waterfront",
    description: "Execute swarm pipeline in Waterfront District",
    shortcut: "5",
    icon: Play,
    category: "pipeline",
  },
  {
    id: "scroll-pipeline",
    label: "Go to Pipeline",
    description: "Scroll to Swarm Pipeline Orchestrator",
    shortcut: "P",
    icon: BarChart3,
    category: "navigate",
  },
  {
    id: "scroll-terminal",
    label: "Go to Terminal",
    description: "Scroll to Valuator Pro Terminal",
    shortcut: "T",
    icon: Zap,
    category: "navigate",
  },
  {
    id: "open-report",
    label: "Open Report",
    description: "Navigate to last appraisal report",
    shortcut: "R",
    icon: FileText,
    category: "navigate",
  },
  {
    id: "scroll-risk",
    label: "Go to Risk / Region",
    description: "Scroll to Multi-Region Intelligence section",
    shortcut: "M",
    icon: Shield,
    category: "navigate",
  },
];

interface DispatchCenterProps {
  onRunPipeline: (property: Property, region: string) => void;
  onOpenReport?: () => void;
  isRunning: boolean;
}

export function DispatchCenter({
  onRunPipeline,
  onOpenReport,
  isRunning,
}: DispatchCenterProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredActions = ACTIONS.filter(
    (a) =>
      a.label.toLowerCase().includes(filter.toLowerCase()) ||
      a.description.toLowerCase().includes(filter.toLowerCase())
  );

  const executeAction = useCallback(
    (action: DispatchAction) => {
      setOpen(false);
      setFilter("");

      const regionMap: Record<string, string> = {
        "run-downtown": "Downtown",
        "run-suburbs": "Suburbs",
        "run-urban": "Urban Core",
        "run-rural": "Rural County",
        "run-waterfront": "Waterfront District",
      };

      if (action.category === "pipeline" && regionMap[action.id]) {
        if (isRunning) return;
        const sampleProperty: Property = {
          id: `TF-${Math.floor(Math.random() * 90000) + 10000}`,
          address: `${100 + Math.floor(Math.random() * 900)} Dispatch Ave`,
          city: "Austin",
          state: "TX",
          zip: "78701",
          county: "Travis",
          propertyType: "single_family",
          condition: "Average",
          squareFeet: 1800 + Math.floor(Math.random() * 2200),
          bedrooms: 2 + Math.floor(Math.random() * 4),
          bathrooms: 1 + Math.floor(Math.random() * 3),
        };
        onRunPipeline(sampleProperty, regionMap[action.id]);
      }

      if (action.id === "open-report" && onOpenReport) {
        onOpenReport();
      }

      if (action.id === "scroll-pipeline") {
        document
          .querySelector('[aria-label="Swarm pipeline"]')
          ?.scrollIntoView({ behavior: "smooth" });
      }
      if (action.id === "scroll-terminal") {
        document
          .querySelector('[aria-label="Valuator Pro terminal"]')
          ?.scrollIntoView({ behavior: "smooth" });
      }
      if (action.id === "scroll-risk") {
        document
          .querySelector('[aria-label="Multi-region analysis"]')
          ?.scrollIntoView({ behavior: "smooth" });
      }
    },
    [isRunning, onRunPipeline, onOpenReport]
  );

  // Keyboard shortcut to open: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setFilter("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset index when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredActions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredActions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        executeAction(filteredActions[selectedIndex]);
      }
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          setFilter("");
          setSelectedIndex(0);
        }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 shadow-lg transition-colors hover:bg-secondary"
        aria-label="Open dispatch center"
      >
        <Command className="h-4 w-4 text-primary" />
        <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
          DISPATCH
        </span>
        <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
          {"Ctrl+K"}
        </kbd>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Command palette */}
      <div className="fixed inset-x-4 top-[20%] z-50 mx-auto max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl sm:inset-x-auto">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search actions..."
            className="flex-1 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            onClick={() => setOpen(false)}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Action list */}
        <div className="max-h-72 overflow-y-auto py-2">
          {["pipeline", "navigate", "system"].map((category) => {
            const items = filteredActions.filter(
              (a) => a.category === category
            );
            if (items.length === 0) return null;
            return (
              <div key={category}>
                <p className="px-4 py-1.5 font-mono text-[9px] font-semibold tracking-wider text-muted-foreground/60">
                  {category === "pipeline"
                    ? "PIPELINE ACTIONS"
                    : category === "navigate"
                      ? "NAVIGATION"
                      : "SYSTEM"}
                </p>
                {items.map((action) => {
                  const globalIdx = filteredActions.indexOf(action);
                  const isSelected = globalIdx === selectedIndex;
                  return (
                    <button
                      key={action.id}
                      onClick={() => executeAction(action)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        isSelected
                          ? "bg-secondary text-foreground"
                          : "text-foreground/80 hover:bg-secondary/50"
                      )}
                    >
                      <action.icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSelected
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      />
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate font-mono text-xs font-medium">
                          {action.label}
                        </p>
                        <p className="truncate font-mono text-[10px] text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                      <kbd className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                        {action.shortcut}
                      </kbd>
                    </button>
                  );
                })}
              </div>
            );
          })}
          {filteredActions.length === 0 && (
            <p className="px-4 py-6 text-center font-mono text-xs text-muted-foreground">
              No actions found.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-border px-4 py-2">
          <div className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[8px] text-muted-foreground">
              {"\\u2191\\u2193"}
            </kbd>
            <span className="font-mono text-[8px] text-muted-foreground/50">
              navigate
            </span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[8px] text-muted-foreground">
              {"\\u23CE"}
            </kbd>
            <span className="font-mono text-[8px] text-muted-foreground/50">
              execute
            </span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[8px] text-muted-foreground">
              esc
            </kbd>
            <span className="font-mono text-[8px] text-muted-foreground/50">
              close
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
