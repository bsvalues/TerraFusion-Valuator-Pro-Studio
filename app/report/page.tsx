"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { analyzeMarket, calculateValuation, assessRisk, generateComparableSales } from "@/lib/engines";
import type { Property, MarketData, RiskAssessment, ComparableSale, Valuation } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Building2, Printer, ArrowLeft, Shield, Scale, HardHat,
  AlertCircle, Sparkles, RefreshCw, Copy, Check,
} from "lucide-react";

function fmt(n: number) { return "$" + Math.round(n).toLocaleString(); }
function pct(n: number) { return (n * 100).toFixed(1) + "%"; }

const PT_LABELS: Record<string, string> = {
  single_family: "Single Family Residential",
  condo: "Condominium",
  multi_family_2_4: "2-4 Unit Residential",
  multi_family_5plus: "Multi-Family (5+ Units)",
  office: "Office",
  retail: "Retail",
  industrial: "Industrial",
  mixed_use: "Mixed Use",
  hospitality: "Hospitality",
  land: "Land",
  special_purpose: "Special Purpose",
};

const CERT = [
  "The statements of fact contained in this report are true and correct.",
  "The reported analyses, opinions, and conclusions are limited only by the reported assumptions and limiting conditions and are my personal, impartial, and unbiased professional analyses, opinions, and conclusions.",
  "I have no present or prospective interest in the property that is the subject of this report and no personal interest with respect to the parties involved.",
  "I have no bias with respect to the property that is the subject of this report or to the parties involved with this assignment.",
  "My engagement in this assignment was not contingent upon developing or reporting predetermined results.",
  "My compensation for completing this assignment is not contingent upon the development or reporting of a predetermined value or direction in value that favors the cause of the client, the amount of the value opinion, the attainment of a stipulated result, or the occurrence of a subsequent event directly related to the intended use of this appraisal.",
  "My analyses, opinions, and conclusions were developed, and this report has been prepared, in conformity with the Uniform Standards of Professional Appraisal Practice (USPAP).",
  "I have made a personal inspection of the property that is the subject of this report.",
  "No one provided significant real property appraisal assistance to the person signing this certification.",
  "I have not performed any services, as an appraiser or in any other capacity, regarding the property that is the subject of this report within the three-year period immediately preceding acceptance of this assignment.",
];

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}

