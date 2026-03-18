"use client";

/**
 * IncomeApproachPanel
 *
 * Governed income approach UI for TerraFusion Valuator Pro.
 * Supports Direct Capitalization and Discounted Cash Flow (DCF) methods.
 *
 * Tabs:
 *  1. Rent Roll — tenant leases, market rent, lease terms
 *  2. Expenses — operating expense schedule by category
 *  3. Market Data — cap rate, vacancy, DCF parameters
 *  4. Direct Cap — PGI→EGI→NOI→Value waterfall
 *  5. DCF — 10-year projection table, reversion, IRR, sensitivity matrix
 *  6. Evidence — audit trail with UAD INC-field refs
 */

import { useState, useCallback } from "react";
import { useSubjectWorkbench } from "@/lib/subject-workbench-context";
import {
  IncomeVault,
  TenantLease,
  OperatingExpense,
  DirectCapResult,
  DCFResult,
  IncomeRunEvidence,
  LeaseType,
  TenantCreditRating,
  ExpenseCategory,
  CapRateSource,
  createIncomeVault,
  addTenant,
  removeTenant,
  updateTenant,
  addExpense,
  removeExpense,
  updateMarketData,
  validateIncomeVault,
  computeDirectCap,
  computeDCF,
  emitIncomeEvidence,
} from "@/lib/income-vault";
import { newRunId, newCorrelationId } from "@/lib/subject-context";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt$(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function fmtPct(n: number, decimals = 2) {
  return `${(n * 100).toFixed(decimals)}%`;
}
function fmtNum(n: number, decimals = 2) {
  return n.toFixed(decimals);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-1.5 border-b border-border last:border-0 ${highlight ? "font-semibold" : ""}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-mono ${highlight ? "text-[hsl(var(--tf-transcend-cyan))]" : ""}`}>{value}</span>
    </div>
  );
}

function SectionHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {badge && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--tf-transcend-cyan)/0.15)] text-[hsl(var(--tf-transcend-cyan))]">
          {badge}
        </span>
      )}
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

type PanelTab = "rentroll" | "expenses" | "market" | "directcap" | "dcf" | "evidence";

const TABS: { id: PanelTab; label: string }[] = [
  { id: "rentroll", label: "Rent Roll" },
  { id: "expenses", label: "Expenses" },
  { id: "market", label: "Market Data" },
  { id: "directcap", label: "Direct Cap" },
  { id: "dcf", label: "DCF" },
  { id: "evidence", label: "Evidence" },
];

const LEASE_TYPES: LeaseType[] = ["NNN", "NN", "N", "Gross", "Modified Gross", "Absolute Net"];
const CREDIT_RATINGS: TenantCreditRating[] = ["National", "Regional", "Local", "Startup", "Vacant"];
const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Real Estate Taxes",
  "Insurance",
  "Management Fee",
  "Maintenance & Repairs",
  "Utilities",
  "Janitorial",
  "Landscaping",
  "Security",
  "Administrative",
  "Reserves for Replacement",
  "Other",
];
const CAP_RATE_SOURCES: CapRateSource[] = [
  "Market Extraction",
  "Investor Survey",
  "Band of Investment",
  "Built-Up Method",
  "Comparable Sales",
];

export function IncomeApproachPanel() {
  const { subject, dispatchRun } = useSubjectWorkbench();
  const [activeTab, setActiveTab] = useState<PanelTab>("rentroll");
  const [vault, setVault] = useState<IncomeVault>(() =>
    createIncomeVault(subject?.fileNumber ?? "DRAFT", subject?.propertyType ?? "Commercial", 5000)
  );
  const [reasonCode, setReasonCode] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [directCapResult, setDirectCapResult] = useState<DirectCapResult | null>(null);
  const [dcfResult, setDcfResult] = useState<DCFResult | null>(null);
  const [evidence, setEvidence] = useState<IncomeRunEvidence | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [runWarnings, setRunWarnings] = useState<string[]>([]);

  // ── New tenant form state ──────────────────────────────────────────────────
  const [newTenant, setNewTenant] = useState<Omit<TenantLease, "tenantId">>({
    tenantName: "",
    suiteNumber: "",
    rentableSqft: 1000,
    leaseType: "NNN",
    creditRating: "Local",
    contractRentPerSqft: 20,
    marketRentPerSqft: 20,
    leaseStartDate: "",
    leaseEndDate: "",
    annualEscalation: 0.03,
    tiAllowance: 0,
    leasingCommissionPct: 0.05,
    renewalProbability: 0.7,
    freeRentMonths: 0,
    notes: "",
  });

  // ── New expense form state ─────────────────────────────────────────────────
  const [newExpense, setNewExpense] = useState<Omit<OperatingExpense, "expenseId" | "pctOfEGI">>({
    category: "Management Fee",
    label: "",
    annualAmount: 0,
    source: "",
    notes: "",
  });

  // ── Governance run ─────────────────────────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (!reasonCode || reasonCode.trim().length < 3) {
      setRunError("Reason code is required (min 3 characters).");
      return;
    }
    const governance = validateIncomeVault(vault);
    if (!governance.valid) {
      setRunError(governance.errors.join(" | "));
      return;
    }

    setIsRunning(true);
    setRunError(null);

    const runId = newRunId();
    const correlationId = newCorrelationId();

    try {
      const resp = await fetch("/api/income-approach/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vault,
          reason_code: reasonCode,
          correlation_id: correlationId,
          run_id: runId,
          include_dcf: true,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setRunError(data.error ?? "Calculation failed.");
        setRunWarnings(data.warnings ?? []);
        return;
      }

      setDirectCapResult(data.direct_cap);
      setDcfResult(data.dcf);
      setEvidence(data.evidence);
      setRunWarnings(data.warnings ?? []);

      // Register in governance spine
      dispatchRun(
        "income_direct_cap",
        reasonCode,
        data.evidence.inputSnapshot as Record<string, unknown>
      );

      setActiveTab("directcap");
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRunning(false);
    }
  }, [vault, reasonCode, dispatchRun]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Income Approach</h2>
          <p className="text-xs text-muted-foreground">Direct Capitalization &amp; Discounted Cash Flow</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Reason code (min 3 chars)…"
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value)}
            className="h-8 px-3 text-xs rounded-md border border-border bg-background w-52"
          />
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="h-8 px-4 text-xs rounded-md bg-[hsl(var(--tf-transcend-cyan))] text-background font-medium disabled:opacity-50"
          >
            {isRunning ? "Running…" : "Run Income Analysis"}
          </button>
        </div>
      </div>

      {/* Error/Warning strip */}
      {runError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {runError}
        </div>
      )}
      {runWarnings.length > 0 && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 space-y-0.5">
          {runWarnings.map((w, i) => (
            <div key={i}>⚠ {w}</div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors ${
              activeTab === t.id
                ? "bg-[hsl(var(--tf-transcend-cyan)/0.15)] text-[hsl(var(--tf-transcend-cyan))] border-b-2 border-[hsl(var(--tf-transcend-cyan))]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {/* ── Rent Roll ── */}
        {activeTab === "rentroll" && (
          <div className="space-y-4">
            <SectionHeader title="Rent Roll" badge={`${vault.tenants.length} tenant(s)`} />

            {/* Property GLA */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground w-40">Total Rentable Area (SF)</label>
              <input
                type="number"
                value={vault.totalRentableSqft}
                onChange={(e) => setVault((v) => ({ ...v, totalRentableSqft: +e.target.value }))}
                className="h-8 px-3 text-xs rounded-md border border-border bg-background w-32"
              />
            </div>

            {/* Existing tenants */}
            {vault.tenants.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-1.5 pr-2">Tenant</th>
                      <th className="text-left py-1.5 pr-2">Suite</th>
                      <th className="text-right py-1.5 pr-2">SF</th>
                      <th className="text-left py-1.5 pr-2">Lease</th>
                      <th className="text-right py-1.5 pr-2">Mkt $/SF</th>
                      <th className="text-right py-1.5 pr-2">Annual Mkt Rent</th>
                      <th className="text-left py-1.5 pr-2">Credit</th>
                      <th className="text-center py-1.5">Del</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vault.tenants.map((t) => (
                      <tr key={t.tenantId} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-1.5 pr-2 font-medium">{t.tenantName || "—"}</td>
                        <td className="py-1.5 pr-2">{t.suiteNumber}</td>
                        <td className="py-1.5 pr-2 text-right font-mono">{t.rentableSqft.toLocaleString()}</td>
                        <td className="py-1.5 pr-2">{t.leaseType}</td>
                        <td className="py-1.5 pr-2 text-right font-mono">${t.marketRentPerSqft.toFixed(2)}</td>
                        <td className="py-1.5 pr-2 text-right font-mono">
                          {fmt$(t.marketRentPerSqft * t.rentableSqft)}
                        </td>
                        <td className="py-1.5 pr-2">{t.creditRating}</td>
                        <td className="py-1.5 text-center">
                          <button
                            onClick={() => setVault((v) => removeTenant(v, t.tenantId))}
                            className="text-destructive hover:text-destructive/80 text-xs"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border font-semibold">
                      <td colSpan={2} className="py-1.5 text-xs">Total</td>
                      <td className="py-1.5 text-right font-mono text-xs">
                        {vault.tenants.reduce((s, t) => s + t.rentableSqft, 0).toLocaleString()}
                      </td>
                      <td colSpan={2} />
                      <td className="py-1.5 text-right font-mono text-xs text-[hsl(var(--tf-transcend-cyan))]">
                        {fmt$(vault.tenants.reduce((s, t) => s + t.marketRentPerSqft * t.rentableSqft, 0))}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Add tenant form */}
            <div className="rounded-md border border-border p-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Add Tenant / Unit</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Tenant Name</label>
                  <input
                    type="text"
                    value={newTenant.tenantName}
                    onChange={(e) => setNewTenant((p) => ({ ...p, tenantName: e.target.value }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Suite #</label>
                  <input
                    type="text"
                    value={newTenant.suiteNumber}
                    onChange={(e) => setNewTenant((p) => ({ ...p, suiteNumber: e.target.value }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Rentable SF</label>
                  <input
                    type="number"
                    value={newTenant.rentableSqft}
                    onChange={(e) => setNewTenant((p) => ({ ...p, rentableSqft: +e.target.value }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Lease Type</label>
                  <select
                    value={newTenant.leaseType}
                    onChange={(e) => setNewTenant((p) => ({ ...p, leaseType: e.target.value as LeaseType }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  >
                    {LEASE_TYPES.map((lt) => <option key={lt}>{lt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Credit Rating</label>
                  <select
                    value={newTenant.creditRating}
                    onChange={(e) => setNewTenant((p) => ({ ...p, creditRating: e.target.value as TenantCreditRating }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  >
                    {CREDIT_RATINGS.map((cr) => <option key={cr}>{cr}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Market Rent $/SF/yr</label>
                  <input
                    type="number"
                    step="0.50"
                    value={newTenant.marketRentPerSqft}
                    onChange={(e) => setNewTenant((p) => ({ ...p, marketRentPerSqft: +e.target.value }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Contract Rent $/SF/yr</label>
                  <input
                    type="number"
                    step="0.50"
                    value={newTenant.contractRentPerSqft}
                    onChange={(e) => setNewTenant((p) => ({ ...p, contractRentPerSqft: +e.target.value }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Annual Escalation</label>
                  <input
                    type="number"
                    step="0.005"
                    value={newTenant.annualEscalation}
                    onChange={(e) => setNewTenant((p) => ({ ...p, annualEscalation: +e.target.value }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Renewal Probability</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={newTenant.renewalProbability}
                    onChange={(e) => setNewTenant((p) => ({ ...p, renewalProbability: +e.target.value }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  setVault((v) => addTenant(v, newTenant));
                  setNewTenant((p) => ({ ...p, tenantName: "", suiteNumber: "" }));
                }}
                className="h-7 px-4 text-xs rounded bg-[hsl(var(--tf-transcend-cyan)/0.2)] text-[hsl(var(--tf-transcend-cyan))] font-medium hover:bg-[hsl(var(--tf-transcend-cyan)/0.3)]"
              >
                + Add Tenant
              </button>
            </div>
          </div>
        )}

        {/* ── Expenses ── */}
        {activeTab === "expenses" && (
          <div className="space-y-4">
            <SectionHeader title="Operating Expense Schedule" badge={`${vault.expenses.length} line(s)`} />

            {vault.expenses.length > 0 && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-1.5 pr-2">Category</th>
                    <th className="text-left py-1.5 pr-2">Label</th>
                    <th className="text-right py-1.5 pr-2">Annual $</th>
                    <th className="text-left py-1.5 pr-2">Source</th>
                    <th className="text-center py-1.5">Del</th>
                  </tr>
                </thead>
                <tbody>
                  {vault.expenses.map((e) => (
                    <tr key={e.expenseId} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-1.5 pr-2">{e.category}</td>
                      <td className="py-1.5 pr-2">{e.label}</td>
                      <td className="py-1.5 pr-2 text-right font-mono">{fmt$(e.annualAmount)}</td>
                      <td className="py-1.5 pr-2 text-muted-foreground">{e.source}</td>
                      <td className="py-1.5 text-center">
                        <button
                          onClick={() => setVault((v) => removeExpense(v, e.expenseId))}
                          className="text-destructive text-xs"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border font-semibold">
                    <td colSpan={2} className="py-1.5 text-xs">Total Operating Expenses</td>
                    <td className="py-1.5 text-right font-mono text-xs text-[hsl(var(--tf-transcend-cyan))]">
                      {fmt$(vault.expenses.reduce((s, e) => s + e.annualAmount, 0))}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            )}

            {/* Add expense form */}
            <div className="rounded-md border border-border p-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Add Expense Line</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Category</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense((p) => ({ ...p, category: e.target.value as ExpenseCategory }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  >
                    {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Label / Description</label>
                  <input
                    type="text"
                    value={newExpense.label}
                    onChange={(e) => setNewExpense((p) => ({ ...p, label: e.target.value }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Annual Amount ($)</label>
                  <input
                    type="number"
                    value={newExpense.annualAmount}
                    onChange={(e) => setNewExpense((p) => ({ ...p, annualAmount: +e.target.value }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Source</label>
                  <input
                    type="text"
                    value={newExpense.source}
                    onChange={(e) => setNewExpense((p) => ({ ...p, source: e.target.value }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  setVault((v) => addExpense(v, newExpense));
                  setNewExpense((p) => ({ ...p, label: "", annualAmount: 0, source: "" }));
                }}
                className="h-7 px-4 text-xs rounded bg-[hsl(var(--tf-transcend-cyan)/0.2)] text-[hsl(var(--tf-transcend-cyan))] font-medium hover:bg-[hsl(var(--tf-transcend-cyan)/0.3)]"
              >
                + Add Expense
              </button>
            </div>
          </div>
        )}

        {/* ── Market Data ── */}
        {activeTab === "market" && (
          <div className="space-y-4">
            <SectionHeader title="Market Data &amp; Parameters" />
            <div className="grid grid-cols-2 gap-4">
              {/* Direct Cap params */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Direct Capitalization</p>
                <div>
                  <label className="text-xs text-muted-foreground">Market Vacancy Rate</label>
                  <input
                    type="number"
                    step="0.005"
                    min="0"
                    max="0.5"
                    value={vault.marketData.marketVacancyRate}
                    onChange={(e) => setVault((v) => updateMarketData(v, { marketVacancyRate: +e.target.value }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Vacancy Source</label>
                  <input
                    type="text"
                    value={vault.marketData.marketVacancySource}
                    onChange={(e) => setVault((v) => updateMarketData(v, { marketVacancySource: e.target.value }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                    placeholder="e.g., CoStar Q4 2025 Market Report"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Credit Loss Rate</label>
                  <input
                    type="number"
                    step="0.005"
                    min="0"
                    max="0.1"
                    value={vault.marketData.creditLossRate}
                    onChange={(e) => setVault((v) => updateMarketData(v, { creditLossRate: +e.target.value }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Capitalization Rate</label>
                  <input
                    type="number"
                    step="0.0025"
                    min="0.01"
                    max="0.3"
                    value={vault.marketData.capRate}
                    onChange={(e) => setVault((v) => updateMarketData(v, { capRate: +e.target.value }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Cap Rate Source</label>
                  <select
                    value={vault.marketData.capRateSource}
                    onChange={(e) => setVault((v) => updateMarketData(v, { capRateSource: e.target.value as CapRateSource }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  >
                    {CAP_RATE_SOURCES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Cap Rate Supporting Data</label>
                  <textarea
                    value={vault.marketData.capRateSupportingData}
                    onChange={(e) => setVault((v) => updateMarketData(v, { capRateSupportingData: e.target.value }))}
                    rows={2}
                    className="mt-0.5 w-full px-2 py-1 text-xs rounded border border-border bg-background resize-none"
                    placeholder="Cite comparable sales, investor surveys, or other market evidence…"
                  />
                </div>
              </div>

              {/* DCF params */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">DCF Parameters</p>
                <div>
                  <label className="text-xs text-muted-foreground">Discount Rate</label>
                  <input
                    type="number"
                    step="0.0025"
                    min="0.03"
                    max="0.3"
                    value={vault.marketData.discountRate}
                    onChange={(e) => setVault((v) => updateMarketData(v, { discountRate: +e.target.value }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Terminal Cap Rate</label>
                  <input
                    type="number"
                    step="0.0025"
                    min="0.01"
                    max="0.3"
                    value={vault.marketData.terminalCapRate}
                    onChange={(e) => setVault((v) => updateMarketData(v, { terminalCapRate: +e.target.value }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Hold Period (Years)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="30"
                    value={vault.marketData.holdPeriodYears}
                    onChange={(e) => setVault((v) => updateMarketData(v, { holdPeriodYears: +e.target.value }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Market Rent Growth Rate</label>
                  <input
                    type="number"
                    step="0.005"
                    min="0"
                    max="0.2"
                    value={vault.marketData.marketRentGrowthRate}
                    onChange={(e) => setVault((v) => updateMarketData(v, { marketRentGrowthRate: +e.target.value }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Expense Growth Rate</label>
                  <input
                    type="number"
                    step="0.005"
                    min="0"
                    max="0.2"
                    value={vault.marketData.expenseGrowthRate}
                    onChange={(e) => setVault((v) => updateMarketData(v, { expenseGrowthRate: +e.target.value }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Reversion Selling Costs</label>
                  <input
                    type="number"
                    step="0.005"
                    min="0"
                    max="0.1"
                    value={vault.marketData.reversionSellingCosts}
                    onChange={(e) => setVault((v) => updateMarketData(v, { reversionSellingCosts: +e.target.value }))}
                    className="mt-0.5 h-7 w-full px-2 text-xs rounded border border-border bg-background"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Direct Cap Results ── */}
        {activeTab === "directcap" && (
          <div className="space-y-4">
            <SectionHeader title="Direct Capitalization" badge={directCapResult ? "Computed" : "Not Run"} />
            {!directCapResult ? (
              <p className="text-xs text-muted-foreground">Run the income analysis to see results.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md border border-border p-3 space-y-0.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Income Waterfall</p>
                  <FieldRow label="INC_PGI — Potential Gross Income" value={fmt$(directCapResult.pgi)} />
                  <FieldRow label={`Less: Vacancy & Credit Loss (${fmtPct(directCapResult.vacancyPct, 1)})`} value={`(${fmt$(directCapResult.vacancyAndCreditLoss)})`} />
                  <FieldRow label="INC_EGI — Effective Gross Income" value={fmt$(directCapResult.egi)} highlight />
                  <FieldRow label={`Less: Operating Expenses (${fmtPct(directCapResult.expenseRatio, 1)} of EGI)`} value={`(${fmt$(directCapResult.totalOperatingExpenses)})`} />
                  <FieldRow label="INC_NOI — Net Operating Income" value={fmt$(directCapResult.noi)} highlight />
                  <FieldRow label={`INC_CAP_RATE — ${directCapResult.capRateSource}`} value={fmtPct(directCapResult.capRate)} />
                  <div className="mt-2 pt-2 border-t border-border">
                    <FieldRow label="INC_DIRECT_CAP — Indicated Value" value={fmt$(directCapResult.indicatedValue)} highlight />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-md border border-border p-3 space-y-0.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Per-SF Metrics</p>
                    <FieldRow label="PGI / SF" value={`$${fmtNum(directCapResult.pgiPerSqft)}`} />
                    <FieldRow label="EGI / SF" value={`$${fmtNum(directCapResult.egiPerSqft)}`} />
                    <FieldRow label="NOI / SF" value={`$${fmtNum(directCapResult.noiPerSqft)}`} />
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Expense Breakdown</p>
                    {directCapResult.expenseBreakdown.map((e, i) => (
                      <FieldRow key={i} label={`${e.category}: ${e.label}`} value={`${fmt$(e.amount)} (${fmtNum(e.pctOfEGI, 1)}%)`} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── DCF Results ── */}
        {activeTab === "dcf" && (
          <div className="space-y-4">
            <SectionHeader title="Discounted Cash Flow" badge={dcfResult ? "Computed" : "Not Run"} />
            {!dcfResult ? (
              <p className="text-xs text-muted-foreground">Run the income analysis to see results.</p>
            ) : (
              <div className="space-y-4">
                {/* Summary metrics */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "INC_DCF Indicated Value", value: fmt$(dcfResult.indicatedValue) },
                    { label: "IRR", value: fmtPct(dcfResult.irr) },
                    { label: "PV of NOI", value: fmt$(dcfResult.pvOfNOI) },
                    { label: "PV of Reversion", value: fmt$(dcfResult.pvOfReversion) },
                  ].map((m) => (
                    <div key={m.label} className="rounded-md border border-border p-3 text-center">
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className="text-base font-semibold font-mono text-[hsl(var(--tf-transcend-cyan))] mt-1">{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Year-by-year projection */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {dcfResult.holdPeriodYears}-Year Cash Flow Projection
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-right py-1.5 pr-2">Year</th>
                          <th className="text-right py-1.5 pr-2">PGI</th>
                          <th className="text-right py-1.5 pr-2">Vacancy</th>
                          <th className="text-right py-1.5 pr-2">EGI</th>
                          <th className="text-right py-1.5 pr-2">Expenses</th>
                          <th className="text-right py-1.5 pr-2">NOI</th>
                          <th className="text-right py-1.5 pr-2">PV of NOI</th>
                          <th className="text-right py-1.5">Cum. PV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dcfResult.yearProjections.map((y) => (
                          <tr key={y.year} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-1 pr-2 text-right font-medium">{y.year}</td>
                            <td className="py-1 pr-2 text-right font-mono">{fmt$(y.pgi)}</td>
                            <td className="py-1 pr-2 text-right font-mono text-muted-foreground">({fmt$(y.vacancy)})</td>
                            <td className="py-1 pr-2 text-right font-mono">{fmt$(y.egi)}</td>
                            <td className="py-1 pr-2 text-right font-mono text-muted-foreground">({fmt$(y.operatingExpenses)})</td>
                            <td className="py-1 pr-2 text-right font-mono font-semibold">{fmt$(y.noi)}</td>
                            <td className="py-1 pr-2 text-right font-mono">{fmt$(y.pvNOI)}</td>
                            <td className="py-1 text-right font-mono">{fmt$(y.cumulativePVNOI)}</td>
                          </tr>
                        ))}
                        {/* Reversion row */}
                        <tr className="border-t-2 border-border bg-muted/20">
                          <td className="py-1 pr-2 text-right font-medium">Rev.</td>
                          <td colSpan={5} className="py-1 pr-2 text-right text-muted-foreground text-xs">
                            Terminal NOI {fmt$(dcfResult.reversion.reversionNOI)} / {fmtPct(dcfResult.reversion.terminalCapRate)} = {fmt$(dcfResult.reversion.grossReversionValue)} gross
                          </td>
                          <td className="py-1 pr-2 text-right font-mono">{fmt$(dcfResult.reversion.pvReversion)}</td>
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sensitivity Matrix */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Sensitivity Matrix — Indicated Value ($)
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Rows: Discount Rate | Columns: Exit Cap Rate
                  </p>
                  <div className="overflow-x-auto">
                    <table className="text-xs border-collapse">
                      <thead>
                        <tr>
                          <th className="border border-border px-2 py-1 bg-muted text-muted-foreground">DR \ ECR</th>
                          {dcfResult.sensitivityMatrix.exitCapRates.map((ecr) => (
                            <th key={ecr} className="border border-border px-2 py-1 bg-muted text-muted-foreground font-mono">
                              {fmtPct(ecr, 2)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dcfResult.sensitivityMatrix.discountRates.map((dr, i) => (
                          <tr key={dr}>
                            <td className="border border-border px-2 py-1 bg-muted font-mono font-medium">{fmtPct(dr, 2)}</td>
                            {dcfResult.sensitivityMatrix.indicatedValues[i].map((val, j) => {
                              const isBase =
                                Math.abs(dr - vault.marketData.discountRate) < 0.0001 &&
                                Math.abs(dcfResult.sensitivityMatrix.exitCapRates[j] - vault.marketData.terminalCapRate) < 0.0001;
                              return (
                                <td
                                  key={j}
                                  className={`border border-border px-2 py-1 text-right font-mono ${
                                    isBase ? "bg-[hsl(var(--tf-transcend-cyan)/0.2)] font-semibold" : ""
                                  }`}
                                >
                                  {(val / 1000).toFixed(0)}K
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Evidence ── */}
        {activeTab === "evidence" && (
          <div className="space-y-4">
            <SectionHeader title="Evidence Rail" badge={evidence ? `Run ${evidence.runId.slice(-8)}` : "Not Run"} />
            {!evidence ? (
              <p className="text-xs text-muted-foreground">Run the income analysis to generate evidence.</p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="rounded border border-border p-2">
                    <p className="text-muted-foreground">Run ID</p>
                    <p className="font-mono text-[10px] mt-0.5 break-all">{evidence.runId}</p>
                  </div>
                  <div className="rounded border border-border p-2">
                    <p className="text-muted-foreground">Correlation ID</p>
                    <p className="font-mono text-[10px] mt-0.5 break-all">{evidence.correlationId}</p>
                  </div>
                  <div className="rounded border border-border p-2">
                    <p className="text-muted-foreground">Computed At</p>
                    <p className="font-mono text-[10px] mt-0.5">{new Date(evidence.computedAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="rounded-md border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted border-b border-border text-muted-foreground">
                        <th className="text-left py-1.5 px-3">UAD Field</th>
                        <th className="text-right py-1.5 px-3">Value</th>
                        <th className="text-left py-1.5 px-3">Source</th>
                        <th className="text-left py-1.5 px-3">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evidence.evidenceRefs.map((ref, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="py-1.5 px-3 font-mono text-[hsl(var(--tf-transcend-cyan))]">{ref.fieldCode}</td>
                          <td className="py-1.5 px-3 text-right font-mono">
                            {ref.fieldCode.includes("RATE") ? fmtPct(ref.value) : fmt$(ref.value)}
                          </td>
                          <td className="py-1.5 px-3 text-muted-foreground">{ref.source}</td>
                          <td className="py-1.5 px-3 text-muted-foreground">{ref.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {evidence.warnings.length > 0 && (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 space-y-0.5">
                    <p className="font-semibold mb-1">Warnings recorded in evidence:</p>
                    {evidence.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
