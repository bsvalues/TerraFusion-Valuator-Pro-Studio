"use client";

import { useState, useEffect } from "react";
import { Save, User, Shield, FileText, Award, Building2, Phone, Mail, Globe, Upload, CheckCircle, AlertCircle, Camera } from "lucide-react";

export interface AppraiserProfile {
  // Personal
  firstName: string;
  lastName: string;
  title: string; // MAI, SRA, AI-RRS, etc.
  email: string;
  phone: string;
  website: string;
  // Firm
  firmName: string;
  firmAddress: string;
  firmCity: string;
  firmState: string;
  firmZip: string;
  // Licensing
  licenseNumber: string;
  licenseType: string; // Certified General, Certified Residential, Licensed
  licenseState: string;
  licenseExpiry: string;
  // Additional licenses
  additionalLicenses: { state: string; number: string; expiry: string }[];
  // Designations
  designations: string[]; // MAI, SRA, AI-GRS, CCIM, etc.
  // E&O Insurance
  eoCarrier: string;
  eoPolicyNumber: string;
  eoExpiry: string;
  eoCoverage: string;
  // Report defaults
  defaultIntendedUse: string;
  defaultReportType: string;
  defaultScopeOfWork: string;
  // Signature
  signatureText: string;
  certificationStatement: string;
}

const DEFAULT_PROFILE: AppraiserProfile = {
  firstName: "",
  lastName: "",
  title: "",
  email: "",
  phone: "",
  website: "",
  firmName: "",
  firmAddress: "",
  firmCity: "",
  firmState: "TX",
  firmZip: "",
  licenseNumber: "",
  licenseType: "Certified General",
  licenseState: "TX",
  licenseExpiry: "",
  additionalLicenses: [],
  designations: [],
  eoCarrier: "",
  eoPolicyNumber: "",
  eoExpiry: "",
  eoCoverage: "1,000,000",
  defaultIntendedUse: "Mortgage Lending / Financing",
  defaultReportType: "Summary Appraisal",
  defaultScopeOfWork: "Interior & Exterior Inspection",
  signatureText: "",
  certificationStatement: "",
};

const LICENSE_TYPES = [
  "Certified General",
  "Certified Residential",
  "Licensed Residential",
  "Trainee / Apprentice",
];

const DESIGNATIONS = [
  "MAI", "SRA", "AI-GRS", "AI-RRS", "CCIM", "CRE", "FRICS", "MRICS",
  "ASA", "CVA", "CGREA", "RAA", "GAA",
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const STORAGE_KEY = "terrafusion_appraiser_profile";

export function useAppraiserProfile() {
  const [profile, setProfile] = useState<AppraiserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setProfile(JSON.parse(stored));
    } catch {}
  }, []);

  const saveProfile = (p: AppraiserProfile) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setProfile(p);
  };

  return { profile, saveProfile };
}

