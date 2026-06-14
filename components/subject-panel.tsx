"use client";

/**
 * TerraFusion Valuator Pro — Subject Panel
 *
 * The Subject Panel is the first tab of the Workbench. It captures all
 * USPAP assignment conditions and subject property characteristics required
 * before any analytical run can be dispatched.
 *
 * Fields map directly to UAD field codes where applicable.
 * No run button is shown until isSubjectReady() === true.
 */

import { useState } from "react";
import { useSubjectWorkbench } from "@/lib/subject-workbench-context";
import {
  PropertyRights,
  IntendedUse,
  ReportType,
  InspectionType,
} from "@/lib/subject-context";
import {
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Home,
  Building2,
  FileText,
  User,
  MapPin,
} from "lucide-react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const PROPERTY_TYPES = [
  "Single Family Residential",
  "Condominium",
  "2-4 Unit Residential",
  "Office",
  "Retail",
  "Industrial",
  "Warehouse",
  "Multifamily (5+ Units)",
  "Mixed Use",
  "Special Purpose",
  "Land / Vacant",
  "Hotel / Motel",
  "Self Storage",
];

const UAD_CONDITIONS = ["C1","C2","C3","C4","C5","C6"];
const UAD_QUALITIES  = ["Q1","Q2","Q3","Q4","Q5","Q6"];

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/60 hover:bg-zinc-800/60 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          {icon}
          {title}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-zinc-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        )}
      </button>
      {open && <div className="px-4 py-4 bg-zinc-950/40 grid grid-cols-2 gap-4">{children}</div>}
    </div>
  );
}

