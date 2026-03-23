"use client";

/**
 * FloodZoneBadge — fetches FEMA flood zone for a lat/lng from gis-service
 * and renders a small inline badge.
 *
 * Props:
 *   lat / lng  — coordinates (from geocode or parcel centroid)
 *   className  — optional extra classes
 */
import { useEffect, useState } from "react";

interface FloodResponse {
  zone: string;
  panel: string | null;
  source: "live" | "fallback";
}

interface Props {
  lat: number | null;
  lng: number | null;
  className?: string;
}

const GIS_URL =
  process.env.NEXT_PUBLIC_GIS_URL ?? "http://localhost:8085";

// Zone color coding — green = minimal, yellow = moderate, red = high
function zoneStyle(zone: string): string {
  const z = zone.toUpperCase();
  if (z.startsWith("X") || z === "C" || z === "B") {
    return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300";
  }
  if (z.startsWith("AE") || z.startsWith("A ") || z === "A" || z.startsWith("VE")) {
    return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300";
  }
  if (z.startsWith("A") || z.startsWith("V")) {
    return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300";
  }
  return "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400";
}

function zoneLabel(zone: string, source: "live" | "fallback"): string {
  return `FEMA ${zone}${source === "fallback" ? " (offline)" : ""}`;
}

export default function FloodZoneBadge({ lat, lng, className = "" }: Props) {
  const [data, setData] = useState<FloodResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat == null || lng == null) return;
    setLoading(true);
    setError(null);
    fetch(`${GIS_URL}/flood?lat=${lat}&lng=${lng}`)
      .then((r) => {
        if (!r.ok) throw new Error(`GIS ${r.status}`);
        return r.json() as Promise<FloodResponse>;
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, [lat, lng]);

  if (lat == null || lng == null) return null;

  if (loading) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium border-slate-200 bg-slate-50 text-slate-400 ${className}`}
      >
        <span className="h-2 w-2 animate-spin rounded-full border border-slate-400 border-t-transparent" />
        FEMA…
      </span>
    );
  }

  if (error || !data) {
    return (
      <span
        className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium border-slate-200 bg-slate-50 text-slate-400 ${className}`}
      >
        FEMA N/A
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${zoneStyle(data.zone)} ${className}`}
      title={data.panel ? `NFHL Panel ${data.panel}` : undefined}
    >
      {zoneLabel(data.zone, data.source)}
    </span>
  );
}
