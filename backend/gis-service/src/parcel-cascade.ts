/**
 * Parcel lookup cascade (three tiers):
 *   1. County-specific ArcGIS FeatureServer (fast, authoritative)
 *   2. WA State statewide parcel layer on ESRI ArcGIS Online (wide coverage)
 *   3. OSM Nominatim geocode (geometry only, no assessor data)
 *
 * Callers receive a normalized NormalizedParcel regardless of which tier hit.
 */

import fetch, { Response } from "node-fetch";
import {
  COUNTY_REGISTRY,
  WA_STATE_PARCEL_URL,
  CountyGISConfig,
  NormalizedParcel,
  GeoJSONPolygon,
  ringsToGeoJSON,
} from "./county-registry.js";

const TIMEOUT_MS = 8_000;

// ── Internal helpers ───────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal as any });
  } finally {
    clearTimeout(timer);
  }
}

function buildArcGISQuery(field: string, value: string, extraParams: Record<string, string> = {}): URLSearchParams {
  const params = new URLSearchParams({
    where: `${field}='${value.replace(/'/g, "''")}'`,   // basic SQL injection guard
    outFields: "*",
    returnGeometry: "true",
    f: "json",
    ...extraParams,
  });
  return params;
}

function normalizeArcGISFeature(
  feature: any,
  config: CountyGISConfig,
  tier: NormalizedParcel["source"]
): NormalizedParcel {
  const att = feature.attributes ?? {};
  const rings: number[][][] | undefined = feature.geometry?.rings;

  let geometry: GeoJSONPolygon | null = null;
  if (rings && rings.length > 0) {
    geometry = ringsToGeoJSON(rings);
  }

  return {
    apn: String(att[config.apnField] ?? ""),
    address: att[config.addressField] ?? null,
    owner: att[config.ownerField] ?? null,
    county: config.name,
    acres: att[config.acresField ?? ""] ?? null,
    yearBuilt: att[config.yearBuiltField ?? ""] ?? null,
    landValue: att[config.landValueField ?? ""] ?? null,
    improvValue: att[config.improvValueField ?? ""] ?? null,
    totalValue: att[config.totalValueField ?? ""] ?? null,
    geometry,
    source: tier,
  };
}

// ── Tier 1: County-specific endpoint ─────────────────────────────────────────

async function queryCountyTier(
  apn: string,
  config: CountyGISConfig
): Promise<NormalizedParcel | null> {
  try {
    const params = buildArcGISQuery(config.apnField, apn);
    const url = `${config.parcelQueryUrl}?${params}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = await res.json() as any;
    if (!data.features?.length) return null;
    return normalizeArcGISFeature(data.features[0], config, "county");
  } catch {
    return null;
  }
}

// ── Tier 2: WA State statewide parcel layer ───────────────────────────────────

/** Field names in the WA State statewide layer */
const WA_STATE_CONFIG: CountyGISConfig = {
  name: "WA State",
  parcelQueryUrl: WA_STATE_PARCEL_URL,
  apnField: "PARCELID",
  addressField: "SITUS_ADDRESS",
  ownerField: "OWNER_NAME",
  landValueField: "LAND_VALUE",
  improvValueField: "IMPR_VALUE",
  totalValueField: "TOTAL_VALUE",
  acresField: "ACRES",
  yearBuiltField: "YEAR_BUILT",
};

async function queryWAStateTier(apn: string): Promise<NormalizedParcel | null> {
  try {
    const params = buildArcGISQuery(WA_STATE_CONFIG.apnField, apn);
    const url = `${WA_STATE_PARCEL_URL}?${params}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = await res.json() as any;
    if (!data.features?.length) return null;
    return normalizeArcGISFeature(data.features[0], WA_STATE_CONFIG, "wa-state");
  } catch {
    return null;
  }
}

// ── Tier 3: OSM Nominatim (geometry + rough location only) ───────────────────

