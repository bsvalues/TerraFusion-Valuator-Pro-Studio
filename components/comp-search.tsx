"use client";

import { useState, useCallback } from "react";
import {
  Search, MapPin, Calendar, Ruler, DollarSign, Filter,
  Plus, Check, SlidersHorizontal, ArrowUpDown, Star, X, ChevronDown, ChevronUp
} from "lucide-react";

export interface CompSearchResult {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  salePrice: number;
  saleDate: string;
  gla: number;
  pricePerSqft: number;
  yearBuilt: number;
  bedrooms?: number;
  bathrooms?: number;
  condition: string;
  propertyType: string;
  daysOnMarket: number;
  distanceMiles: number;
  lotSize: number;
  garage?: number;
  stories?: number;
  // Commercial fields
  rentableArea?: number;
  occupancyRate?: number;
  capRate?: number;
  noi?: number;
  source: string;
  mlsNumber?: string;
  verified: boolean;
  selected?: boolean;
}

interface CompSearchProps {
  subjectAddress?: string;
  subjectCity?: string;
  subjectState?: string;
  subjectGla?: number;
  subjectPropertyType?: string;
  subjectYearBuilt?: number;
  onAddComp?: (comp: CompSearchResult) => void;
  selectedComps?: CompSearchResult[];
}

const PROPERTY_TYPES = [
  "Single Family", "Condominium", "2-4 Family", "5+ Multi-Family",
  "Office", "Retail", "Industrial", "Mixed Use", "Hospitality", "Land", "Special Purpose"
];

const CONDITIONS = ["Excellent", "Good", "Average", "Fair", "Poor"];

// Generate realistic mock comps based on subject property
function generateMockComps(
  city: string,
  state: string,
  gla: number,
  propertyType: string,
  yearBuilt: number,
  count: number = 20
): CompSearchResult[] {
  const streets = [
    "Oak Ave", "Elm St", "Pine Rd", "Maple Dr", "Cedar Ln", "Birch Blvd",
    "Walnut Way", "Willow Ct", "Spruce St", "Ash Ave", "Hickory Ln", "Poplar Dr",
    "Sycamore Rd", "Magnolia Blvd", "Pecan St", "Cypress Ave", "Redwood Dr", "Juniper Ct",
    "Chestnut Ln", "Cottonwood Way"
  ];
  const conditions = ["Excellent", "Good", "Average", "Fair"];
  const sources = ["MLS", "CoStar", "LoopNet", "Public Records", "CREXI"];

  const basePrice = propertyType === "Single Family" ? 450000 :
    propertyType === "Office" ? 850000 :
    propertyType === "Retail" ? 1200000 :
    propertyType === "Industrial" ? 2500000 : 600000;

  const basePsf = basePrice / gla;

  return Array.from({ length: count }, (_, i) => {
    const glaVariance = gla * (0.7 + Math.random() * 0.6);
    const psfVariance = basePsf * (0.8 + Math.random() * 0.4);
    const salePrice = Math.round(glaVariance * psfVariance / 1000) * 1000;
    const daysAgo = Math.floor(Math.random() * 365);
    const saleDate = new Date(Date.now() - daysAgo * 86400000).toISOString().split("T")[0];
    const num = Math.floor(Math.random() * 9000) + 100;
    const street = streets[i % streets.length];
    const distance = Math.round((0.1 + Math.random() * 2.5) * 10) / 10;
    const yearVariance = yearBuilt + Math.floor(Math.random() * 20) - 10;

    return {
      id: `COMP-${Date.now()}-${i}`,
      address: `${num} ${street}`,
      city,
      state,
      zip: "78701",
      county: "Travis",
      salePrice,
      saleDate,
      gla: Math.round(glaVariance),
      pricePerSqft: Math.round(psfVariance),
      yearBuilt: Math.max(1950, yearVariance),
      bedrooms: propertyType === "Single Family" ? Math.floor(Math.random() * 3) + 2 : undefined,
      bathrooms: propertyType === "Single Family" ? Math.floor(Math.random() * 2) + 1 : undefined,
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      propertyType,
      daysOnMarket: Math.floor(Math.random() * 90) + 1,
      distanceMiles: distance,
      lotSize: Math.round((0.1 + Math.random() * 0.5) * 100) / 100,
      garage: propertyType === "Single Family" ? Math.floor(Math.random() * 3) : undefined,
      stories: Math.floor(Math.random() * 3) + 1,
      source: sources[Math.floor(Math.random() * sources.length)],
      mlsNumber: `MLS${Math.floor(Math.random() * 9000000) + 1000000}`,
      verified: Math.random() > 0.2,
      selected: false,
    };
  });
}

