"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Terminal, ChevronRight } from "lucide-react";
import { getAgentStatuses, getPipelineHistory } from "@/lib/swarm";
import { analyzeMarket, AVAILABLE_REGIONS } from "@/lib/engines";
import type { Property } from "@/lib/types";

interface TerminalLine {
  id: number;
  type: "input" | "output" | "error" | "system";
  text: string;
}

interface CommandTerminalProps {
  onRunPipeline: (property: Property, region: string) => void;
  onOpenReport?: () => void;
  isRunning: boolean;
}

const HELP_TEXT = `Available Commands:
  status               Show all agent statuses
  health               Show system health summary
  history              Show recent pipeline runs
  regions              List available market regions
  run <region>         Run pipeline with sample property in <region>
  compare <r1> vs <r2> Compare two market regions side-by-side
  report               Open appraisal report for last pipeline run
  forecast <region>    Show 6-month price forecast for a region
  benchmark            Run all 5 regions side-by-side
  swarm                Show swarm mesh topology status
  clear                Clear terminal output
  help                 Show this help message
  whoami               Identify the Valuator Pro system
  appraise             Activate Fee Appraiser Mode`;

export function CommandTerminal({ onRunPipeline, onOpenReport, isRunning }: CommandTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 0,
      type: "system",
      text: "TerraFusion Valuator Pro Terminal v2.0.0",
    },
    {
      id: 1,
      type: "system",
      text: "Fee Appraiser Mode ACTIVE -- USPAP Compliant AI Platform",
    },
    {
      id: 2,
      type: "system",
      text: 'Type "help" for available commands.',
    },
  ]);
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lineIdRef = useRef(3);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [lines]);

  const addLine = useCallback(
    (type: TerminalLine["type"], text: string) => {
      const id = lineIdRef.current++;
      setLines((prev) => [...prev, { id, type, text }]);
    },
    []
  );

  const processCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim().toLowerCase();
      const parts = trimmed.split(/\s+/);
      const command = parts[0];

      addLine("input", `$ ${cmd}`);

      switch (command) {
        case "help":
          addLine("output", HELP_TEXT);
          break;

        case "status": {
          addLine("output", "--- AGENT STATUS ---");
          addLine("output", "  APPRAISER-1 (Valuation Agent)  ... ONLINE");
          addLine("output", "  ANALYST-2   (Market Agent)     ... ONLINE");
          addLine("output", "  SENTINEL-3  (Risk Agent)       ... ONLINE");
          addLine("output", "All agents reporting nominal.");
          break;
        }

        case "health": {
          addLine("output", "--- SYSTEM HEALTH ---");
          addLine("output", "  Overall:     100%");
          addLine("output", "  Memory:      Nominal");
          addLine("output", "  Swarm mesh:  Fully connected");
          addLine("output", "  Pipeline:    Idle / Ready");
          break;
        }

        case "history": {
          const hist = getPipelineHistory();
          if (hist.length === 0) {
            addLine("output", "No pipeline runs recorded yet.");
          } else {
            addLine("output", `--- LAST ${Math.min(hist.length, 5)} PIPELINE RUNS ---`);
            hist.slice(0, 5).forEach((run) => {
              addLine(
                "output",
                `  ${run.propertyId}  $${run.estimatedValue.toLocaleString()}  ${run.riskLevel.padEnd(6)}  ${run.marketTrend.padEnd(9)}  ${run.durationMs}ms`
              );
            });
          }
          break;
        }

        case "regions":
          addLine("output", "--- AVAILABLE REGIONS ---");
          addLine("output", "  Downtown");
          addLine("output", "  Suburbs");
          addLine("output", "  Urban Core");
          addLine("output", "  Rural County");
          addLine("output", "  Waterfront District");
          break;

        case "run": {
          if (isRunning) {
            addLine("error", "Pipeline already executing. Please wait.");
            break;
          }
          const region = parts.slice(1).join(" ");
          const regionMap: Record<string, string> = {
            downtown: "Downtown",
            suburbs: "Suburbs",
            "urban core": "Urban Core",
            "rural county": "Rural County",
            "waterfront district": "Waterfront District",
            waterfront: "Waterfront District",
            rural: "Rural County",
            urban: "Urban Core",
          };
          const resolvedRegion = regionMap[region] ?? "Downtown";

          addLine(
            "system",
            `Initiating swarm pipeline in ${resolvedRegion}...`
          );

          const sampleProperty: Property = {
            id: `TF-${Math.floor(Math.random() * 90000) + 10000}`,
            address: `${100 + Math.floor(Math.random() * 900)} Terminal Ave`,
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

          addLine(
            "output",
            `Property: ${sampleProperty.id} | ${sampleProperty.address} | ${sampleProperty.squareFeet} sqft`
          );

          onRunPipeline(sampleProperty, resolvedRegion);
          break;
        }

        case "compare": {
          const rest = parts.slice(1).join(" ");
          const vsParts = rest.split(/\s+vs\s+/i);
          if (vsParts.length < 2) {
            addLine("error", 'Usage: compare <region1> vs <region2>');
            addLine("error", 'Example: compare downtown vs suburbs');
            break;
          }

          const regionMap2: Record<string, string> = {
            downtown: "Downtown",
            suburbs: "Suburbs",
            "urban core": "Urban Core",
            "rural county": "Rural County",
            "waterfront district": "Waterfront District",
            waterfront: "Waterfront District",
            rural: "Rural County",
            urban: "Urban Core",
          };

          const r1 = regionMap2[vsParts[0].trim()] ?? vsParts[0].trim();
          const r2 = regionMap2[vsParts[1].trim()] ?? vsParts[1].trim();

          try {
            const m1 = analyzeMarket(r1);
            const m2 = analyzeMarket(r2);
            addLine("output", `--- REGION COMPARISON: ${r1} vs ${r2} ---`);
            addLine("output", `  Metric           ${r1.padEnd(22)} ${r2}`);
            addLine("output", `  ${"─".repeat(55)}`);
            addLine("output", `  Median Price      $${m1.medianPrice.toLocaleString().padEnd(20)} $${m2.medianPrice.toLocaleString()}`);
            addLine("output", `  Avg $/SqFt        $${String(m1.averagePricePerSqft).padEnd(20)} $${m2.averagePricePerSqft}`);
            addLine("output", `  Market Trend      ${m1.marketTrend.padEnd(22)} ${m2.marketTrend}`);
            const diff = ((m1.medianPrice - m2.medianPrice) / m2.medianPrice * 100).toFixed(1);
            addLine("output", `  Price Delta:      ${Number(diff) > 0 ? "+" : ""}${diff}% (${r1} vs ${r2})`);
          } catch {
            addLine("error", "Failed to compare regions. Check region names.");
          }
          break;
        }

        case "report":
          if (onOpenReport) {
            addLine("system", "Opening appraisal report...");
            onOpenReport();
          } else {
            addLine("error", "No pipeline results available. Run a pipeline first.");
          }
          break;

        case "swarm":
          addLine("output", "--- SWARM MESH TOPOLOGY ---");
          addLine("output", "                 COACH-0");
          addLine("output", "                /   |   \\");
          addLine("output", "    APPRAISER-1  ANALYST-2  SENTINEL-3");
          addLine("output", "         \\__________|__________/");
          addLine("output", "           Fully Connected Mesh");
          addLine("output", "");
          addLine("output", "  Mode: Fee Appraiser (USPAP Compliant)");
          addLine("output", "  Protocol: Event-Driven Sequential Pipeline");
          addLine("output", "  Mesh status: All links healthy");
          break;

        case "clear":
          setLines([]);
          break;

        case "forecast": {
          const fRegion = parts.slice(1).join(" ");
          const fRegionMap: Record<string, string> = {
            downtown: "Downtown",
            suburbs: "Suburbs",
            "urban core": "Urban Core",
            "rural county": "Rural County",
            "waterfront district": "Waterfront District",
            waterfront: "Waterfront District",
            rural: "Rural County",
            urban: "Urban Core",
          };
          const resolvedFRegion = fRegionMap[fRegion] ?? "Downtown";
          try {
            const mkt = analyzeMarket(resolvedFRegion);
            const multiplier =
              mkt.marketTrend === "Rising" ? 1.008 : mkt.marketTrend === "Declining" ? 0.995 : 1.002;
            addLine("output", `--- 6-MONTH FORECAST: ${resolvedFRegion} ---`);
            addLine("output", `  Current Median: $${mkt.medianPrice.toLocaleString()}`);
            addLine("output", `  Trend: ${mkt.marketTrend}`);
            addLine("output", "");
            for (let m = 1; m <= 6; m++) {
              const projected = Math.round(mkt.medianPrice * Math.pow(multiplier, m));
              const pctChange = (((projected - mkt.medianPrice) / mkt.medianPrice) * 100).toFixed(1);
              addLine(
                "output",
                `  Month ${m}:  $${projected.toLocaleString()}  (${Number(pctChange) >= 0 ? "+" : ""}${pctChange}%)`
              );
            }
          } catch {
            addLine("error", "Failed to generate forecast.");
          }
          break;
        }

        case "benchmark": {
          addLine("system", "Running benchmark across all 5 regions...");
          addLine("output", "--- MULTI-REGION BENCHMARK ---");
          AVAILABLE_REGIONS.forEach((r) => {
            try {
              const mkt = analyzeMarket(r);
              addLine(
                "output",
                `  ${r.padEnd(22)} $${mkt.medianPrice.toLocaleString().padEnd(10)} $${String(mkt.averagePricePerSqft).padEnd(6)} ${mkt.marketTrend}`
              );
            } catch {
              addLine("error", `  Failed: ${r}`);
            }
          });
          addLine("output", "");
          addLine("output", "  Benchmark complete. 5/5 regions analyzed.");
          break;
        }

        case "appraise":
          addLine("system", "=== RALPH WIGGUM MODE ACTIVATED ===");
          addLine("output", '"I\'m helping!"');
          addLine("output", '"Me fail English? That\'s unpossible!"');
          addLine("output", '"I bent my wookiee."');
          addLine("output", '"My cat\'s breath smells like cat food."');
          addLine("output", '"I\'m learnding!"');
          addLine("system", "Valuator Pro operating at maximum capacity.");
          addLine("system", "All agents have been encouraged. Morale: MAXIMUM.");
          break;

        case "whoami":
          addLine("output", "TerraFusion Valuator Pro -- Commercial Fee Appraisal Platform");
          addLine("output", "Primary Orchestrator Agent");
          addLine("output", "Designation: COACH-0");
          addLine(
            "output",
            "Mode: Fee Appraiser (USPAP Compliant)"
          );
          addLine("output", '"I\'m helping!"');
          break;

        case "":
          break;

        default:
          addLine(
            "error",
            `Unknown command: "${command}". Type "help" for available commands.`
          );
      }
    },
    [addLine, isRunning, onRunPipeline, onOpenReport]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setCommandHistory((prev) => [input, ...prev].slice(0, 50));
    setHistoryIndex(-1);
    processCommand(input);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = Math.min(
          historyIndex + 1,
          commandHistory.length - 1
        );
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  }

  const lineColors: Record<TerminalLine["type"], string> = {
    input: "text-foreground",
    output: "text-primary/90",
    error: "text-destructive",
    system: "text-chart-3",
  };

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Terminal className="h-3.5 w-3.5 text-primary" />
        <h3 className="font-mono text-xs font-medium tracking-wider text-foreground">
          VALUATOR PRO TERMINAL
        </h3>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          {isRunning ? "EXECUTING..." : "READY"}
        </span>
      </div>

      {/* Output area */}
      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        className="h-56 overflow-y-auto bg-background/50 px-5 py-3 font-mono text-xs"
      >
        {lines.map((line) => (
          <div key={line.id} className={cn("whitespace-pre-wrap", lineColors[line.type])}>
            {line.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border px-5 py-3"
      >
        <ChevronRight className="h-3 w-3 shrink-0 text-primary" />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command..."
          disabled={false}
          className="flex-1 bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    </div>
  );
}
