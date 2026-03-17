"use client";

import { useState } from "react";
import type { Property, PropertyType, PropertyCondition } from "@/lib/types";
import { AVAILABLE_REGIONS } from "@/lib/engines";
import { Building2, MapPin, Ruler, Calendar, Layers, Home, DollarSign } from "lucide-react";

interface PropertyFormProps {
  onSubmit: (property: Property, region: string) => void;
  isLoading?: boolean;
}

const PROPERTY_TYPES: { value: PropertyType; label: string; icon: string }[] = [
  { value: "single_family",      label: "Single Family",    icon: "🏠" },
  { value: "condo",              label: "Condominium",      icon: "🏢" },
  { value: "multi_family_2_4",   label: "2-4 Family",       icon: "🏘" },
  { value: "multi_family_5plus", label: "5+ Multi-Family",  icon: "🏗" },
  { value: "office",             label: "Office",           icon: "🏛" },
  { value: "retail",             label: "Retail",           icon: "🏪" },
  { value: "industrial",         label: "Industrial",       icon: "🏭" },
  { value: "mixed_use",          label: "Mixed Use",        icon: "🏙" },
  { value: "hospitality",        label: "Hospitality",      icon: "🏨" },
  { value: "land",               label: "Land",             icon: "🌿" },
  { value: "special_purpose",    label: "Special Purpose",  icon: "⭐" },
];

const CONDITIONS: PropertyCondition[] = ["Excellent", "Good", "Average", "Fair", "Poor"];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const isResidential = (t: PropertyType) =>
  ["single_family", "condo", "multi_family_2_4"].includes(t);
const isCommercial = (t: PropertyType) =>
  ["office", "retail", "industrial", "mixed_use", "hospitality", "special_purpose"].includes(t);
const isMultiFamily = (t: PropertyType) =>
  ["multi_family_2_4", "multi_family_5plus"].includes(t);
const isLand = (t: PropertyType) => t === "land";

const inputCls =
  "rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary w-full";
const labelCls = "font-mono text-[10px] tracking-wider text-muted-foreground";
const sectionCls = "rounded-lg border border-border/60 bg-card/50 p-4 mb-4";
const sectionTitleCls = "flex items-center gap-2 font-mono text-[10px] font-semibold tracking-widest text-primary mb-3";

