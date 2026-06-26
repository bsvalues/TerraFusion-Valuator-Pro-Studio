/**
 * Washington State county GIS endpoint registry.
 * Each entry maps a county name to its ArcGIS FeatureServer for parcels.
 * Field names vary by county — normalizeParcel() handles mapping.
 *
 * Sources: WA State Geo Services (geoservices.wa.gov), individual county GIS portals.
 * Extend this list as additional counties are confirmed working.
 */

export interface CountyGISConfig {
  /** Human-readable county name */
  name: string;
  /** ArcGIS FeatureServer query URL for parcel layer */
  parcelQueryUrl: string;
  /** Field name for the parcel ID / APN */
  apnField: string;
  /** Field name for situs (street address) */
  addressField: string;
  /** Field name for owner name */
  ownerField: string;
  /** Field name for assessed land value */
  landValueField?: string;
  /** Field name for assessed improvement value */
  improvValueField?: string;
  /** Field name for total assessed value */
  totalValueField?: string;
  /** Field name for acreage */
  acresField?: string;
  /** Field name for year built (improvement) */
  yearBuiltField?: string;
}

/**
 * Known WA State county ArcGIS endpoints.
 * Key = lowercase county name.
 */
export const COUNTY_REGISTRY: Record<string, CountyGISConfig> = {
  // ── Walla Walla County ──────────────────────────────────────────────────────
  "walla walla": {
    name: "Walla Walla",
    parcelQueryUrl:
      "https://services.arcgis.com/jsIt88o09Q0r1j8h/arcgis/rest/services/WallaWalla_Parcels/FeatureServer/0/query",
    apnField: "PARCELID",
    addressField: "SITUS_ADDRESS",
    ownerField: "OWNER_NAME",
    landValueField: "LAND_VALUE",
    improvValueField: "IMPR_VALUE",
    totalValueField: "TOTAL_VALUE",
    acresField: "TOTAL_ACRES",
    yearBuiltField: "YEAR_BUILT",
  },

  // ── Benton County ───────────────────────────────────────────────────────────
  benton: {
    name: "Benton",
    parcelQueryUrl:
      "https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Parcels_and_Assess/FeatureServer/0/query",
    apnField: "PARCELID",
    addressField: "SITUS",
    ownerField: "OWNER",
    landValueField: "LANDVALUE",
    improvValueField: "IMPROVEMENTVALUE",
    totalValueField: "ASSESSEDVALUE",
    acresField: "ACRES",
    yearBuiltField: "YEARBUILT",
  },

  // ── Kittitas County ─────────────────────────────────────────────────────────
  kittitas: {
    name: "Kittitas",
    parcelQueryUrl:
      "https://services.arcgis.com/jsIt88o09Q0r1j8h/arcgis/rest/services/Kittitas_Parcels/FeatureServer/0/query",
    apnField: "PARCELID",
    addressField: "SITUS_ADDR",
    ownerField: "TAXPAYER",
    landValueField: "LAND_VAL",
    improvValueField: "IMP_VAL",
    totalValueField: "TOTAL_VAL",
    acresField: "ACRES",
    yearBuiltField: "YEAR_BUILT",
  },

  // ── Yakima County ───────────────────────────────────────────────────────────
  yakima: {
    name: "Yakima",
    parcelQueryUrl:
      "https://services.arcgis.com/jsIt88o09Q0r1j8h/arcgis/rest/services/Yakima_Parcels/FeatureServer/0/query",
    apnField: "PARCELID",
    addressField: "SITUS",
    ownerField: "OWNER",
    landValueField: "LAND_VALUE",
    improvValueField: "IMPR_VALUE",
    totalValueField: "AV_TOTAL",
    acresField: "ACRES",
  },

  // ── Franklin County ─────────────────────────────────────────────────────────
  franklin: {
    name: "Franklin",
    parcelQueryUrl:
      "https://services.arcgis.com/jsIt88o09Q0r1j8h/arcgis/rest/services/Franklin_Parcels/FeatureServer/0/query",
    apnField: "PARCELID",
    addressField: "SITUS",
    ownerField: "OWNER",
    landValueField: "LAND_VALUE",
    improvValueField: "IMPR_VALUE",
    totalValueField: "TOTAL_VALUE",
    acresField: "ACRES",
  },
};

/**
 * WA State statewide parcel fallback layer (ESRI ArcGIS Online)
 * Use when no county-specific endpoint is configured.
 */
export const WA_STATE_PARCEL_URL =
  "https://services.arcgis.com/jsIt88o09Q0r1j8h/arcgis/rest/services/WA_PARCELS/FeatureServer/0/query";

/** Normalized parcel record returned to callers */
export interface NormalizedParcel {
  apn: string;
  address: string | null;
  owner: string | null;
  county: string;
  acres: number | null;
  yearBuilt: number | null;
  landValue: number | null;
  improvValue: number | null;
  totalValue: number | null;
  /** GeoJSON polygon from ArcGIS rings */
  geometry: GeoJSONPolygon | null;
  source: "county" | "wa-state" | "esri" | "osm";
}

export interface GeoJSONPolygon {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
}

/**
 * Converts an ArcGIS esriGeometryPolygon (rings array) to a GeoJSON Polygon.
 */
export function ringsToGeoJSON(rings: number[][][]): GeoJSONPolygon {
  return { type: "Polygon", coordinates: rings };
}
