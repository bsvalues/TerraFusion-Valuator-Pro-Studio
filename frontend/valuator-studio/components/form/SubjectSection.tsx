"use client";

import { WorkfileSubject, UadQuality, UadCondition, Occupancy } from "@/lib/workfile-types";
import dynamic from "next/dynamic";
import FloodZoneBadge from "@/components/gis/FloodZoneBadge";
import { useState, useEffect } from "react";

// ParcelMap must be loaded client-side only (Leaflet has no SSR)
const ParcelMap = dynamic(() => import("@/components/gis/ParcelMap"), { ssr: false });

interface Props {
  subject: WorkfileSubject;
  onChange: (updated: WorkfileSubject) => void;
}

const UAD_QUALITY: UadQuality[] = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"];
const UAD_CONDITION: UadCondition[] = ["C1", "C2", "C3", "C4", "C5", "C6"];
const OCCUPANCY: { value: Occupancy; label: string }[] = [
  { value: "O", label: "Owner" },
  { value: "T", label: "Tenant" },
  { value: "V", label: "Vacant" },
];

const GIS_URL = process.env.NEXT_PUBLIC_GIS_URL ?? "http://localhost:8085";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "h-7 rounded border border-slate-300 bg-white px-2 text-sm text-slate-900 " +
  "focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100";

const selectCls = inputCls + " cursor-pointer";

export default function SubjectSection({ subject, onChange }: Props) {
  function set<K extends keyof WorkfileSubject>(key: K, value: WorkfileSubject[K]) {
    onChange({ ...subject, [key]: value });
  }

  function numOrNull(s: string) {
    const n = parseFloat(s);
    return s === "" || isNaN(n) ? null : n;
  }

  // Geocode subject address → lat/lng for map + flood badge
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const addr = [subject.address, subject.city, subject.state]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (addr.length < 8) { setCoords(null); return; }

    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${GIS_URL}/geocode?q=${encodeURIComponent(addr)}`,
          { signal: ctrl.signal },
        );
        if (res.ok) {
          const d: { lat: number; lng: number } = await res.json();
          setCoords(d);
        }
      } catch { /* silently degrade */ }
    }, 800); // debounce

    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [subject.address, subject.city, subject.state]);

  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-3 py-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">
          Subject Property
        </h2>
      </div>

      <div className="space-y-4 p-3">
        {/* Location */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-4">
            <Field label="Address">
              <input
                className={inputCls + " w-full"}
                placeholder="Street address"
                value={subject.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
          </div>
          <Field label="City">
            <input className={inputCls} value={subject.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="State">
            <input className={inputCls} value={subject.state} onChange={(e) => set("state", e.target.value)} />
          </Field>
          <Field label="ZIP">
            <input className={inputCls} value={subject.zip} onChange={(e) => set("zip", e.target.value)} />
          </Field>
          <Field label="County">
            <input className={inputCls} value={subject.county} onChange={(e) => set("county", e.target.value)} />
          </Field>
        </div>

        {/* IDs */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Field label="APN">
            <input className={inputCls} value={subject.apn} onChange={(e) => set("apn", e.target.value)} />
          </Field>
          <Field label="Tax Year">
            <input className={inputCls} value={subject.tax_year ?? ""} onChange={(e) => set("tax_year", e.target.value || null)} />
          </Field>
          <Field label="RE Taxes ($)">
            <input type="number" className={inputCls} value={subject.re_taxes ?? ""} onChange={(e) => set("re_taxes", numOrNull(e.target.value))} />
          </Field>
          <Field label="Occupancy">
            <select className={selectCls} value={subject.occupancy ?? ""} onChange={(e) => set("occupancy", (e.target.value || null) as Occupancy | null)}>
              <option value="">—</option>
              {OCCUPANCY.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* GLA / Physical */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
          <Field label="GLA (sqft)">
            <input type="number" className={inputCls} value={subject.gla ?? ""} onChange={(e) => set("gla", numOrNull(e.target.value))} />
          </Field>
          <Field label="Year Built">
            <input type="number" className={inputCls} value={subject.year_built ?? ""} onChange={(e) => set("year_built", numOrNull(e.target.value))} />
          </Field>
          <Field label="Effective Age">
            <input type="number" className={inputCls} value={subject.effective_age ?? ""} onChange={(e) => set("effective_age", numOrNull(e.target.value))} />
          </Field>
          <Field label="Site Area">
            <input className={inputCls} placeholder="e.g. 2.00 ac" value={subject.site_area ?? ""} onChange={(e) => set("site_area", e.target.value || null)} />
          </Field>
          <Field label="Quality (UAD)">
            <select className={selectCls} value={subject.quality ?? ""} onChange={(e) => set("quality", (e.target.value || null) as UadQuality | null)}>
              <option value="">—</option>
              {UAD_QUALITY.map((q) => <option key={q} value={q}>{q}</option>)}
            </select>
          </Field>
          <Field label="Condition (UAD)">
            <select className={selectCls} value={subject.condition ?? ""} onChange={(e) => set("condition", (e.target.value || null) as UadCondition | null)}>
              <option value="">—</option>
              {UAD_CONDITION.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        {/* Rooms */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <Field label="Rooms">
            <input type="number" className={inputCls} value={subject.rooms ?? ""} onChange={(e) => set("rooms", numOrNull(e.target.value))} />
          </Field>
          <Field label="Bedrooms">
            <input type="number" className={inputCls} value={subject.bedrooms ?? ""} onChange={(e) => set("bedrooms", numOrNull(e.target.value))} />
          </Field>
          <Field label="Full Baths">
            <input type="number" className={inputCls} value={subject.baths ?? ""} onChange={(e) => set("baths", numOrNull(e.target.value))} />
          </Field>
          <Field label="Half Baths">
            <input type="number" className={inputCls} value={subject.half_baths ?? ""} onChange={(e) => set("half_baths", numOrNull(e.target.value))} />
          </Field>
          <Field label="Bsmt Area (sqft)">
            <input type="number" className={inputCls} value={subject.bsmt_area ?? ""} onChange={(e) => set("bsmt_area", numOrNull(e.target.value))} />
          </Field>
          <Field label="Bsmt Finished">
            <input type="number" className={inputCls} value={subject.bsmt_finished ?? ""} onChange={(e) => set("bsmt_finished", numOrNull(e.target.value))} />
          </Field>
        </div>

        {/* View / Legal */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Field label="View">
            <input className={inputCls} placeholder="e.g. N;Res; or rural / non-waterfront" value={subject.view ?? ""} onChange={(e) => set("view", e.target.value || null)} />
          </Field>
          <Field label="Legal Description">
            <input className={inputCls} value={subject.legal_desc ?? ""} onChange={(e) => set("legal_desc", e.target.value || null)} />
          </Field>
        </div>

        {/* Prior sale */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Prior Sale Price ($)">
            <input type="number" className={inputCls} value={subject.sale_price ?? ""} onChange={(e) => set("sale_price", numOrNull(e.target.value))} />
          </Field>
          <Field label="Prior Sale Date">
            <input className={inputCls} placeholder="mm/dd/yyyy" value={subject.sale_date ?? ""} onChange={(e) => set("sale_date", e.target.value || null)} />
          </Field>
        </div>

        {/* GIS panel */}
        {(subject.apn || coords) && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Location
              </span>
              <FloodZoneBadge lat={coords?.lat ?? null} lng={coords?.lng ?? null} />
              {coords && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </span>
              )}
            </div>
            <ParcelMap
              apn={subject.apn || null}
              county={subject.county || undefined}
              height="260px"
            />
          </div>
        )}
      </div>
    </section>
  );
}