function Field({
  label,
  uadCode,
  required,
  children,
  fullWidth,
}: {
  label: string;
  uadCode?: string;
  required?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "col-span-2" : "col-span-1"}>
      <label className="block text-xs text-zinc-400 mb-1">
        {label}
        {uadCode && (
          <span className="ml-1 text-[10px] text-emerald-500/70 font-mono">[{uadCode}]</span>
        )}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30";

const selectCls =
  "w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30";

export function SubjectPanel() {
  const { subject, setSubject, subjectReady, missingFields } = useSubjectWorkbench();

  const s = (field: keyof typeof subject) => (subject[field] as string) ?? "";
  const n = (field: keyof typeof subject) => (subject[field] as number | null) ?? "";

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      {/* Governance status banner */}
      <div
        className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
          subjectReady
            ? "bg-emerald-950/30 border-emerald-700/40 text-emerald-300"
            : "bg-amber-950/30 border-amber-700/40 text-amber-300"
        }`}
      >
        {subjectReady ? (
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        )}
        <div>
          {subjectReady ? (
            <span className="font-medium">Subject ready — analytical runs may be dispatched.</span>
          ) : (
            <>
              <span className="font-medium">Subject not ready.</span>{" "}
              <span className="text-amber-400/80">
                Complete required fields before running any analysis:{" "}
                {missingFields.join(", ")}.
              </span>
            </>
          )}
        </div>
      </div>

      {/* Section 1 — Appraisal Order */}
      <Section title="Appraisal Order" icon={<ClipboardList className="w-4 h-4 text-emerald-400" />}>
        <Field label="File Number" required>
          <input
            className={inputCls}
            placeholder="e.g. 2026-001"
            value={s("fileNumber")}
            onChange={(e) => setSubject({ fileNumber: e.target.value || null })}
          />
        </Field>
        <Field label="Effective Date of Appraisal" uadCode="EFFECTIVE_DATE" required>
          <input
            type="date"
            className={inputCls}
            value={s("effectiveDate")}
            onChange={(e) => setSubject({ effectiveDate: e.target.value || null })}
          />
        </Field>
        <Field label="Report Date">
          <input
            type="date"
            className={inputCls}
            value={s("reportDate")}
            onChange={(e) => setSubject({ reportDate: e.target.value || null })}
          />
        </Field>
        <Field label="Inspection Date" uadCode="INSPECTION_DATE">
          <input
            type="date"
            className={inputCls}
            value={s("inspectionDate")}
            onChange={(e) => setSubject({ inspectionDate: e.target.value || null })}
          />
        </Field>
        <Field label="Due Date">
          <input
            type="date"
            className={inputCls}
            value={s("dueDate")}
            onChange={(e) => setSubject({ dueDate: e.target.value || null })}
          />
        </Field>
      </Section>

      {/* Section 2 — Assignment Conditions */}
      <Section
        title="Assignment Conditions (USPAP SR 1-2)"
        icon={<FileText className="w-4 h-4 text-blue-400" />}
      >
        <Field label="Intended Use" uadCode="INTENDED_USE" required>
          <select
            className={selectCls}
            value={s("intendedUse")}
            onChange={(e) =>
              setSubject({ intendedUse: (e.target.value as IntendedUse) || null })
            }
          >
            <option value="">— Select —</option>
            {(
              [
                "Mortgage Finance",
                "Estate Planning",
                "Litigation Support",
                "Tax Appeal",
                "Relocation",
                "Private Sale",
                "Insurance",
                "Other",
              ] as IntendedUse[]
            ).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Property Rights Appraised" uadCode="PROPERTY_RIGHTS" required>
          <select
            className={selectCls}
            value={s("propertyRights")}
            onChange={(e) =>
              setSubject({ propertyRights: (e.target.value as PropertyRights) || null })
            }
          >
            <option value="">— Select —</option>
            {(
              [
                "Fee Simple",
                "Leasehold",
                "Fee Simple Subject to",
                "Life Estate",
                "Other",
              ] as PropertyRights[]
            ).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Report Type" uadCode="REPORT_TYPE">
          <select
            className={selectCls}
            value={s("reportType")}
            onChange={(e) =>
              setSubject({ reportType: (e.target.value as ReportType) || null })
            }
          >
            <option value="">— Select —</option>
            <option value="Appraisal Report">Appraisal Report</option>
            <option value="Restricted Appraisal Report">Restricted Appraisal Report</option>
          </select>
        </Field>
        <Field label="Inspection Type" uadCode="INSPECTION_TYPE">
          <select
            className={selectCls}
            value={s("inspectionType")}
            onChange={(e) =>
              setSubject({ inspectionType: (e.target.value as InspectionType) || null })
            }
          >
            <option value="">— Select —</option>
            <option value="Interior and Exterior">Interior and Exterior</option>
            <option value="Exterior Only">Exterior Only (Drive-by)</option>
            <option value="Desktop (No Inspection)">Desktop (No Inspection)</option>
          </select>
        </Field>
        <Field label="Scope of Work Statement" fullWidth>
          <textarea
            className={`${inputCls} h-20 resize-none`}
            placeholder="Describe the scope of work per USPAP SR 1-2(f)..."
            value={s("scopeOfWork")}
            onChange={(e) => setSubject({ scopeOfWork: e.target.value || null })}
          />
        </Field>
        <Field label="Intended Users (comma-separated)" fullWidth>
          <input
            className={inputCls}
            placeholder="e.g. Client, Lender, Court"
            value={subject.intendedUsers.join(", ")}
            onChange={(e) =>
              setSubject({
                intendedUsers: e.target.value
                  .split(",")
                  .map((u) => u.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>
      </Section>

      {/* Section 3 — Client & Lender */}
      <Section
        title="Client & Lender"
        icon={<User className="w-4 h-4 text-purple-400" />}
        defaultOpen={false}
      >
        <Field label="Client Name">
          <input
            className={inputCls}
            placeholder="e.g. John Smith"
            value={s("clientName")}
            onChange={(e) => setSubject({ clientName: e.target.value || null })}
          />
        </Field>
        <Field label="Client Email">
          <input
            type="email"
            className={inputCls}
            placeholder="client@example.com"
            value={s("clientEmail")}
            onChange={(e) => setSubject({ clientEmail: e.target.value || null })}
          />
        </Field>
        <Field label="Lender / Institution">
          <input
            className={inputCls}
            placeholder="e.g. First National Bank"
            value={s("lenderName")}
            onChange={(e) => setSubject({ lenderName: e.target.value || null })}
          />
        </Field>
        <Field label="Loan Number">
          <input
            className={inputCls}
            placeholder="e.g. LN-2026-00123"
            value={s("loanNumber")}
            onChange={(e) => setSubject({ loanNumber: e.target.value || null })}
          />
        </Field>
        <Field label="Appraisal Fee (USD)">
          <input
            type="number"
            className={inputCls}
            placeholder="e.g. 650"
            value={subject.fee ?? ""}
            onChange={(e) => setSubject({ fee: e.target.value ? Number(e.target.value) : null })}
          />
        </Field>
      </Section>

      {/* Section 4 — Subject Property Location */}
      <Section
        title="Subject Property Location"
        icon={<MapPin className="w-4 h-4 text-orange-400" />}
      >
        <Field label="Street Address" required fullWidth>
          <input
            className={inputCls}
            placeholder="e.g. 4521 Congress Avenue"
            value={s("address")}
            onChange={(e) => setSubject({ address: e.target.value || null })}
          />
        </Field>
        <Field label="City" required>
          <input
            className={inputCls}
            placeholder="e.g. Austin"
            value={s("city")}
            onChange={(e) => setSubject({ city: e.target.value || null })}
          />
        </Field>
        <Field label="County">
          <input
            className={inputCls}
            placeholder="e.g. Travis"
            value={s("county")}
            onChange={(e) => setSubject({ county: e.target.value || null })}
          />
        </Field>
        <Field label="State" required>
          <select
            className={selectCls}
            value={s("state")}
            onChange={(e) => setSubject({ state: e.target.value || null })}
          >
            <option value="">— Select —</option>
            {US_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </Field>
        <Field label="ZIP Code">
          <input
            className={inputCls}
            placeholder="e.g. 78701"
            value={s("zip")}
            onChange={(e) => setSubject({ zip: e.target.value || null })}
          />
        </Field>
        <Field label="Parcel Number (APN)">
          <input
            className={inputCls}
            placeholder="e.g. 123-456-789"
            value={s("parcelNumber")}
            onChange={(e) => setSubject({ parcelNumber: e.target.value || null })}
          />
        </Field>
      </Section>

      {/* Section 5 — Subject Property Characteristics */}
      <Section
        title="Subject Property Characteristics"
        icon={<Building2 className="w-4 h-4 text-cyan-400" />}
      >
        <Field label="Property Type" uadCode="PROP_TYPE">
          <select
            className={selectCls}
            value={s("propertyType")}
            onChange={(e) => setSubject({ propertyType: e.target.value || null })}
          >
            <option value="">— Select —</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Year Built" uadCode="YEAR_BUILT">
          <input
            type="number"
            className={inputCls}
            placeholder="e.g. 1998"
            value={n("yearBuilt")}
            onChange={(e) =>
              setSubject({ yearBuilt: e.target.value ? parseInt(e.target.value) : null })
            }
          />
        </Field>
        <Field label="GLA / Rentable Area (sqft)" uadCode="GLA">
          <input
            type="number"
            className={inputCls}
            placeholder="e.g. 2450"
            value={n("gla")}
            onChange={(e) =>
              setSubject({ gla: e.target.value ? parseFloat(e.target.value) : null })
            }
          />
        </Field>
        <Field label="Site Area (sqft)" uadCode="SITE_AREA">
          <input
            type="number"
            className={inputCls}
            placeholder="e.g. 8712"
            value={n("siteArea")}
            onChange={(e) =>
              setSubject({ siteArea: e.target.value ? parseFloat(e.target.value) : null })
            }
          />
        </Field>
        <Field label="Condition" uadCode="CONDITION">
          <select
            className={selectCls}
            value={s("condition")}
            onChange={(e) => setSubject({ condition: e.target.value || null })}
          >
            <option value="">— Select —</option>
            {UAD_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Quality" uadCode="QUALITY">
          <select
            className={selectCls}
            value={s("quality")}
            onChange={(e) => setSubject({ quality: e.target.value || null })}
          >
            <option value="">— Select —</option>
            {UAD_QUALITIES.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Bedrooms" uadCode="BEDROOMS">
          <input
            type="number"
            className={inputCls}
            placeholder="e.g. 3"
            value={n("bedrooms")}
            onChange={(e) =>
              setSubject({ bedrooms: e.target.value ? parseInt(e.target.value) : null })
            }
          />
        </Field>
        <Field label="Bathrooms" uadCode="BATHROOMS">
          <input
            type="number"
            step="0.5"
            className={inputCls}
            placeholder="e.g. 2.5"
            value={n("bathrooms")}
            onChange={(e) =>
              setSubject({ bathrooms: e.target.value ? parseFloat(e.target.value) : null })
            }
          />
        </Field>
        <Field label="Garage Spaces" uadCode="GARAGE">
          <input
            type="number"
            className={inputCls}
            placeholder="e.g. 2"
            value={n("garageSpaces")}
            onChange={(e) =>
              setSubject({ garageSpaces: e.target.value ? parseInt(e.target.value) : null })
            }
          />
        </Field>
        <Field label="Zoning">
          <input
            className={inputCls}
            placeholder="e.g. R-1, C-2, I-1"
            value={s("zoning")}
            onChange={(e) => setSubject({ zoning: e.target.value || null })}
          />
        </Field>
        <Field label="View" uadCode="VIEW">
          <input
            className={inputCls}
            placeholder="e.g. Neutral;Wtr;Pstrl"
            value={s("view")}
            onChange={(e) => setSubject({ view: e.target.value || null })}
          />
        </Field>
        <Field label="Location" uadCode="LOCATION">
          <select
            className={selectCls}
            value={s("location")}
            onChange={(e) => setSubject({ location: e.target.value || null })}
          >
            <option value="">— Select —</option>
            <option value="Neutral">Neutral</option>
            <option value="Beneficial">Beneficial</option>
            <option value="Adverse">Adverse</option>
          </select>
        </Field>
      </Section>
    </div>
  );
}
