"use client";

/**
 * ParcelMap — renders a Leaflet map with:
 *   1. A tile base layer (OpenStreetMap)
 *   2. The subject parcel boundary from gis-service GET /parcel/:apn
 *   3. A marker at the geocoded address centroid
 *   4. Optional comp markers (with radius circle)
 *
 * IMPORTANT: Leaflet requires dynamic import (no SSR) in Next.js.
 * Use via: const ParcelMap = dynamic(() => import('@/components/gis/ParcelMap'), { ssr: false })
 */
import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

interface ParcelData {
  apn: string;
  address?: string;
  geometry?: GeoJSON.Geometry;
  centroid?: { lat: number; lng: number };
  county?: string;
}

interface CompMarker {
  address: string;
  lat: number;
  lng: number;
  salePrice?: number | null;
}

interface Props {
  apn: string | null;
  county?: string;
  height?: string; // CSS height, default "320px"
  radiusMiles?: number;
  compMarkers?: CompMarker[];
  className?: string;
}

const GIS_URL = process.env.NEXT_PUBLIC_GIS_URL ?? "http://localhost:8085";

export default function ParcelMap({
  apn,
  county,
  height = "320px",
  radiusMiles,
  compMarkers = [],
  className = "",
}: Props) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamic import — Leaflet is browser-only
    let L: typeof import("leaflet");

    async function init() {
      const leaflet = await import("leaflet");
      L = leaflet;

      // Fix default icon paths (common Next.js + Leaflet issue)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(containerRef.current!, {
        zoom: 15,
        center: [46.2098, -118.9869], // Default: Burbank WA
        zoomControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      if (!apn) return;

      // Fetch parcel boundary from gis-service
      const countyParam = county ? `?county=${encodeURIComponent(county)}` : "";
      try {
        const res = await fetch(`${GIS_URL}/parcel/${encodeURIComponent(apn)}${countyParam}`);
        if (res.ok) {
          const data: ParcelData = await res.json();

          // Draw boundary polygon
          if (data.geometry) {
            const geoLayer = L.geoJSON(data.geometry as GeoJSON.GeoJsonObject, {
              style: {
                color: "#1e3a5f",
                weight: 2.5,
                fillColor: "#3b82f6",
                fillOpacity: 0.15,
              },
            });
            geoLayer.addTo(map);
            map.fitBounds(geoLayer.getBounds(), { padding: [24, 24] });
          }

          // Subject marker
          const centroid = data.centroid;
          if (centroid) {
            L.marker([centroid.lat, centroid.lng], {
              title: data.address ?? apn,
            })
              .addTo(map)
              .bindPopup(
                `<b>${data.address ?? apn}</b><br/>APN: ${apn}`,
              );

            // Comp radius circle
            if (radiusMiles) {
              L.circle([centroid.lat, centroid.lng], {
                radius: radiusMiles * 1609.34, // miles → meters
                color: "#6366f1",
                fillColor: "#6366f1",
                fillOpacity: 0.04,
                dashArray: "6 4",
                weight: 1.5,
              }).addTo(map);
            }
          }
        }
      } catch {
        // Silently degrade if GIS service unavailable
      }

      // Comp markers
      for (const comp of compMarkers) {
        const price = comp.salePrice
          ? "$" + comp.salePrice.toLocaleString("en-US")
          : "";
        L.circleMarker([comp.lat, comp.lng], {
          radius: 7,
          color: "#7c3aed",
          fillColor: "#a78bfa",
          fillOpacity: 0.85,
          weight: 1.5,
        })
          .addTo(map)
          .bindPopup(`<b>${comp.address}</b><br/>${price}`);
      }
    }

    init();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apn, county, radiusMiles]);

  return (
    <div className={`relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 ${className}`}>
      {/* Leaflet CSS — loaded inline to avoid Next.js head complications */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div ref={containerRef} style={{ height }} />
      {!apn && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-slate-900/80">
          <p className="text-xs text-slate-400">Enter APN to load parcel map</p>
        </div>
      )}
    </div>
  );
}