export function PropertyForm({ onSubmit, isLoading }: PropertyFormProps) {
  const [property, setProperty] = useState<Property>({
    id: "",
    address: "",
    city: "",
    state: "TX",
    zip: "",
    county: "",
    propertyType: "single_family",
    condition: "Average",
    squareFeet: 2000,
    bedrooms: 3,
    bathrooms: 2,
  });
  const [region, setRegion] = useState("Downtown");

  const set = <K extends keyof Property>(key: K, val: Property[K]) =>
    setProperty((p) => ({ ...p, [key]: val }));

  function generateId() {
    const prefix = "TF";
    const num = Math.floor(Math.random() * 90000) + 10000;
    return `${prefix}-${num}`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const prop: Property = {
      ...property,
      id: property.id || generateId(),
    };
    onSubmit(prop, region);
  }

  const pType = property.propertyType;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-0">

      {/* ── Order / File Info ── */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>
          <Layers className="h-3.5 w-3.5" />
          ORDER / FILE INFORMATION
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>FILE / ORDER NO.</label>
            <input
              type="text"
              placeholder="Auto-generated"
              value={property.id}
              onChange={(e) => set("id", e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>EFFECTIVE DATE</label>
            <input
              type="date"
              value={new Date().toISOString().split("T")[0]}
              readOnly
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>MARKET REGION</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className={inputCls}
            >
              {AVAILABLE_REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* ── Subject Property Location ── */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>
          <MapPin className="h-3.5 w-3.5" />
          SUBJECT PROPERTY LOCATION
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelCls}>STREET ADDRESS *</label>
            <input
              type="text"
              required
              placeholder="123 Main Street"
              value={property.address}
              onChange={(e) => set("address", e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>CITY *</label>
            <input
              type="text"
              required
              placeholder="Austin"
              value={property.city}
              onChange={(e) => set("city", e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>COUNTY *</label>
            <input
              type="text"
              required
              placeholder="Travis"
              value={property.county}
              onChange={(e) => set("county", e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>STATE *</label>
            <select
              required
              value={property.state}
              onChange={(e) => set("state", e.target.value)}
              className={inputCls}
            >
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>ZIP CODE *</label>
            <input
              type="text"
              required
              placeholder="78701"
              value={property.zip}
              onChange={(e) => set("zip", e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>LEGAL DESCRIPTION</label>
            <input
              type="text"
              placeholder="Lot 12, Block 3, Subdivision..."
              value={property.legalDescription || ""}
              onChange={(e) => set("legalDescription", e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* ── Property Classification ── */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>
          <Building2 className="h-3.5 w-3.5" />
          PROPERTY CLASSIFICATION
        </p>
        <div className="mb-3">
          <label className={labelCls + " mb-2 block"}>PROPERTY TYPE *</label>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
            {PROPERTY_TYPES.map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => set("propertyType", value)}
                className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2 font-mono text-[9px] tracking-wider transition-colors ${
                  pType === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                <span className="text-base">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>CONDITION *</label>
            <select
              value={property.condition}
              onChange={(e) => set("condition", e.target.value as PropertyCondition)}
              className={inputCls}
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>ZONING</label>
            <input
              type="text"
              placeholder="R-1, C-2, I-1..."
              value={property.zoning || ""}
              onChange={(e) => set("zoning", e.target.value)}
              className={inputCls}
            />
          </div>

        </div>
      </div>

      {/* ── Physical Characteristics ── */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>
          <Ruler className="h-3.5 w-3.5" />
          PHYSICAL CHARACTERISTICS
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{isCommercial(pType) ? "RENTABLE AREA (SQFT)" : "GLA (SQFT) *"}</label>
            <input
              type="number"
              required
              min={1}
              value={property.squareFeet}
              onChange={(e) => set("squareFeet", Number(e.target.value))}
              className={inputCls}
            />
          </div>
          {!isLand(pType) && (
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>YEAR BUILT</label>
              <input
                type="number"
                min={1800}
                max={new Date().getFullYear()}
                placeholder="2005"
                value={property.yearBuilt || ""}
                onChange={(e) => set("yearBuilt", e.target.value ? Number(e.target.value) : undefined)}
                className={inputCls}
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>LOT SIZE (ACRES)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              placeholder="0.25"
              value={property.landAreaAcres || ""}
              onChange={(e) => set("landAreaAcres", e.target.value ? Number(e.target.value) : undefined)}
              className={inputCls}
            />
          </div>
          {isResidential(pType) && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>BEDROOMS</label>
                <input
                  type="number"
                  min={0}
                  value={property.bedrooms ?? ""}
                  onChange={(e) => set("bedrooms", e.target.value ? Number(e.target.value) : undefined)}
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>BATHROOMS</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={property.bathrooms ?? ""}
                  onChange={(e) => set("bathrooms", e.target.value ? Number(e.target.value) : undefined)}
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>GARAGE SPACES</label>
                <input
                  type="number"
                  min={0}
                  placeholder="2"
                  value={property.garageSpaces || ""}
                  onChange={(e) => set("garageSpaces", e.target.value ? Number(e.target.value) : undefined)}
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>STORIES</label>
                <input
                  type="number"
                  min={1}
                  step={0.5}
                  placeholder="2"
                  value={property.stories || ""}
                  onChange={(e) => set("stories", e.target.value ? Number(e.target.value) : undefined)}
                  className={inputCls}
                />
              </div>
            </>
          )}
          {isCommercial(pType) && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>NO. OF UNITS</label>
                <input
                  type="number"
                  min={1}
                  placeholder="1"
                  value={property.numberOfUnits || ""}
                  onChange={(e) => set("numberOfUnits", e.target.value ? Number(e.target.value) : undefined)}
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>NO. OF FLOORS</label>
                <input
                  type="number"
                  min={1}
                  placeholder="3"
                  value={property.stories || ""}
                  onChange={(e) => set("stories", e.target.value ? Number(e.target.value) : undefined)}
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>PARKING SPACES</label>
                <input
                  type="number"
                  min={0}
                  placeholder="50"
                  value={property.garageSpaces || ""}
                  onChange={(e) => set("garageSpaces", e.target.value ? Number(e.target.value) : undefined)}
                  className={inputCls}
                />
              </div>
            </>
          )}
          {isMultiFamily(pType) && (
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>NO. OF UNITS</label>
              <input
                type="number"
                min={2}
                placeholder="4"
                value={property.numberOfUnits || ""}
                onChange={(e) => set("numberOfUnits", e.target.value ? Number(e.target.value) : undefined)}
                className={inputCls}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Sale / Financial Data ── */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>
          <DollarSign className="h-3.5 w-3.5" />
          SALE / FINANCIAL DATA (OPTIONAL)
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>LAST SALE PRICE</label>
            <input
              type="number"
              min={0}
              placeholder="450000"
              value={property.lastSalePrice || ""}
              onChange={(e) => set("lastSalePrice", e.target.value ? Number(e.target.value) : undefined)}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>LAST SALE DATE</label>
            <input
              type="date"
              value={property.lastSaleDate || ""}
              onChange={(e) => set("lastSaleDate", e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>ASSESSED VALUE</label>
            <input
              type="number"
              min={0}
              placeholder="420000"
              value={property.assessedValue || ""}
              onChange={(e) => set("assessedValue", e.target.value ? Number(e.target.value) : undefined)}
              className={inputCls}
            />
          </div>

        </div>
      </div>

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 font-mono text-xs font-semibold tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            EXECUTING VALUATION PIPELINE...
          </>
        ) : (
          "RUN VALUATION ANALYSIS"
        )}
      </button>
    </form>
  );
}
