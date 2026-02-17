"use client";

import type { MarketData } from "@/lib/types";
import { AVAILABLE_REGIONS } from "@/lib/engines";
import { analyzeMarket } from "@/lib/engines";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketChartProps {
  currentMarket: MarketData | null;
}

const trendIcons = {
  Rising: TrendingUp,
  Stable: Minus,
  Declining: TrendingDown,
};

const trendColors = {
  Rising: "text-primary",
  Stable: "text-chart-2",
  Declining: "text-destructive",
};

export function MarketChart({ currentMarket }: MarketChartProps) {
  // Generate comparison data for all regions
  const chartData = AVAILABLE_REGIONS.map((region) => {
    const data = analyzeMarket(region);
    return {
      region: region.length > 10 ? region.slice(0, 10) + "..." : region,
      fullRegion: region,
      medianPrice: data.medianPrice,
      pricePerSqft: data.averagePricePerSqft,
      isActive: currentMarket?.region === region,
    };
  });

  const TrendIcon = currentMarket
    ? trendIcons[currentMarket.marketTrend]
    : Minus;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-xs font-medium tracking-wider text-foreground">
          MARKET COMPARISON
        </h4>
        {currentMarket && (
          <div className="flex items-center gap-1.5">
            <TrendIcon
              className={cn("h-3 w-3", trendColors[currentMarket.marketTrend])}
            />
            <span
              className={cn(
                "font-mono text-[10px] font-semibold",
                trendColors[currentMarket.marketTrend]
              )}
            >
              {currentMarket.marketTrend.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Active market stats */}
      {currentMarket && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-mono text-[10px] text-muted-foreground">
              MEDIAN PRICE
            </p>
            <p className="font-mono text-lg font-bold text-foreground">
              ${currentMarket.medianPrice.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-muted-foreground">
              AVG $/SQFT
            </p>
            <p className="font-mono text-lg font-bold text-foreground">
              ${currentMarket.averagePricePerSqft}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%">
            <XAxis
              dataKey="region"
              tick={{ fill: "hsl(240 4% 55%)", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
              axisLine={{ stroke: "hsl(240 4% 16%)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(240 4% 55%)", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(240 5% 8%)",
                border: "1px solid hsl(240 4% 16%)",
                borderRadius: "8px",
                fontFamily: "var(--font-geist-mono)",
                fontSize: "11px",
                color: "hsl(0 0% 93%)",
              }}
              formatter={(value: number) => [
                `$${value.toLocaleString()}`,
                "Median Price",
              ]}
              labelFormatter={(label: string) => label}
            />
            <Bar dataKey="medianPrice" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.isActive
                      ? "hsl(160 84% 39%)"
                      : "hsl(240 4% 22%)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
