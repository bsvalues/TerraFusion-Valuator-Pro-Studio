"use client";

import type { ComparableSale, } from "@/lib/engines";
import type { Valuation } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

interface ValuationSparklineProps {
  valuation: Valuation;
  comps: ComparableSale[];
}

export function ValuationSparkline({
  valuation,
  comps,
}: ValuationSparklineProps) {
  const chartData = comps.map((comp) => ({
    name: comp.id,
    adjusted: comp.adjustedPrice,
    sale: comp.salePrice,
  }));

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-xs font-medium tracking-wider text-foreground">
          COMP vs AVM OVERLAY
        </h4>
        <span className="font-mono text-[10px] text-primary">
          AVM: ${valuation.estimatedValue.toLocaleString()}
        </span>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="15%">
            <XAxis
              dataKey="name"
              tick={{
                fill: "hsl(240 4% 55%)",
                fontSize: 9,
                fontFamily: "var(--font-geist-mono)",
              }}
              axisLine={{ stroke: "hsl(240 4% 16%)" }}
              tickLine={false}
            />
            <YAxis
              tick={{
                fill: "hsl(240 4% 55%)",
                fontSize: 9,
                fontFamily: "var(--font-geist-mono)",
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(240 5% 8%)",
                border: "1px solid hsl(240 4% 16%)",
                borderRadius: "8px",
                fontFamily: "var(--font-geist-mono)",
                fontSize: "10px",
                color: "hsl(0 0% 93%)",
              }}
              formatter={(value: number, name: string) => [
                `$${value.toLocaleString()}`,
                name === "adjusted" ? "Adjusted" : "Sale Price",
              ]}
            />
            <ReferenceLine
              y={valuation.estimatedValue}
              stroke="hsl(160 84% 39%)"
              strokeDasharray="4 2"
              strokeWidth={1.5}
              label={{
                value: "AVM",
                position: "right",
                fill: "hsl(160 84% 39%)",
                fontSize: 9,
                fontFamily: "var(--font-geist-mono)",
              }}
            />
            <Bar dataKey="adjusted" radius={[3, 3, 0, 0]} name="adjusted">
              {chartData.map((_, index) => (
                <Cell
                  key={index}
                  fill="hsl(217 91% 60%)"
                  fillOpacity={0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-chart-3" />
          <span className="font-mono text-[10px] text-muted-foreground">
            Adjusted Comps
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 border-t-2 border-dashed border-primary" />
          <span className="font-mono text-[10px] text-muted-foreground">
            AVM Estimate
          </span>
        </div>
      </div>
    </div>
  );
}
