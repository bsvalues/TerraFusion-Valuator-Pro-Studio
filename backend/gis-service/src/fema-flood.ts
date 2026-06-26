/**
 * FEMA NFHL (National Flood Hazard Layer) flood zone service.
 *
 * Primary:  FEMA ArcGIS WMS GetFeatureInfo over the NFHL REST endpoint
 * Fallback: Static GeoJSON (seeded from Tuttle field sheet)
 *           zone=C, map panel 5301940275B
 *
 * NFHL REST Endpoint:
 *   https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer
 * Layer 28 = FIRM Panel, Layer 16 = Flood Zones (SFHA + non-SFHA)
 */

import fetch from "node-fetch";

const NFHL_BASE =
  "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer";

const FLOOD_ZONE_LAYER = 28;  // Flood Hazard Zones
const TIMEOUT_MS = 10_000;

export interface FloodZoneResult {
  /** FEMA flood zone designation, e.g. "A", "AE", "X", "C" */
  zone: string;
  /** Sub-type, e.g. "0.2 PCT ANNUAL CHANCE FLOOD HAZARD" */
  zoneSubtype: string | null;
  /** Whether this is a Special Flood Hazard Area (100-year flood) */
  sfha: boolean;
  /** FIRM panel number, e.g. "5301940275B" */
  firmPanel: string | null;
  /** Effective date of the FIRM panel */
  effectiveDate: string | null;
  source: "nfhl-live" | "static-fallback";
}

/**
 * Static fallback for offline / Tauri desktop mode.
 * Seeded from the Tuttle field sheet (123 Tuttle Lane area, Walla Walla County).
 * Zone C = outside flood hazard area, no SFHA.
 */
const STATIC_FALLBACK: FloodZoneResult = {
  zone: "X",
  zoneSubtype: "0.2 PCT ANNUAL CHANCE FLOOD HAZARD",
  sfha: false,
  firmPanel: "5301940275B",
  effectiveDate: "2010-09-24",
  source: "static-fallback",
};

async function fetchWithTimeout(url: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal as any });
    if (!res.ok) return null;
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Query the NFHL REST service for flood zone at a specific lat/lng.
 *
 * Uses `identify` operation against the NFHL MapServer, which returns the
 * flood zone polygon(s) at a given coordinate.
 */
async function queryNFHLLive(lat: number, lng: number): Promise<FloodZoneResult | null> {
  // We use the `identify` endpoint with a tiny envelope around the coord
  const delta = 0.0001;
  const params = new URLSearchParams({
    geometry: JSON.stringify({
      xmin: lng - delta,
      ymin: lat - delta,
      xmax: lng + delta,
      ymax: lat + delta,
    }),
    geometryType: "esriGeometryEnvelope",
    sr: "4326",
    layers: `all:${FLOOD_ZONE_LAYER}`,
    tolerance: "2",
    mapExtent: `${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}`,
    imageDisplay: "800,800,96",
    returnGeometry: "false",
    f: "json",
  });

  const url = `${NFHL_BASE}/identify?${params}`;

  try {
    const data = await fetchWithTimeout(url);
    if (!data?.results?.length) return null;

    const r = data.results[0].attributes ?? {};
    const zone = r.FLD_ZONE ?? r.ZONE ?? "";
    const sfha = Boolean(r.SFHA_TF === "T" || r.SFHA === "1" || /^A|^V/.test(zone));

    return {
      zone: zone || "UNKNOWN",
      zoneSubtype: r.ZONE_SUBTY ?? null,
      sfha,
      firmPanel: r.FIRM_PANEL ?? r.PANEL ?? null,
      effectiveDate: r.EFF_DATE ?? null,
      source: "nfhl-live",
    };
  } catch {
    return null;
  }
}

/**
 * Look up flood zone at a lat/lng.
 * Returns live NFHL data if reachable, otherwise returns the static fallback.
 */
export async function getFloodZone(lat: number, lng: number): Promise<FloodZoneResult> {
  const liveResult = await queryNFHLLive(lat, lng);
  if (liveResult) return liveResult;
  return STATIC_FALLBACK;
}

/**
 * Look up flood zone for a parcel centroid.
 * @param centroid  [lng, lat] — standard GeoJSON coordinate order
 */
export async function getFloodZoneForCentroid(
  centroid: [number, number]
): Promise<FloodZoneResult> {
  const [lng, lat] = centroid;
  return getFloodZone(lat, lng);
}