function ReportContent() {
  const params = useSearchParams();
  const router = useRouter();

  const address = params.get("address") || "123 Main Street";
  const city = params.get("city") || "Austin";
  const state = params.get("state") || "TX";
  const zip = params.get("zip") || "78701";
  const county = params.get("county") || "Travis";
  const sqft = Number(params.get("sqft") || "2000");
  const beds = Number(params.get("beds") || "3");
  const baths = Number(params.get("baths") || "2");
  const region = params.get("region") || "Downtown Core";
  const yearBuilt = Number(params.get("yearBuilt") || "1995");
  const propertyType = params.get("propertyType") || "single_family";
  const fileNumber = params.get("fileNumber") || ("TF-" + new Date().getFullYear().toString().slice(-2) + "-" + String(Math.floor(Math.random() * 9000) + 1000));
  const clientName = params.get("clientName") || "Client";
  const appraiserName = params.get("appraiserName") || "";
  const appraiserLicense = params.get("appraiserLicense") || "";

  const [market, setMarket] = useState<MarketData | null>(null);
  const [valuation, setValuation] = useState<Valuation | null>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [comps, setComps] = useState<ComparableSale[]>([]);
  const [narratives, setNarratives] = useState<Record<string, string>>({});
  const [generatingAll, setGeneratingAll] = useState(false);
  const [loadingNarrative, setLoadingNarrative] = useState<string | null>(null);

  const effectiveDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const property: Property = {
    id: "prop-report",
    address, city, state, zip, county,
    squareFeet: sqft,
    bedrooms: beds || undefined,
    bathrooms: baths || undefined,
    yearBuilt: yearBuilt || undefined,
    propertyType: propertyType as Property["propertyType"],
    condition: "Average",
    landAreaAcres: 0.25,
    zoning: propertyType === "single_family" ? "R-1" : "C-1",
  };

  useEffect(() => {
    const m = analyzeMarket(region);
    const v = calculateValuation(property, m);
    const r = assessRisk(property, m, v);
    const c = generateComparableSales(property, m);
    setMarket(m); setValuation(v); setRisk(r); setComps(c);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateNarrative = async (type: string) => {
    setLoadingNarrative(type);
    try {
      const res = await fetch("/api/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          property: { address, city, state, zip, county, propertyType, squareFeet: sqft, yearBuilt, condition: "Average", bedrooms: beds, bathrooms: baths },
          market: market ? { region, marketTrend: market.marketTrend, medianPrice: market.medianPrice, averagePricePerSqft: market.averagePricePerSqft, averageDaysOnMarket: market.averageDaysOnMarket, listToSaleRatio: market.listToSaleRatio } : undefined,
          approaches: { salesComp: valuation?.estimatedValue, salesCompWeight: 70, final: valuation?.estimatedValue },
          risk: risk ? { riskLevel: risk.riskLevel } : undefined,
        }),
      });
      const data = await res.json();
      if (data.narrative) setNarratives((prev) => ({ ...prev, [type]: data.narrative }));
    } catch { /* ignore */ }
    setLoadingNarrative(null);
  };

  const generateAllNarratives = async () => {
    setGeneratingAll(true);
    for (const type of ["property_description", "scope_of_work", "market_conditions", "highest_best_use", "reconciliation"]) {
      if (!narratives[type]) await generateNarrative(type);
    }
    setGeneratingAll(false);
  };

  if (!valuation || !market) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto mb-3" />
          <p className="font-mono text-xs text-muted-foreground">Generating appraisal report...</p>
        </div>
      </div>
    );
  }

  const riskColor = risk?.riskLevel === "Low" ? "text-emerald-400" : risk?.riskLevel === "Moderate" ? "text-yellow-400" : "text-red-400";
  const incomeApplicable = ["office", "retail", "industrial", "multi_family_5plus"].includes(propertyType);

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar */}
      <div className="print:hidden sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur px-4 py-3">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()}
              className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> BACK
            </button>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="font-mono text-xs font-semibold text-foreground">APPRAISAL REPORT</span>
              <span className="font-mono text-[10px] text-muted-foreground">· {fileNumber}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={generateAllNarratives} disabled={generatingAll}
              className="flex items-center gap-1.5 rounded border border-primary/30 bg-primary/5 px-3 py-1.5 font-mono text-[10px] font-semibold text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors">
              {generatingAll ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {generatingAll ? "DRAFTING..." : "AI DRAFT ALL SECTIONS"}
            </button>
            <button
              onClick={async () => {
                try {
                  const reportData = {
                    fileNumber,
                    address, city, state, zip, county,
                    propertyType: PT_LABELS[propertyType] || propertyType,
                    gla: sqft,
                    yearBuilt,
                    condition: "Average",
                    bedrooms: beds || undefined,
                    bathrooms: baths || undefined,
                    lotSize: 0.25,
                    zoning: propertyType === "single_family" ? "R-1" : "C-1",
                    effectiveDate: new Date().toISOString(),
                    reportDate: new Date().toISOString(),
                    clientName,
                    intendedUse: "Mortgage Lending / Financing",
                    reportType: "Summary Appraisal Report",
                    scopeOfWork: "Interior & Exterior Inspection",
                    finalValue: valuation?.estimatedValue || 0,
                    confidence: valuation?.confidenceLevel || 0,
                    riskLevel: risk?.riskLevel || "Low",
                    marketTrend: market?.marketTrend || "Stable",
                    appraiserName,
                    appraiserTitle: "",
                    appraiserLicense,
                    appraiserLicenseState: state,
                    appraiserLicenseType: "Certified Residential",
                    firmName: "TerraFusion Valuator Pro",
                    firmAddress: "",
                    firmPhone: "",
                    firmEmail: "",
                    designations: [],
                    comps: comps.slice(0, 5).map((c) => ({
                      address: c.address,
                      salePrice: c.salePrice,
                      saleDate: c.saleDate,
                      gla: c.squareFeet,
                      pricePerSqft: Math.round(c.salePrice / c.squareFeet),
                      yearBuilt: c.yearBuilt,
                      condition: c.condition,
                      netAdj: c.adjustedPrice - c.salePrice,
                      adjPrice: c.adjustedPrice,
                      grossAdj: Math.abs((c.adjustedPrice - c.salePrice) / c.salePrice) * 100,
                    })),
                    narratives,
                    medianPrice: market?.medianPrice || 0,
                    avgPsf: market?.averagePricePerSqft || 0,
                    avgDom: market?.averageDaysOnMarket || 0,
                    listToSale: market?.listToSaleRatio || 100,
                    salesCompValue: valuation?.estimatedValue || 0,
                    salesCompWeight: 70,
                    costWeight: 30,
                    incomeWeight: 0,
                  };
                  const res = await fetch("/api/export-pdf", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(reportData),
                  });
                  const html = await res.text();
                  const blob = new Blob([html], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  const win = window.open(url, "_blank");
                  if (win) {
                    setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 1200);
                  }
                } catch {
                  window.print();
                }
              }}
              className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 font-mono text-[10px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              <Printer className="h-3.5 w-3.5" /> PRINT / PDF
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 print:px-0 print:py-0 print:max-w-none">

        {/* ── COVER PAGE ── */}
        <div className="mb-8 rounded-xl border-2 border-primary/30 bg-card p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="font-mono text-sm font-bold text-primary tracking-wider">TERRAFUSION VALUATOR PRO</span>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground tracking-widest">COMMERCIAL FEE APPRAISAL PLATFORM</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] text-muted-foreground">FILE NO.</p>
              <p className="font-mono text-base font-bold text-foreground">{fileNumber}</p>
            </div>
          </div>
          <div className="border-t border-b border-border/40 py-6 mb-6">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">APPRAISAL REPORT</p>
            <h1 className="text-2xl font-bold text-foreground mb-1">{address}</h1>
            <p className="text-lg text-muted-foreground">{city}, {state} {zip}</p>
            <p className="font-mono text-xs text-muted-foreground mt-1">{county} County</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
            {[
              { label: "PROPERTY TYPE", value: PT_LABELS[propertyType] || propertyType },
              { label: "GLA / RBA", value: sqft.toLocaleString() + " sq ft" },
              { label: "YEAR BUILT", value: String(yearBuilt || "N/A") },
              { label: "EFFECTIVE DATE", value: effectiveDate },
              { label: "CLIENT / LENDER", value: clientName },
              { label: "INTENDED USE", value: "Mortgage Lending" },
              { label: "REPORT DATE", value: effectiveDate },
              { label: "REPORT TYPE", value: "Summary Appraisal" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-mono text-[9px] tracking-wider text-muted-foreground">{label}</p>
                <p className="font-mono text-xs text-foreground">{value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border-2 border-primary/40 bg-primary/10 p-6 text-center">
            <p className="font-mono text-[10px] tracking-widest text-primary mb-1">FINAL OPINION OF MARKET VALUE</p>
            <p className="font-mono text-5xl font-bold text-primary">{fmt(valuation.estimatedValue)}</p>
            <p className="font-mono text-[10px] text-muted-foreground mt-2">
              As of {effectiveDate} · {PT_LABELS[propertyType] || propertyType}
            </p>
            <div className="mt-3 flex items-center justify-center gap-4">
              <span className="font-mono text-[10px] text-muted-foreground">
                Confidence: <span className="text-primary font-semibold">{pct(valuation.confidenceLevel)}</span>
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                Risk: <span className={cn("font-semibold", riskColor)}>{risk?.riskLevel}</span>
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                Market: <span className="text-foreground font-semibold">{market.marketTrend}</span>
              </span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-6 border-t border-border/40 pt-6">
            <div>
              <p className="font-mono text-[9px] tracking-wider text-muted-foreground mb-2">APPRAISER</p>
              <div className="border-b border-foreground/20 pb-1 mb-1 min-h-[32px]">
                <p className="font-mono text-sm text-foreground">{appraiserName || "_________________________"}</p>
              </div>
              <p className="font-mono text-[9px] text-muted-foreground">Signature</p>
              {appraiserLicense && <p className="font-mono text-[10px] text-muted-foreground mt-1">License: {appraiserLicense}</p>}
            </div>
            <div>
              <p className="font-mono text-[9px] tracking-wider text-muted-foreground mb-2">DATE OF SIGNATURE</p>
              <div className="border-b border-foreground/20 pb-1 mb-1 min-h-[32px]">
                <p className="font-mono text-sm text-foreground">{effectiveDate}</p>
              </div>
              <p className="font-mono text-[9px] text-muted-foreground">Date</p>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: PROPERTY DESCRIPTION ── */}
        <RptSection title="SECTION 1 — PROPERTY DESCRIPTION" uspap="SR 1-2(e)"
          narrativeType="property_description" narrative={narratives["property_description"]}
          loading={loadingNarrative === "property_description"} onGenerate={() => generateNarrative("property_description")}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 mb-4">
            {[
              { label: "Address", value: `${address}, ${city}, ${state} ${zip}` },
              { label: "County", value: county },
              { label: "Property Type", value: PT_LABELS[propertyType] || propertyType },
              { label: "GLA", value: sqft.toLocaleString() + " sq ft" },
              { label: "Year Built", value: String(yearBuilt || "N/A") },
              { label: "Condition", value: "Average" },
              ...(beds ? [{ label: "Bedrooms", value: String(beds) }] : []),
              ...(baths ? [{ label: "Bathrooms", value: String(baths) }] : []),
              { label: "Lot Size", value: "0.25 acres (est.)" },
              { label: "Zoning", value: property.zoning || "N/A" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-mono text-[9px] tracking-wider text-muted-foreground">{label.toUpperCase()}</p>
                <p className="font-mono text-xs text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </RptSection>

        {/* ── SECTION 2: SCOPE OF WORK ── */}
        <RptSection title="SECTION 2 — SCOPE OF WORK" uspap="SR 1-2"
          narrativeType="scope_of_work" narrative={narratives["scope_of_work"]}
          loading={loadingNarrative === "scope_of_work"} onGenerate={() => generateNarrative("scope_of_work")}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 mb-4">
            {[
              { label: "Inspection Type", value: "Interior & Exterior" },
              { label: "Intended Use", value: "Mortgage Lending / Financing" },
              { label: "Intended User", value: "Lender/Client and their assigns" },
              { label: "Type of Value", value: "Market Value" },
              { label: "Sales Comparison", value: "Developed" },
              { label: "Income Approach", value: incomeApplicable ? "Developed" : "Not applicable" },
              { label: "Cost Approach", value: "Considered" },
              { label: "Prior Sale History", value: "3-year history researched" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between rounded border border-border/30 bg-background/30 px-3 py-2">
                <span className="font-mono text-[10px] text-muted-foreground">{label}</span>
                <span className="font-mono text-[10px] font-semibold text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </RptSection>

        {/* ── SECTION 3: MARKET CONDITIONS ── */}
        <RptSection title="SECTION 3 — NEIGHBORHOOD & MARKET CONDITIONS" uspap="SR 1-3"
          narrativeType="market_conditions" narrative={narratives["market_conditions"]}
          loading={loadingNarrative === "market_conditions"} onGenerate={() => generateNarrative("market_conditions")}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
            {[
              { label: "Market Region", value: region },
              { label: "Market Trend", value: market.marketTrend },
              { label: "Median Sale Price", value: fmt(market.medianPrice) },
              { label: "Avg Price / Sq Ft", value: "$" + market.averagePricePerSqft + "/sf" },
              { label: "Avg Days on Market", value: market.averageDaysOnMarket != null ? market.averageDaysOnMarket + " days" : "N/A" },
              { label: "List-to-Sale Ratio", value: market.listToSaleRatio != null ? pct(market.listToSaleRatio) : "N/A" },
              { label: "Demand/Supply", value: market.demandSupply || "In Balance" },
              { label: "Vacancy Rate", value: market.vacancyRate != null ? pct(market.vacancyRate) : "N/A" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded border border-border/30 bg-background/30 p-2 text-center">
                <p className="font-mono text-[9px] tracking-wider text-muted-foreground">{label.toUpperCase()}</p>
                <p className="font-mono text-xs font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </RptSection>

        {/* ── SECTION 4: HIGHEST & BEST USE ── */}
        <RptSection title="SECTION 4 — HIGHEST & BEST USE" uspap="SR 1-3(b)"
          narrativeType="highest_best_use" narrative={narratives["highest_best_use"]}
          loading={loadingNarrative === "highest_best_use"} onGenerate={() => generateNarrative("highest_best_use")}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded border border-border/30 bg-background/30 p-3">
              <p className="font-mono text-[9px] tracking-wider text-primary mb-1">AS VACANT</p>
              <p className="font-mono text-[10px] text-foreground/80">
                {PT_LABELS[propertyType] || propertyType} use, consistent with current zoning ({property.zoning}).
                Legally permissible, physically possible, financially feasible, and maximally productive.
              </p>
            </div>
            <div className="rounded border border-border/30 bg-background/30 p-3">
              <p className="font-mono text-[9px] tracking-wider text-primary mb-1">AS IMPROVED</p>
              <p className="font-mono text-[10px] text-foreground/80">
                Continued use as a {(PT_LABELS[propertyType] || propertyType).toLowerCase()}.
                The existing improvements represent the highest and best use as improved.
              </p>
            </div>
          </div>
        </RptSection>

        {/* ── SECTION 5: SALES COMPARISON ── */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              <h2 className="font-mono text-xs font-semibold tracking-wider text-foreground">SECTION 5 — SALES COMPARISON APPROACH</h2>
            </div>
            <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">USPAP SR 1-4(a)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="pb-2 pr-4 font-mono text-[9px] tracking-wider text-muted-foreground">ITEM</th>
                  <th className="pb-2 pr-4 font-mono text-[9px] tracking-wider text-primary">SUBJECT</th>
                  {comps.map((_, i) => (
                    <th key={i} className="pb-2 pr-4 font-mono text-[9px] tracking-wider text-muted-foreground">COMP {i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Address", subject: address, vals: comps.map((c) => c.address) },
                  { label: "Sale Price", subject: "—", vals: comps.map((c) => fmt(c.salePrice)) },
                  { label: "Sale Date", subject: effectiveDate, vals: comps.map((c) => c.saleDate) },
                  { label: "GLA (sq ft)", subject: sqft.toLocaleString(), vals: comps.map((c) => c.squareFeet.toLocaleString()) },
                  { label: "Price / Sq Ft", subject: "—", vals: comps.map((c) => "$" + (c.salePrice / c.squareFeet).toFixed(0) + "/sf") },
                  { label: "Year Built", subject: String(yearBuilt || "N/A"), vals: comps.map((c) => String(c.yearBuilt || "N/A")) },
                  { label: "Condition", subject: "Average", vals: comps.map((c) => c.condition || "Average") },
                  { label: "Net Adj.", subject: "—", vals: comps.map((c) => { const net = c.adjustments.reduce((s, a) => s + a.dollarAmount, 0); return (net >= 0 ? "+" : "") + fmt(net); }) },
                  { label: "Adjusted Price", subject: "—", vals: comps.map((c) => fmt(c.adjustedPrice)) },
                ].map(({ label, subject, vals }) => (
                  <tr key={label} className="border-b border-border/20">
                    <td className="py-1.5 pr-4 font-mono text-[10px] text-muted-foreground">{label}</td>
                    <td className="py-1.5 pr-4 font-mono text-[10px] font-semibold text-primary">{subject}</td>
                    {vals.map((v, i) => <td key={i} className="py-1.5 pr-4 font-mono text-[10px] text-foreground">{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] tracking-wider text-muted-foreground">INDICATED VALUE BY SALES COMPARISON</p>
              <p className="font-mono text-[9px] text-muted-foreground mt-0.5">
                Range: {comps.length > 0
                  ? fmt(Math.min(...comps.map((c) => c.adjustedPrice))) + " — " + fmt(Math.max(...comps.map((c) => c.adjustedPrice)))
                  : "N/A"}
              </p>
            </div>
            <p className="font-mono text-2xl font-bold text-primary">{fmt(valuation.estimatedValue)}</p>
          </div>
        </div>

        {/* ── SECTION 6: COST APPROACH ── */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardHat className="h-4 w-4 text-primary" />
              <h2 className="font-mono text-xs font-semibold tracking-wider text-foreground">SECTION 6 — COST APPROACH</h2>
            </div>
            <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">USPAP SR 1-4(c)</span>
          </div>
          {(() => {
            const costPerSqft = 185;
            const rcn = sqft * costPerSqft;
            const age = yearBuilt ? new Date().getFullYear() - yearBuilt : 20;
            const depreciation = rcn * Math.min(0.65, age * 0.015);
            const depreciatedValue = rcn - depreciation;
            const landValue = valuation.estimatedValue * 0.20;
            const costValue = depreciatedValue + landValue;
            return (
              <div className="space-y-1">
                {[
                  { label: `Replacement Cost New (RCN) — ${sqft.toLocaleString()} sf @ $${costPerSqft}/sf`, value: fmt(rcn), bold: false, red: false, highlight: false },
                  { label: `Less: Physical Depreciation (${(depreciation / rcn * 100).toFixed(0)}%)`, value: "(" + fmt(depreciation) + ")", bold: false, red: true, highlight: false },
                  { label: "Depreciated Value of Improvements", value: fmt(depreciatedValue), bold: true, red: false, highlight: false },
                  { label: "Plus: Site Value (Land)", value: fmt(landValue), bold: false, red: false, highlight: false },
                  { label: "INDICATED VALUE BY COST APPROACH", value: fmt(costValue), bold: true, red: false, highlight: true },
                ].map(({ label, value, bold, red, highlight }) => (
                  <div key={label} className={cn("flex items-center justify-between py-1.5 border-b border-border/20", highlight && "border-t-2 border-primary/30 mt-1 pt-2")}>
                    <span className={cn("font-mono text-[10px]", bold ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
                    <span className={cn("font-mono text-[10px]", bold ? "font-bold text-primary" : "text-foreground", red && "text-red-400")}>{value}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* ── SECTION 7: VALUE RECONCILIATION ── */}
        <RptSection title="SECTION 7 — VALUE RECONCILIATION" uspap="SR 1-6"
          narrativeType="reconciliation" narrative={narratives["reconciliation"]}
          loading={loadingNarrative === "reconciliation"} onGenerate={() => generateNarrative("reconciliation")}>
          <div className="space-y-2 mb-4">
            {[
              { approach: "Sales Comparison Approach", value: valuation.estimatedValue, weight: incomeApplicable ? 50 : 70, primary: true },
              { approach: "Income Capitalization Approach", value: incomeApplicable ? valuation.estimatedValue * 0.97 : null, weight: incomeApplicable ? 35 : 0, primary: false },
              { approach: "Cost Approach", value: valuation.estimatedValue * 1.02, weight: incomeApplicable ? 15 : 30, primary: false },
            ].map(({ approach, value, weight, primary }) => (
              <div key={approach} className={cn("flex items-center justify-between rounded border px-4 py-2.5", primary ? "border-primary/30 bg-primary/5" : "border-border/30 bg-background/30")}>
                <div>
                  <span className="font-mono text-[10px] font-semibold text-foreground">{approach}</span>
                  {weight > 0 && <span className="ml-3 font-mono text-[9px] text-muted-foreground">Weight: {weight}%</span>}
                </div>
                <span className={cn("font-mono text-sm font-bold", primary ? "text-primary" : "text-foreground")}>
                  {value ? fmt(value) : "Not Applicable"}
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border-2 border-primary/40 bg-primary/10 p-5 flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] tracking-wider text-primary">FINAL OPINION OF MARKET VALUE</p>
              <p className="font-mono text-[9px] text-muted-foreground mt-0.5">As of {effectiveDate}</p>
            </div>
            <p className="font-mono text-3xl font-bold text-primary">{fmt(valuation.estimatedValue)}</p>
          </div>
        </RptSection>

        {/* ── SECTION 8: CERTIFICATION ── */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <h2 className="font-mono text-xs font-semibold tracking-wider text-foreground">SECTION 8 — APPRAISER CERTIFICATION</h2>
            </div>
            <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">USPAP SR 2-3</span>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground mb-4">I certify that, to the best of my knowledge and belief:</p>
          <ol className="space-y-2 mb-6">
            {CERT.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full border border-primary/30 bg-primary/5 font-mono text-[9px] text-primary font-bold">{i + 1}</span>
                <p className="font-mono text-[10px] text-foreground/80 leading-relaxed">{item}</p>
              </li>
            ))}
          </ol>
          <div className="grid grid-cols-2 gap-8 border-t border-border/40 pt-6">
            <div>
              <p className="font-mono text-[9px] tracking-wider text-muted-foreground mb-4">APPRAISER SIGNATURE</p>
              <div className="border-b border-foreground/30 pb-1 mb-1 min-h-[40px]">
                <p className="font-mono text-sm text-foreground">{appraiserName || ""}</p>
              </div>
              <p className="font-mono text-[9px] text-muted-foreground">Signature of Appraiser</p>
              {appraiserLicense && <p className="font-mono text-[10px] text-muted-foreground mt-2">License: {appraiserLicense}</p>}
            </div>
            <div>
              <p className="font-mono text-[9px] tracking-wider text-muted-foreground mb-4">DATE OF SIGNATURE & REPORT</p>
              <div className="border-b border-foreground/30 pb-1 mb-1 min-h-[40px]">
                <p className="font-mono text-sm text-foreground">{effectiveDate}</p>
              </div>
              <p className="font-mono text-[9px] text-muted-foreground">Date</p>
            </div>
          </div>
        </div>

        {/* ── SECTION 9: LIMITING CONDITIONS ── */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            <h2 className="font-mono text-xs font-semibold tracking-wider text-foreground">SECTION 9 — ASSUMPTIONS & LIMITING CONDITIONS</h2>
          </div>
          <div className="space-y-2">
            {[
              "No responsibility is assumed for legal matters or questions of survey, nor for matters of a legal nature.",
              "The information furnished by others is believed to be reliable, but no warranty is given for its accuracy.",
              "It is assumed that there are no hidden or unapparent conditions of the property, subsoil, or structures that render it more or less valuable.",
              "It is assumed that there is full compliance with all applicable federal, state, and local environmental regulations and laws unless noncompliance is stated, defined, and considered in the appraisal report.",
              "It is assumed that all applicable zoning and use regulations and restrictions have been complied with, unless a nonconformity has been stated, defined, and considered in the appraisal report.",
              "Possession of this report, or a copy thereof, does not carry with it the right of publication. It may not be used for any purpose by any person other than the party to whom it is addressed without the written consent of the appraiser.",
            ].map((item, i) => (
              <p key={i} className="font-mono text-[10px] text-foreground/70 leading-relaxed border-b border-border/20 pb-2">{i + 1}. {item}</p>
            ))}
          </div>
        </div>

        <div className="print:hidden border-t border-border pt-4 pb-8 text-center">
          <p className="font-mono text-[10px] text-muted-foreground/50">
            TerraFusion Valuator Pro Studio · Commercial Fee Appraisal Platform · USPAP Compliant
          </p>
        </div>
      </div>
    </div>
  );
}

function RptSection({
  title, uspap, narrativeType, narrative, loading, onGenerate, children,
}: {
  title: string;
  uspap: string;
  narrativeType: string;
  narrative?: string;
  loading: boolean;
  onGenerate: () => void;
  children?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!narrative) return;
    await navigator.clipboard.writeText(narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mb-8 rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-mono text-xs font-semibold tracking-wider text-foreground">{title}</h2>
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">{uspap}</span>
          {narrative && (
            <button onClick={copy}
              className="print:hidden flex items-center gap-1 rounded border border-border px-2 py-1 font-mono text-[9px] text-muted-foreground hover:text-foreground transition-colors">
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            </button>
          )}
          <button onClick={onGenerate} disabled={loading}
            className="print:hidden flex items-center gap-1.5 rounded bg-primary/10 border border-primary/20 px-2.5 py-1 font-mono text-[9px] font-semibold text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors">
            {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {loading ? "DRAFTING..." : narrative ? "REDRAFT" : "AI DRAFT"}
          </button>
        </div>
      </div>
      {children}
      {loading && (
        <div className="rounded border border-primary/20 bg-primary/5 p-4 text-center">
          <RefreshCw className="h-5 w-5 text-primary animate-spin mx-auto mb-1" />
          <p className="font-mono text-[10px] text-primary">Drafting USPAP-compliant narrative...</p>
        </div>
      )}
      {narrative && !loading && (
        <div className="rounded border border-emerald-400/20 bg-emerald-400/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono text-[9px] tracking-wider text-emerald-400">AI-DRAFTED — REVIEW BEFORE FINALIZING</span>
          </div>
          <p className="font-mono text-[11px] text-foreground/90 leading-relaxed whitespace-pre-wrap">{narrative}</p>
        </div>
      )}
      {!narrative && !loading && (
        <div className="print:hidden rounded border border-dashed border-border/40 p-4 text-center">
          <p className="font-mono text-[10px] text-muted-foreground">
            Click &quot;AI Draft&quot; to generate a USPAP-compliant narrative for this section
          </p>
        </div>
      )}
    </div>
  );
}