export function AppraiserProfilePage() {
  const [profile, setProfile] = useState<AppraiserProfile>(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "licensing" | "firm" | "defaults">("personal");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setProfile(JSON.parse(stored));
    } catch {}
  }, []);

  const update = (field: keyof AppraiserProfile, value: unknown) => {
    setProfile((p) => ({ ...p, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleDesignation = (d: string) => {
    const current = profile.designations || [];
    if (current.includes(d)) {
      update("designations", current.filter((x) => x !== d));
    } else {
      update("designations", [...current, d]);
    }
  };

  const addLicense = () => {
    update("additionalLicenses", [
      ...(profile.additionalLicenses || []),
      { state: "", number: "", expiry: "" },
    ]);
  };

  const removeLicense = (i: number) => {
    update(
      "additionalLicenses",
      (profile.additionalLicenses || []).filter((_, idx) => idx !== i)
    );
  };

  const updateLicense = (i: number, field: string, value: string) => {
    const updated = [...(profile.additionalLicenses || [])];
    updated[i] = { ...updated[i], [field]: value };
    update("additionalLicenses", updated);
  };

  const licenseExpired = profile.licenseExpiry && new Date(profile.licenseExpiry) < new Date();
  const eoExpired = profile.eoExpiry && new Date(profile.eoExpiry) < new Date();
  const profileComplete =
    profile.firstName && profile.lastName && profile.licenseNumber &&
    profile.licenseState && profile.firmName && profile.email;

  const tabs = [
    { id: "personal" as const, label: "Personal", icon: User },
    { id: "licensing" as const, label: "Licensing & Credentials", icon: Shield },
    { id: "firm" as const, label: "Firm & Contact", icon: Building2 },
    { id: "defaults" as const, label: "Report Defaults", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-cyan-400 font-mono tracking-wider">
            APPRAISER PROFILE & CREDENTIALS
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Your profile auto-populates all appraisal reports and certifications
          </p>
        </div>
        <div className="flex items-center gap-3">
          {profileComplete ? (
            <span className="flex items-center gap-1 text-xs text-cyan-400">
              <CheckCircle className="w-4 h-4" /> Profile Complete
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-yellow-400">
              <AlertCircle className="w-4 h-4" /> Profile Incomplete
            </span>
          )}
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold rounded border transition-all ${
              saved
                ? "border-cyan-400 text-cyan-400 bg-cyan-400/10"
                : "border-cyan-500 text-black bg-cyan-500 hover:bg-cyan-400"
            }`}
          >
            {saved ? <CheckCircle className="w-3 h-3" /> : <Save className="w-3 h-3" />}
            {saved ? "SAVED" : "SAVE PROFILE"}
          </button>
        </div>
      </div>

      {/* Profile Preview Card */}
      {profile.firstName && (
        <div className="border border-cyan-500/30 rounded bg-cyan-500/5 p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full border-2 border-cyan-500 bg-gray-900 flex items-center justify-center text-cyan-400 text-xl font-bold">
            {profile.firstName[0]}{profile.lastName[0]}
          </div>
          <div>
            <div className="text-white font-bold text-lg">
              {profile.firstName} {profile.lastName}
              {profile.title && <span className="text-cyan-400 ml-2 text-sm">{profile.title}</span>}
            </div>
            <div className="text-gray-400 text-xs mt-0.5">
              {profile.firmName && <span>{profile.firmName} · </span>}
              {profile.licenseType && <span>{profile.licenseType} · </span>}
              {profile.licenseState && <span>License #{profile.licenseNumber} ({profile.licenseState})</span>}
            </div>
            {profile.designations?.length > 0 && (
              <div className="flex gap-1 mt-1">
                {profile.designations.map((d) => (
                  <span key={d} className="text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded px-1.5 py-0.5">
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="ml-auto text-right text-xs text-gray-400">
            {licenseExpired ? (
              <span className="text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> License EXPIRED</span>
            ) : profile.licenseExpiry ? (
              <span className="text-cyan-400">License valid thru {new Date(profile.licenseExpiry).toLocaleDateString()}</span>
            ) : null}
            {eoExpired ? (
              <div className="text-red-400 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> E&O EXPIRED</div>
            ) : profile.eoExpiry ? (
              <div className="text-cyan-400 mt-1">E&O valid thru {new Date(profile.eoExpiry).toLocaleDateString()}</div>
            ) : null}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-700">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold border-b-2 transition-colors ${
              activeTab === id
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            <Icon className="w-3 h-3" />
            {label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab: Personal */}
      {activeTab === "personal" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Personal Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">FIRST NAME *</label>
                <input
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                  value={profile.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">LAST NAME *</label>
                <input
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                  value={profile.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  placeholder="Smith"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">PROFESSIONAL TITLE / SUFFIX</label>
              <input
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                value={profile.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="MAI, SRA, CCIM..."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">EMAIL *</label>
              <input
                type="email"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                value={profile.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="john.smith@appraisalfirm.com"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">PHONE</label>
              <input
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                value={profile.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="(512) 555-0100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">WEBSITE</label>
              <input
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                value={profile.website}
                onChange={(e) => update("website", e.target.value)}
                placeholder="https://www.appraisalfirm.com"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Professional Designations</h3>
            <p className="text-xs text-gray-400">Select all designations you hold. These appear on all reports.</p>
            <div className="grid grid-cols-3 gap-2">
              {DESIGNATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDesignation(d)}
                  className={`px-3 py-2 text-xs font-mono font-bold rounded border transition-all ${
                    profile.designations?.includes(d)
                      ? "border-cyan-400 text-cyan-400 bg-cyan-400/10"
                      : "border-gray-600 text-gray-400 hover:border-gray-400"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider mt-4">Signature Block</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">SIGNATURE TEXT (appears on report)</label>
              <input
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                value={profile.signatureText}
                onChange={(e) => update("signatureText", e.target.value)}
                placeholder="John Smith, MAI, SRA"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Licensing */}
      {activeTab === "licensing" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Primary License */}
            <div className="border border-gray-700 rounded p-4 space-y-3">
              <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-3 h-3" /> Primary Appraiser License
              </h3>
              <div>
                <label className="block text-xs text-gray-400 mb-1">LICENSE TYPE *</label>
                <select
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                  value={profile.licenseType}
                  onChange={(e) => update("licenseType", e.target.value)}
                >
                  {LICENSE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">LICENSE NUMBER *</label>
                <input
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                  value={profile.licenseNumber}
                  onChange={(e) => update("licenseNumber", e.target.value)}
                  placeholder="TX-1234567"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">STATE *</label>
                  <select
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                    value={profile.licenseState}
                    onChange={(e) => update("licenseState", e.target.value)}
                  >
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">EXPIRY DATE</label>
                  <input
                    type="date"
                    className={`w-full bg-gray-900 border rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none ${
                      licenseExpired ? "border-red-500" : "border-gray-700"
                    }`}
                    value={profile.licenseExpiry}
                    onChange={(e) => update("licenseExpiry", e.target.value)}
                  />
                  {licenseExpired && (
                    <p className="text-xs text-red-400 mt-1">⚠ License is expired</p>
                  )}
                </div>
              </div>
            </div>

            {/* E&O Insurance */}
            <div className="border border-gray-700 rounded p-4 space-y-3">
              <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-3 h-3" /> E&O Insurance
              </h3>
              <div>
                <label className="block text-xs text-gray-400 mb-1">CARRIER</label>
                <input
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                  value={profile.eoCarrier}
                  onChange={(e) => update("eoCarrier", e.target.value)}
                  placeholder="LIA, OREP, Victor O. Schinnerer..."
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">POLICY NUMBER</label>
                <input
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                  value={profile.eoPolicyNumber}
                  onChange={(e) => update("eoPolicyNumber", e.target.value)}
                  placeholder="EO-2026-XXXXXXX"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">EXPIRY DATE</label>
                  <input
                    type="date"
                    className={`w-full bg-gray-900 border rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none ${
                      eoExpired ? "border-red-500" : "border-gray-700"
                    }`}
                    value={profile.eoExpiry}
                    onChange={(e) => update("eoExpiry", e.target.value)}
                  />
                  {eoExpired && (
                    <p className="text-xs text-red-400 mt-1">⚠ E&O is expired</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">COVERAGE LIMIT</label>
                  <select
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                    value={profile.eoCoverage}
                    onChange={(e) => update("eoCoverage", e.target.value)}
                  >
                    {["250,000","500,000","1,000,000","2,000,000","5,000,000"].map((c) => (
                      <option key={c} value={c}>${c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Additional State Licenses */}
          <div className="border border-gray-700 rounded p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                Additional State Licenses (Multi-State)
              </h3>
              <button
                onClick={addLicense}
                className="text-xs font-mono text-cyan-400 border border-cyan-500/50 rounded px-3 py-1 hover:bg-cyan-500/10"
              >
                + ADD STATE
              </button>
            </div>
            {(profile.additionalLicenses || []).length === 0 ? (
              <p className="text-xs text-gray-500 italic">No additional state licenses added.</p>
            ) : (
              <div className="space-y-2">
                {(profile.additionalLicenses || []).map((lic, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 items-center">
                    <select
                      className="bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                      value={lic.state}
                      onChange={(e) => updateLicense(i, "state", e.target.value)}
                    >
                      <option value="">State</option>
                      {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input
                      className="bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                      value={lic.number}
                      onChange={(e) => updateLicense(i, "number", e.target.value)}
                      placeholder="License #"
                    />
                    <input
                      type="date"
                      className="bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                      value={lic.expiry}
                      onChange={(e) => updateLicense(i, "expiry", e.target.value)}
                    />
                    <button
                      onClick={() => removeLicense(i)}
                      className="text-xs text-red-400 hover:text-red-300 font-mono"
                    >
                      REMOVE
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Firm */}
      {activeTab === "firm" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Firm Information</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">FIRM / COMPANY NAME *</label>
              <input
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                value={profile.firmName}
                onChange={(e) => update("firmName", e.target.value)}
                placeholder="Smith Appraisal Group, LLC"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">STREET ADDRESS</label>
              <input
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                value={profile.firmAddress}
                onChange={(e) => update("firmAddress", e.target.value)}
                placeholder="100 Congress Ave, Suite 200"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-xs text-gray-400 mb-1">CITY</label>
                <input
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                  value={profile.firmCity}
                  onChange={(e) => update("firmCity", e.target.value)}
                  placeholder="Austin"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">STATE</label>
                <select
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                  value={profile.firmState}
                  onChange={(e) => update("firmState", e.target.value)}
                >
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">ZIP</label>
                <input
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                  value={profile.firmZip}
                  onChange={(e) => update("firmZip", e.target.value)}
                  placeholder="78701"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Contact Details</h3>
            <div className="border border-gray-700 rounded p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Mail className="w-3 h-3" />
                <span>These appear in the report header and certification block</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">BUSINESS EMAIL</label>
                  <input
                    type="email"
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                    value={profile.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="info@smithappraisalgroup.com"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">BUSINESS PHONE</label>
                  <input
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                    value={profile.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="(512) 555-0100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">WEBSITE</label>
                  <input
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                    value={profile.website}
                    onChange={(e) => update("website", e.target.value)}
                    placeholder="https://www.smithappraisalgroup.com"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Report Defaults */}
      {activeTab === "defaults" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Default Report Settings</h3>
            <p className="text-xs text-gray-400">
              These values pre-populate every new appraisal report you create.
            </p>
            <div>
              <label className="block text-xs text-gray-400 mb-1">DEFAULT INTENDED USE</label>
              <select
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                value={profile.defaultIntendedUse}
                onChange={(e) => update("defaultIntendedUse", e.target.value)}
              >
                {[
                  "Mortgage Lending / Financing",
                  "Estate / Tax Planning",
                  "Litigation Support",
                  "Investment Analysis",
                  "Insurance",
                  "Portfolio Review",
                  "Relocation",
                  "PMI Removal",
                  "Other",
                ].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">DEFAULT REPORT TYPE</label>
              <select
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                value={profile.defaultReportType}
                onChange={(e) => update("defaultReportType", e.target.value)}
              >
                {[
                  "Summary Appraisal",
                  "Self-Contained Appraisal",
                  "Restricted Appraisal",
                  "Desktop Appraisal",
                  "Hybrid Appraisal",
                  "Review Appraisal",
                ].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">DEFAULT SCOPE OF WORK</label>
              <select
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                value={profile.defaultScopeOfWork}
                onChange={(e) => update("defaultScopeOfWork", e.target.value)}
              >
                {[
                  "Interior & Exterior Inspection",
                  "Exterior Only (Drive-By)",
                  "Desktop / No Inspection",
                  "Hybrid (Third-Party Inspection)",
                ].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Certification Statement</h3>
            <p className="text-xs text-gray-400">
              Custom certification language appended to the USPAP SR 2-3 certification block.
            </p>
            <textarea
              className="w-full h-40 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none resize-none"
              value={profile.certificationStatement}
              onChange={(e) => update("certificationStatement", e.target.value)}
              placeholder="I have performed no services, as an appraiser or in any other capacity, regarding the property that is the subject of this report within the three-year period immediately preceding acceptance of this assignment..."
            />
            <div className="border border-cyan-500/20 rounded p-3 bg-cyan-500/5">
              <p className="text-xs text-cyan-400 font-mono font-bold mb-1">USPAP COMPLIANCE NOTE</p>
              <p className="text-xs text-gray-400">
                The standard 10-point USPAP SR 2-3 certification is always included. Your custom statement is appended as an additional certification item.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save Button Bottom */}
      <div className="flex justify-end pt-4 border-t border-gray-700">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-mono font-bold rounded border transition-all ${
            saved
              ? "border-cyan-400 text-cyan-400 bg-cyan-400/10"
              : "border-cyan-500 text-black bg-cyan-500 hover:bg-cyan-400"
          }`}
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "PROFILE SAVED" : "SAVE PROFILE"}
        </button>
      </div>
    </div>
  );
}
