"use client";

/**
 * AppraiserProfilePanel
 *
 * Allows the appraiser to enter and persist their license, firm, and
 * certification information. This data is injected into the USPAP
 * certification section of every exported report.
 *
 * Persists to Supabase (when configured) or localStorage (fallback).
 */

import { useState, useEffect } from "react";
import { User, Save, CheckCircle, AlertCircle } from "lucide-react";

interface AppraiserProfile {
  appraiserName: string;
  appraiserTitle: string;
  licenseNumber: string;
  licenseState: string;
  licenseType: string;
  licenseExpiry: string;
  firmName: string;
  firmAddress: string;
  firmPhone: string;
  firmEmail: string;
  designations: string;
}

const STORAGE_KEY = "tf_appraiser_profile";

const LICENSE_TYPES = [
  "Certified General",
  "Certified Residential",
  "Licensed Residential",
  "Trainee",
];

export function AppraiserProfilePanel() {
  const [profile, setProfile] = useState<AppraiserProfile>({
    appraiserName: "",
    appraiserTitle: "Certified General Appraiser",
    licenseNumber: "",
    licenseState: "TX",
    licenseType: "Certified General",
    licenseExpiry: "",
    firmName: "",
    firmAddress: "",
    firmPhone: "",
    firmEmail: "",
    designations: "",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProfile(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));

      // Try Supabase
      try {
        await fetch("/api/appraiser-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        });
      } catch {
        // Supabase not configured — localStorage only
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const field = (
    label: string,
    key: keyof AppraiserProfile,
    type: string = "text",
    placeholder?: string
  ) => (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <input
        type={type}
        value={profile[key]}
        onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className="mt-0.5 h-8 w-full px-2 text-xs rounded border border-border bg-background"
      />
    </div>
  );

  const isComplete = profile.appraiserName && profile.licenseNumber && profile.licenseState;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-[hsl(var(--tf-transcend-cyan))]" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Appraiser Profile</h2>
            <p className="text-xs text-muted-foreground">License, firm, and certification information</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-8 px-4 text-xs rounded-md bg-[hsl(var(--tf-transcend-cyan))] text-background font-medium disabled:opacity-50 flex items-center gap-1.5"
        >
          {saved ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? "Saved!" : saving ? "Saving…" : "Save Profile"}
        </button>
      </div>

      {!isComplete && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Complete your profile to enable USPAP certification in exported reports.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Appraiser Identity */}
        <div className="col-span-2 rounded-md border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Appraiser Identity</p>
          <div className="grid grid-cols-2 gap-3">
            {field("Full Name", "appraiserName", "text", "Robert Chen, MAI")}
            {field("Title / Designation", "appraiserTitle", "text", "Certified General Appraiser")}
          </div>
        </div>

        {/* License Information */}
        <div className="col-span-2 rounded-md border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">License Information</p>
          <div className="grid grid-cols-4 gap-3">
            {field("License Number", "licenseNumber", "text", "TX-1234567")}
            {field("License State", "licenseState", "text", "TX")}
            <div>
              <label className="text-xs text-muted-foreground">License Type</label>
              <select
                value={profile.licenseType}
                onChange={(e) => setProfile((p) => ({ ...p, licenseType: e.target.value }))}
                className="mt-0.5 h-8 w-full px-2 text-xs rounded border border-border bg-background"
              >
                {LICENSE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            {field("License Expiry", "licenseExpiry", "date")}
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Designations (comma-separated)</label>
            <input
              type="text"
              value={profile.designations}
              onChange={(e) => setProfile((p) => ({ ...p, designations: e.target.value }))}
              placeholder="MAI, SRA, AI-GRS"
              className="mt-0.5 h-8 w-full px-2 text-xs rounded border border-border bg-background"
            />
          </div>
        </div>

        {/* Firm Information */}
        <div className="col-span-2 rounded-md border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Firm Information</p>
          <div className="grid grid-cols-2 gap-3">
            {field("Firm Name", "firmName", "text", "TerraFusion Appraisal Services")}
            {field("Firm Address", "firmAddress", "text", "123 Main St, Austin, TX 78701")}
            {field("Phone", "firmPhone", "tel", "(512) 555-0100")}
            {field("Email", "firmEmail", "email", "appraisals@terrafusion.com")}
          </div>
        </div>
      </div>

      {/* Preview */}
      {isComplete && (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">USPAP Certification Preview</span>
          </div>
          <div className="font-mono text-xs text-foreground/80 space-y-0.5">
            <p>{profile.appraiserName}</p>
            <p>{profile.appraiserTitle}</p>
            <p>License #{profile.licenseNumber} — {profile.licenseState} {profile.licenseType}</p>
            {profile.licenseExpiry && <p>Expires: {new Date(profile.licenseExpiry).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>}
            {profile.firmName && <p>{profile.firmName}</p>}
            {profile.designations && <p>Designations: {profile.designations}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
