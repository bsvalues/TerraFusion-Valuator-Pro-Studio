"use client";

import { useState } from "react";
import { Shield, CheckCircle, AlertCircle, ChevronDown, ChevronUp, FileText } from "lucide-react";

interface CertificationItem {
  id: string;
  text: string;
  required: boolean;
  checked: boolean;
}

const USPAP_CERTIFICATION_ITEMS: CertificationItem[] = [
  { id: "c1",  required: true,  checked: false, text: "The statements of fact contained in this report are true and correct." },
  { id: "c2",  required: true,  checked: false, text: "The reported analyses, opinions, and conclusions are limited only by the reported assumptions and limiting conditions and are my personal, impartial, and unbiased professional analyses, opinions, and conclusions." },
  { id: "c3",  required: true,  checked: false, text: "I have no present or prospective interest in the property that is the subject of this report and no personal interest with respect to the parties involved." },
  { id: "c4",  required: true,  checked: false, text: "I have no bias with respect to the property that is the subject of this report or to the parties involved with this assignment." },
  { id: "c5",  required: true,  checked: false, text: "My engagement in this assignment was not contingent upon developing or reporting predetermined results." },
  { id: "c6",  required: true,  checked: false, text: "My compensation for completing this assignment is not contingent upon the development or reporting of a predetermined value or direction in value that favors the cause of the client, the amount of the value opinion, the attainment of a stipulated result, or the occurrence of a subsequent event directly related to the intended use of this appraisal." },
  { id: "c7",  required: true,  checked: false, text: "My analyses, opinions, and conclusions were developed, and this report has been prepared, in conformity with the Uniform Standards of Professional Appraisal Practice (USPAP)." },
  { id: "c8",  required: true,  checked: false, text: "I have made a personal inspection of the property that is the subject of this report." },
  { id: "c9",  required: false, checked: false, text: "No one provided significant real property appraisal assistance to the person signing this certification. (If others provided assistance, identify them and describe their contribution.)" },
  { id: "c10", required: true,  checked: false, text: "I have not performed any services, as an appraiser or in any other capacity, regarding the property that is the subject of this report within the three-year period immediately preceding acceptance of this assignment." },
];

const SCOPE_OF_WORK_ITEMS = [
  { id: "s1", label: "PROPERTY INSPECTION", description: "Interior and exterior inspection completed", required: true },
  { id: "s2", label: "SALES COMPARISON APPROACH", description: "Minimum 3 comparable sales analyzed", required: true },
  { id: "s3", label: "INCOME APPROACH", description: "Required for income-producing properties", required: false },
  { id: "s4", label: "COST APPROACH", description: "Considered for all property types", required: false },
  { id: "s5", label: "MARKET AREA ANALYSIS", description: "Neighborhood and market conditions analyzed", required: true },
  { id: "s6", label: "HIGHEST & BEST USE", description: "As vacant and as improved", required: true },
  { id: "s7", label: "PRIOR SALE HISTORY", description: "3-year history researched (SR 1-5)", required: true },
  { id: "s8", label: "EXPOSURE TIME", description: "Reasonable exposure time estimated", required: true },
  { id: "s9", label: "EFFECTIVE DATE", description: "Date of value opinion established", required: true },
];