async function queryOSMTier(address: string): Promise<NormalizedParcel | null> {
  try {
    const encoded = encodeURIComponent(address + ", Washington State, USA");
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=geojson&polygon_geojson=1&limit=1`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = await res.json() as any;
    const feature = data.features?.[0];
    if (!feature) return null;

    const geom = feature.geometry;
    let geometry: GeoJSONPolygon | null = null;
    if (geom.type === "Polygon") {
      geometry = { type: "Polygon", coordinates: geom.coordinates };
    } else if (geom.type === "MultiPolygon") {
      geometry = { type: "MultiPolygon", coordinates: geom.coordinates };
    }

    return {
      apn: "",
      address: feature.properties?.display_name ?? address,
      owner: null,
      county: "unknown",
      acres: null,
      yearBuilt: null,
      landValue: null,
      improvValue: null,
      totalValue: null,
      geometry,
      source: "osm",
    };
  } catch {
    return null;
  }
}

// ── Address search within county ──────────────────────────────────────────────

async function searchCountyByAddress(
  address: string,
  config: CountyGISConfig
): Promise<NormalizedParcel[]> {
  try {
    const safeAddr = address.replace(/'/g, "''");
    const params = new URLSearchParams({
      where: `${config.addressField} LIKE '%${safeAddr}%'`,
      outFields: "*",
      returnGeometry: "true",
      f: "json",
      resultRecordCount: "10",
    });
    const url = `${config.parcelQueryUrl}?${params}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    const data = await res.json() as any;
    return (data.features ?? []).map((f: any) =>
      normalizeArcGISFeature(f, config, "county")
    );
  } catch {
    return [];
  }
}

// ── Radius search ─────────────────────────────────────────────────────────────

/**
 * Return parcels within `radiusMiles` of a lat/lng point using ESRI envelope filter.
 * Uses the WA State tier for cross-county radius queries.
 */
async function radiusSearch(
  lat: number,
  lng: number,
  radiusMiles: number,
  countyName?: string
): Promise<NormalizedParcel[]> {
  const deg = radiusMiles / 69.0;  // rough degrees per mile
  const envelope = {
    xmin: lng - deg,
    ymin: lat - deg,
    xmax: lng + deg,
    ymax: lat + deg,
  };

  const config = countyName
    ? COUNTY_REGISTRY[countyName.toLowerCase()] ?? WA_STATE_CONFIG
    : WA_STATE_CONFIG;

  try {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: "*",
      returnGeometry: "true",
      f: "json",
      geometry: JSON.stringify(envelope),
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      resultRecordCount: "25",
    });
    const url = `${config.parcelQueryUrl}?${params}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    const data = await res.json() as any;
    return (data.features ?? []).map((f: any) =>
      normalizeArcGISFeature(f, config, config === WA_STATE_CONFIG ? "wa-state" : "county")
    );
  } catch {
    return [];
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Look up a parcel by APN, cascading through available tiers.
 * @param apn   Parcel number / assessor parcel number
 * @param county  Optional county name hint to try first
 */
export async function lookupParcelByAPN(
  apn: string,
  county?: string
): Promise<NormalizedParcel | null> {
  // Tier 1 — county-specific if known
  if (county) {
    const config = COUNTY_REGISTRY[county.toLowerCase()];
    if (config) {
      const result = await queryCountyTier(apn, config);
      if (result) return result;
    }
  }

  // Tier 1b — try all known counties (parallel, first-wins)
  const countyPromises = Object.values(COUNTY_REGISTRY).map((c) =>
    queryCountyTier(apn, c)
  );
  const countyResults = await Promise.all(countyPromises);
  for (const r of countyResults) {
    if (r) return r;
  }

  // Tier 2 — WA State statewide layer
  const waResult = await queryWAStateTier(apn);
  if (waResult) return waResult;

  return null;
}

/**
 * Search parcels by address string within a county (or across WA State).
 */
export async function searchParcelsByAddress(
  address: string,
  county?: string
): Promise<NormalizedParcel[]> {
  if (county) {
    const config = COUNTY_REGISTRY[county.toLowerCase()];
    if (config) {
      const results = await searchCountyByAddress(address, config);
      if (results.length) return results;
    }
  }

  // WA State layer address search
  try {
    const safeAddr = address.replace(/'/g, "''");
    const params = new URLSearchParams({
      where: `SITUS_ADDRESS LIKE '%${safeAddr}%'`,
      outFields: "*",
      returnGeometry: "true",
      f: "json",
      resultRecordCount: "10",
    });
    const url = `${WA_STATE_PARCEL_URL}?${params}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    const data = await res.json() as any;
    return (data.features ?? []).map((f: any) =>
      normalizeArcGISFeature(f, WA_STATE_CONFIG, "wa-state")
    );
  } catch {
    return [];
  }
}

/**
 * Return parcels within a radius of a coordinate, optionally pinned to a county.
 */
export async function getParcelsInRadius(
  lat: number,
  lng: number,
  radiusMiles: number,
  county?: string
): Promise<NormalizedParcel[]> {
  return radiusSearch(lat, lng, radiusMiles, county);
}

/**
 * Geocode an address to a point via OSM Nominatim (fallback / no-cost).
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; display: string } | null> {
  try {
    const encoded = encodeURIComponent(address + ", Washington State, USA");
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = await res.json() as any;
    if (!data.length) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      display: data[0].display_name,
    };
  } catch {
    return null;
  }
}
