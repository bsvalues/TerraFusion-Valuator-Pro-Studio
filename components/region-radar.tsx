"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { analyzeMarket, AVAILABLE_REGIONS } from "@/lib/engines";
import { useMemo } from "react";

interface RegionRadarProps {
  activeRegion: string | null;
}

export function RegionRadar({ activeRegion }: RegionRadarProps) {
  const radarData = useMemo(() => {
    const allMarkets = AVAILABLE_REGIONS.map((r) => ({
      name: r,
      ...analyzeMarket(r),
    }));

    // Normalize each dimension to 0-100 scale
    const maxMedian = Math.max(...allMarkets.map((m) => m.medianPrice));
    const maxPsf = Math.max(...allMarkets.map((m) => m.averagePricePerSqft));

    return [
      {
        dimension: "Median Price",
        ...Object.fromEntries(
          allMarkets.map((m) => [
            m.name,
            Math.round((m.medianPrice / maxMedian) * 100),
          ])
        ),
      },
      {
        dimension: "Price/SqFt",
        ...Object.fromEntries(
          allMarkets.map((m) => [
            m.name,
            Math.round((m.averagePricePerSqft / maxPsf) * 100),
          ])
        ),
      },
      {
        dimension: "Growth",
        ...Object.fromEntries(
          allMarkets.map((m) => [
            m.name,
            m.marketTrend === "Rising"
              ? 90
              : m.marketTrend === "Stable"
                ? 55
                : 20,
          ])
        ),
      },
      {
        dimension: "Stability",
        ...Object.fromEntries(
          allMarkets.map((m) => [
            m.name,
            m.marketTrend === "Stable"
              ? 95
              : m.marketTrend === "Rising"
                ? 60
                : 30,
          ])
        ),
      },
      {
        dimension: "Affordability",
        ...Object.fromEntries(
          allMarkets.map((m) => [
            m.name,
            Math.round(100 - (m.medianPrice / maxMedian) * 100 + 10),
          ])
        ),
      },
    ];
  }, []);

  const regionColors: Record<string, string> = {
    Downtown: "hsl(160 84% 39%)",
    Suburbs: "hsl(38 92% 50%)",
    "Urban Core": "hsl(217 91% 60%)",
    "Rural County": "hsl(280 65% 60%)",
    "Waterfront District": "hsl(0 72% 51%)",
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
      <h4 className="font-mono text-xs font-medium tracking-wider text-foreground">
        MULTI-REGION ANALYSIS
      </h4>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} outerRadius="70%">
            <PolarGrid stroke="hsl(240 4% 16%)" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{
                fill: "hsl(240 4% 55%)",
                fontSize: 9,
                fontFamily: "var(--font-geist-mono)",
              }}
            />
            <PolarRadiusAxis
              tick={false}
              axisLine={false}
              domain={[0, 100]}
            />
            {AVAILABLE_REGIONS.map((region) => (
              <Radar
                key={region}
                name={region}
                dataKey={region}
                stroke={regionColors[region] ?? "hsl(240 4% 55%)"}
                fill={regionColors[region] ?? "hsl(240 4% 55%)"}
                fillOpacity={activeRegion === region ? 0.25 : 0.05}
                strokeWidth={activeRegion === region ? 2 : 0.8}
                strokeOpacity={activeRegion === region ? 1 : 0.4}
              />
            ))}
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(240 5% 8%)",
                border: "1px solid hsl(240 4% 16%)",
                borderRadius: "8px",
                fontFamily: "var(--font-geist-mono)",
                fontSize: "10px",
                color: "hsl(0 0% 93%)",
              }}
            />
            <Legend
              wrapperStyle={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: "9px",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