export function USPAPCertification() {
  const [items, setItems] = useState<CertificationItem[]>(USPAP_CERTIFICATION_ITEMS);
  const [scopeItems, setScopeItems] = useState(SCOPE_OF_WORK_ITEMS.map((s) => ({ ...s, checked: false })));
  const [expanded, setExpanded] = useState(false);
  const [appraiserName, setAppraiserName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);

  const toggleItem = (id: string) =>
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, checked: !i.checked } : i));

  const toggleScope = (id: string) =>
    setScopeItems((prev) => prev.map((i) => i.id === id ? { ...i, checked: !i.checked } : i));

  const requiredChecked = items.filter((i) => i.required && i.checked).length;
  const requiredTotal = items.filter((i) => i.required).length;
  const scopeRequiredChecked = scopeItems.filter((i) => i.required && i.checked).length;
  const scopeRequiredTotal = scopeItems.filter((i) => i.required).length;
  const allRequiredComplete = requiredChecked === requiredTotal && scopeRequiredChecked === scopeRequiredTotal;
  const hasAppraiserInfo = appraiserName && licenseNumber && licenseState;

  const inputCls = "w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary";
  const labelCls = "font-mono text-[10px] tracking-wider text-muted-foreground";

  return (
    <div className={`rounded-lg border bg-card p-5 transition-colors ${allRequiredComplete && hasAppraiserInfo ? "border-cyan-400/30" : "border-border"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Shield className={`h-4 w-4 ${allRequiredComplete ? "text-cyan-400" : "text-primary"}`} />
          <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground">
            USPAP COMPLIANCE & CERTIFICATION
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${allRequiredComplete ? "bg-cyan-400" : "bg-yellow-400"} animate-pulse`} />
            <span className="font-mono text-[10px] text-muted-foreground">
              {requiredChecked}/{requiredTotal} cert · {scopeRequiredChecked}/{scopeRequiredTotal} scope
            </span>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-5 space-y-5">
          {/* Appraiser Info */}
          <div>
            <p className="mb-3 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground">APPRAISER INFORMATION</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className={labelCls}>APPRAISER NAME *</label>
                <input type="text" placeholder="Jane Doe, MAI, SRA"
                  value={appraiserName} onChange={(e) => setAppraiserName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>LICENSE STATE *</label>
                <input type="text" placeholder="TX" maxLength={2}
                  value={licenseState} onChange={(e) => setLicenseState(e.target.value.toUpperCase())} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>LICENSE NUMBER *</label>
                <input type="text" placeholder="TX-1234567"
                  value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>LICENSE EXPIRY</label>
                <input type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>EFFECTIVE DATE OF VALUE *</label>
                <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>REPORT DATE</label>
                <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Scope of Work */}
          <div>
            <p className="mb-3 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground">
              SCOPE OF WORK (USPAP SR 1-2)
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {scopeItems.map((item) => (
                <label key={item.id} className={`flex items-start gap-2 rounded border p-2.5 cursor-pointer transition-colors ${
                  item.checked ? "border-cyan-400/30 bg-cyan-400/5" : "border-border/40 bg-background/30 hover:border-border"
                }`}>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleScope(item.id)}
                    className="mt-0.5 accent-primary flex-shrink-0"
                  />
                  <div>
                    <p className={`font-mono text-[10px] font-semibold ${item.checked ? "text-cyan-400" : "text-foreground"}`}>
                      {item.label}
                      {item.required && <span className="text-red-400 ml-1">*</span>}
                    </p>
                    <p className="font-mono text-[9px] text-muted-foreground">{item.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Certification Items */}
          <div>
            <p className="mb-3 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground">
              APPRAISER CERTIFICATION (USPAP SR 2-3)
            </p>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <label key={item.id} className={`flex items-start gap-3 rounded border p-3 cursor-pointer transition-colors ${
                  item.checked ? "border-cyan-400/30 bg-cyan-400/5" : "border-border/40 bg-background/30 hover:border-border"
                }`}>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleItem(item.id)}
                    className="mt-0.5 accent-primary flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[9px] text-muted-foreground/60">{idx + 1}.</span>
                      {item.required && <span className="rounded bg-primary/10 px-1 font-mono text-[8px] text-primary">REQUIRED</span>}
                      {item.checked && <CheckCircle className="h-3 w-3 text-cyan-400" />}
                    </div>
                    <p className="font-mono text-[10px] text-foreground/80 leading-relaxed">{item.text}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Compliance Status */}
          <div className={`rounded-lg border-2 p-4 ${
            allRequiredComplete && hasAppraiserInfo
              ? "border-cyan-400/40 bg-cyan-400/5"
              : "border-yellow-400/30 bg-yellow-400/5"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {allRequiredComplete && hasAppraiserInfo
                ? <CheckCircle className="h-4 w-4 text-cyan-400" />
                : <AlertCircle className="h-4 w-4 text-yellow-400" />
              }
              <p className={`font-mono text-xs font-bold ${allRequiredComplete && hasAppraiserInfo ? "text-cyan-400" : "text-yellow-400"}`}>
                {allRequiredComplete && hasAppraiserInfo
                  ? "USPAP CERTIFICATION COMPLETE — READY FOR REPORT"
                  : "CERTIFICATION INCOMPLETE — REVIEW REQUIRED ITEMS"
                }
              </p>
            </div>
            {(!allRequiredComplete || !hasAppraiserInfo) && (
              <ul className="space-y-1">
                {!hasAppraiserInfo && (
                  <li className="font-mono text-[10px] text-yellow-400/80">• Appraiser name, license number, and state are required</li>
                )}
                {requiredChecked < requiredTotal && (
                  <li className="font-mono text-[10px] text-yellow-400/80">
                    • {requiredTotal - requiredChecked} required certification item(s) unchecked
                  </li>
                )}
                {scopeRequiredChecked < scopeRequiredTotal && (
                  <li className="font-mono text-[10px] text-yellow-400/80">
                    • {scopeRequiredTotal - scopeRequiredChecked} required scope of work item(s) unchecked
                  </li>
                )}
              </ul>
            )}
            {allRequiredComplete && hasAppraiserInfo && (
              <p className="font-mono text-[10px] text-cyan-400/80">
                Certified by: {appraiserName} · License: {licenseState}-{licenseNumber} · Effective: {effectiveDate}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