export function CompSearch({
  subjectAddress = "123 Main Street",
  subjectCity = "Austin",
  subjectState = "TX",
  subjectGla = 2000,
  subjectPropertyType = "Single Family",
  subjectYearBuilt = 2000,
  onAddComp,
  selectedComps = [],
}: CompSearchProps) {
  const [results, setResults] = useState<CompSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedComp, setExpandedComp] = useState<string | null>(null);

  // Filters
  const [radiusMiles, setRadiusMiles] = useState(1.0);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [glaMin, setGlaMin] = useState(Math.round(subjectGla * 0.8));
  const [glaMax, setGlaMax] = useState(Math.round(subjectGla * 1.2));
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([subjectPropertyType]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"distance" | "date" | "price" | "gla" | "psf">("distance");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);

  const toggleType = (t: string) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const toggleCondition = (c: string) => {
    setConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 800));

    let comps = generateMockComps(
      subjectCity, subjectState, subjectGla, subjectPropertyType, subjectYearBuilt, 25
    );

    // Apply filters
    comps = comps.filter((c) => {
      if (c.distanceMiles > radiusMiles) return false;
      if (c.saleDate < dateFrom || c.saleDate > dateTo) return false;
      if (c.gla < glaMin || c.gla > glaMax) return false;
      if (priceMin > 0 && c.salePrice < priceMin) return false;
      if (priceMax > 0 && c.salePrice > priceMax) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(c.propertyType)) return false;
      if (conditions.length > 0 && !conditions.includes(c.condition)) return false;
      return true;
    });

    // Sort
    comps.sort((a, b) => {
      let va = 0, vb = 0;
      if (sortBy === "distance") { va = a.distanceMiles; vb = b.distanceMiles; }
      else if (sortBy === "date") { va = new Date(a.saleDate).getTime(); vb = new Date(b.saleDate).getTime(); }
      else if (sortBy === "price") { va = a.salePrice; vb = b.salePrice; }
      else if (sortBy === "gla") { va = a.gla; vb = b.gla; }
      else if (sortBy === "psf") { va = a.pricePerSqft; vb = b.pricePerSqft; }
      return sortDir === "asc" ? va - vb : vb - va;
    });

    setResults(comps);
    setLoading(false);
  }, [radiusMiles, dateFrom, dateTo, glaMin, glaMax, priceMin, priceMax, selectedTypes, conditions, sortBy, sortDir, subjectCity, subjectState, subjectGla, subjectPropertyType, subjectYearBuilt]);

  const isSelected = (id: string) => selectedComps.some((c) => c.id === id);

  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-mono font-bold text-cyan-400 tracking-wider">COMP SEARCH</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Subject: {subjectAddress}, {subjectCity}, {subjectState} · {subjectGla.toLocaleString()} sf · {subjectPropertyType}
          </p>
        </div>
        {searched && results.length > 0 && (
          <span className="text-xs text-gray-400 font-mono">
            {results.length} comps found · {selectedComps.length} selected
          </span>
        )}
      </div>

      {/* Search Bar + Quick Filters */}
      <div className="flex gap-2">
        <div className="flex-1 flex gap-2">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded px-3 py-2 flex-1">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="text-sm text-gray-300 font-mono">{subjectCity}, {subjectState}</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded px-3 py-2 w-32">
            <Ruler className="w-3 h-3 text-gray-400" />
            <input
              type="number"
              step="0.25"
              min="0.25"
              max="10"
              className="w-full bg-transparent text-sm text-white font-mono outline-none"
              value={radiusMiles}
              onChange={(e) => setRadiusMiles(parseFloat(e.target.value) || 1)}
            />
            <span className="text-xs text-gray-500">mi</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded px-3 py-2">
            <Calendar className="w-3 h-3 text-gray-400" />
            <input
              type="date"
              className="bg-transparent text-xs text-white font-mono outline-none"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span className="text-gray-500 text-xs">to</span>
            <input
              type="date"
              className="bg-transparent text-xs text-white font-mono outline-none"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-mono rounded border transition-all ${
            showFilters ? "border-cyan-400 text-cyan-400 bg-cyan-400/10" : "border-gray-600 text-gray-400 hover:border-gray-400"
          }`}
        >
          <SlidersHorizontal className="w-3 h-3" />
          FILTERS
        </button>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 text-xs font-mono font-bold rounded border border-cyan-500 text-black bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search className="w-3 h-3" />
          {loading ? "SEARCHING..." : "SEARCH COMPS"}
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="border border-gray-700 rounded p-4 bg-gray-900/50 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {/* GLA Range */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">GLA RANGE (SF)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-white font-mono outline-none focus:border-cyan-500"
                  value={glaMin}
                  onChange={(e) => setGlaMin(parseInt(e.target.value) || 0)}
                  placeholder="Min"
                />
                <span className="text-gray-500 text-xs">—</span>
                <input
                  type="number"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-white font-mono outline-none focus:border-cyan-500"
                  value={glaMax}
                  onChange={(e) => setGlaMax(parseInt(e.target.value) || 0)}
                  placeholder="Max"
                />
              </div>
            </div>
            {/* Price Range */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">PRICE RANGE</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-white font-mono outline-none focus:border-cyan-500"
                  value={priceMin || ""}
                  onChange={(e) => setPriceMin(parseInt(e.target.value) || 0)}
                  placeholder="Min $"
                />
                <span className="text-gray-500 text-xs">—</span>
                <input
                  type="number"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-white font-mono outline-none focus:border-cyan-500"
                  value={priceMax || ""}
                  onChange={(e) => setPriceMax(parseInt(e.target.value) || 0)}
                  placeholder="Max $"
                />
              </div>
            </div>
            {/* Sort */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">SORT BY</label>
              <div className="flex gap-1">
                <select
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-white font-mono outline-none focus:border-cyan-500"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                >
                  <option value="distance">Distance</option>
                  <option value="date">Sale Date</option>
                  <option value="price">Sale Price</option>
                  <option value="gla">GLA</option>
                  <option value="psf">$/SF</option>
                </select>
                <button
                  onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
                  className="px-2 border border-gray-700 rounded text-gray-400 hover:text-white"
                >
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </div>
            </div>
            {/* Condition */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">CONDITION</label>
              <div className="flex flex-wrap gap-1">
                {CONDITIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleCondition(c)}
                    className={`px-2 py-1 text-xs font-mono rounded border transition-all ${
                      conditions.includes(c)
                        ? "border-cyan-400 text-cyan-400 bg-cyan-400/10"
                        : "border-gray-600 text-gray-400 hover:border-gray-400"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Property Types */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">PROPERTY TYPES</label>
            <div className="flex flex-wrap gap-1">
              {PROPERTY_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className={`px-2 py-1 text-xs font-mono rounded border transition-all ${
                    selectedTypes.includes(t)
                      ? "border-cyan-400 text-cyan-400 bg-cyan-400/10"
                      : "border-gray-600 text-gray-400 hover:border-gray-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-3 text-cyan-400 font-mono text-sm">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            Searching MLS, CoStar, public records...
          </div>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12 text-gray-400 font-mono text-sm">
          No comps found matching your criteria. Try expanding the radius or date range.
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          {/* Column Headers */}
          <div className="grid grid-cols-12 gap-2 px-3 py-1 text-xs text-gray-500 font-mono uppercase tracking-wider border-b border-gray-700">
            <div className="col-span-3">Address</div>
            <div className="col-span-1 text-right">Sale Price</div>
            <div className="col-span-1 text-right">$/SF</div>
            <div className="col-span-1 text-right">GLA</div>
            <div className="col-span-1 text-right">Year</div>
            <div className="col-span-1 text-center">Cond.</div>
            <div className="col-span-1 text-right">DOM</div>
            <div className="col-span-1 text-right">Dist.</div>
            <div className="col-span-1 text-center">Source</div>
            <div className="col-span-1 text-center">Add</div>
          </div>

          {results.map((comp) => {
            const selected = isSelected(comp.id);
            const expanded = expandedComp === comp.id;
            const saleAge = Math.floor((Date.now() - new Date(comp.saleDate).getTime()) / 86400000);

            return (
              <div
                key={comp.id}
                className={`border rounded transition-all ${
                  selected
                    ? "border-cyan-500 bg-cyan-500/5"
                    : "border-gray-700 hover:border-gray-500 bg-gray-900/30"
                }`}
              >
                <div className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center">
                  <div className="col-span-3">
                    <div className="flex items-center gap-1.5">
                      {comp.verified && <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                      <div>
                        <div className="text-xs text-white font-mono">{comp.address}</div>
                        <div className="text-xs text-gray-500">{comp.city}, {comp.state} · {saleAge}d ago</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 text-right text-xs text-white font-mono font-bold">
                    {fmt(comp.salePrice)}
                  </div>
                  <div className="col-span-1 text-right text-xs text-cyan-400 font-mono">
                    ${comp.pricePerSqft}/sf
                  </div>
                  <div className="col-span-1 text-right text-xs text-gray-300 font-mono">
                    {comp.gla.toLocaleString()}
                  </div>
                  <div className="col-span-1 text-right text-xs text-gray-300 font-mono">
                    {comp.yearBuilt}
                  </div>
                  <div className="col-span-1 text-center">
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                      comp.condition === "Excellent" ? "bg-cyan-500/20 text-cyan-400" :
                      comp.condition === "Good" ? "bg-blue-500/20 text-blue-400" :
                      comp.condition === "Average" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {comp.condition.slice(0, 3)}
                    </span>
                  </div>
                  <div className="col-span-1 text-right text-xs text-gray-300 font-mono">
                    {comp.daysOnMarket}d
                  </div>
                  <div className="col-span-1 text-right text-xs text-gray-300 font-mono">
                    {comp.distanceMiles}mi
                  </div>
                  <div className="col-span-1 text-center text-xs text-gray-400 font-mono">
                    {comp.source}
                  </div>
                  <div className="col-span-1 flex items-center justify-center gap-1">
                    <button
                      onClick={() => setExpandedComp(expanded ? null : comp.id)}
                      className="text-gray-500 hover:text-gray-300 p-0.5"
                    >
                      {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => onAddComp?.(comp)}
                      disabled={selected}
                      className={`flex items-center justify-center w-6 h-6 rounded border text-xs transition-all ${
                        selected
                          ? "border-cyan-500 text-cyan-500 bg-cyan-500/10 cursor-default"
                          : "border-gray-600 text-gray-400 hover:border-cyan-400 hover:text-cyan-400 hover:bg-cyan-400/10"
                      }`}
                    >
                      {selected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detail Row */}
                {expanded && (
                  <div className="px-4 pb-3 pt-1 border-t border-gray-700/50 grid grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500">MLS #:</span>
                      <span className="text-gray-300 ml-2 font-mono">{comp.mlsNumber || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Lot Size:</span>
                      <span className="text-gray-300 ml-2 font-mono">{comp.lotSize} acres</span>
                    </div>
                    {comp.bedrooms !== undefined && (
                      <div>
                        <span className="text-gray-500">Beds/Baths:</span>
                        <span className="text-gray-300 ml-2 font-mono">{comp.bedrooms}/{comp.bathrooms}</span>
                      </div>
                    )}
                    {comp.garage !== undefined && (
                      <div>
                        <span className="text-gray-500">Garage:</span>
                        <span className="text-gray-300 ml-2 font-mono">{comp.garage}-car</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Stories:</span>
                      <span className="text-gray-300 ml-2 font-mono">{comp.stories}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Sale Date:</span>
                      <span className="text-gray-300 ml-2 font-mono">{comp.saleDate}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">County:</span>
                      <span className="text-gray-300 ml-2 font-mono">{comp.county}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Verified:</span>
                      <span className={`ml-2 font-mono ${comp.verified ? "text-cyan-400" : "text-yellow-400"}`}>
                        {comp.verified ? "Yes" : "Unverified"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Comps Summary */}
      {selectedComps.length > 0 && (
        <div className="border border-cyan-500/30 rounded p-3 bg-cyan-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-cyan-400 font-bold">
              {selectedComps.length} COMP{selectedComps.length !== 1 ? "S" : ""} SELECTED FOR ADJUSTMENT GRID
            </span>
            <span className="text-xs text-gray-400 font-mono">
              Avg: {fmt(Math.round(selectedComps.reduce((s, c) => s + c.salePrice, 0) / selectedComps.length))} ·{" "}
              ${Math.round(selectedComps.reduce((s, c) => s + c.pricePerSqft, 0) / selectedComps.length)}/sf
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedComps.map((c) => (
              <span key={c.id} className="text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 font-mono text-gray-300">
                {c.address} · {fmt(c.salePrice)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
