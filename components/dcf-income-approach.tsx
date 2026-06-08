"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp, DollarSign, Building2, Calculator, ChevronDown, ChevronUp,
  Info, AlertCircle, BarChart3, Percent
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Tenant {
  id: string;
  name: string;
  suite: string;
  sqft: number;
  leaseStart: string;
  leaseEnd: string;
  currentRent: number; // $/sf/year
  annualEscalation: number; // %
  renewalProbability: number; // %
  renewalTerm: number; // years
  renewalRentAdj: number; // % change at renewal
  tenantImprovements: number; // $/sf at renewal
  leasingCommission: number; // % of new rent
  creditRating: "A" | "B" | "C" | "D";
}

interface DCFInputs {
  // Property
  totalSqft: number;
  propertyType: string;
  // Market
  marketRentPsf: number; // $/sf/year
  marketVacancyRate: number; // %
  rentGrowthRate: number; // % per year
  expenseGrowthRate: number; // % per year
  // Operating Expenses
  operatingExpenses: number; // $/sf/year
  managementFee: number; // % of EGI
  insurancePsf: number; // $/sf/year
  realEstateTaxPsf: number; // $/sf/year
  maintenancePsf: number; // $/sf/year
  reservesPsf: number; // $/sf/year
  // Financing / Valuation
  discountRate: number; // % (required return)
  terminalCapRate: number; // % (exit cap rate)
  holdingPeriod: number; // years
  acquisitionCosts: number; // % of purchase price
  dispositionCosts: number; // % of sale price
  // Tenants
  tenants: Tenant[];
}

interface YearlyProjection {
  year: number;
  pgi: number;
  vacancy: number;
  egi: number;
  opex: number;
  noi: number;
  capex: number;
  ncf: number; // Net Cash Flow
  dcf: number; // Discounted Cash Flow
  cumDcf: number;
}

// ─── DCF Engine ──────────────────────────────────────────────────────────────

function calculateDCF(inputs: DCFInputs): {
  projections: YearlyProjection[];
  terminalValue: number;
  presentValueNOI: number;
  presentValueReversion: number;
  indicatedValue: number;
  irr: number;
  equityMultiple: number;
  directCapValue: number;
  yr1CapRate: number;
  yr1Noi: number;
  avgNoi: number;
} {
  const {
    totalSqft, marketRentPsf, marketVacancyRate, rentGrowthRate,
    expenseGrowthRate, operatingExpenses, managementFee, insurancePsf,
    realEstateTaxPsf, maintenancePsf, reservesPsf, discountRate,
    terminalCapRate, holdingPeriod, dispositionCosts, tenants
  } = inputs;

  const dr = discountRate / 100;
  const rg = rentGrowthRate / 100;
  const eg = expenseGrowthRate / 100;
  const vac = marketVacancyRate / 100;

  const projections: YearlyProjection[] = [];
  let cumDcf = 0;

  for (let yr = 1; yr <= holdingPeriod; yr++) {
    // Potential Gross Income
    // Blend tenant rent with market rent based on lease expiry
    let tenantIncome = 0;
    let leasedSqft = 0;

    for (const t of tenants) {
      const leaseEndYear = new Date(t.leaseEnd).getFullYear();
      const currentYear = new Date().getFullYear() + yr - 1;

      if (leaseEndYear >= currentYear) {
        // Lease is active — use contract rent with escalation
        const yearsElapsed = yr - 1;
        const contractRent = t.currentRent * Math.pow(1 + t.annualEscalation / 100, yearsElapsed);
        tenantIncome += contractRent * t.sqft;
        leasedSqft += t.sqft;
      } else {
        // Lease expired — apply renewal probability
        const renewProb = t.renewalProbability / 100;
        const renewRent = marketRentPsf * Math.pow(1 + rg, yr - 1) * (1 + t.renewalRentAdj / 100);
        tenantIncome += renewProb * renewRent * t.sqft;
        leasedSqft += renewProb * t.sqft;
      }
    }

    // Remaining space at market rent
    const remainingSqft = Math.max(0, totalSqft - leasedSqft);
    const marketIncome = remainingSqft * marketRentPsf * Math.pow(1 + rg, yr - 1);

    const pgi = tenantIncome + marketIncome;

    // Effective Gross Income (after vacancy)
    const vacancyLoss = pgi * vac;
    const egi = pgi - vacancyLoss;

    // Operating Expenses
    const baseOpex = (operatingExpenses + insurancePsf + realEstateTaxPsf + maintenancePsf) * totalSqft;
    const mgmtFee = (managementFee / 100) * egi;
    const reserves = reservesPsf * totalSqft;
    const totalOpex = (baseOpex + mgmtFee + reserves) * Math.pow(1 + eg, yr - 1);

    // Net Operating Income
    const noi = egi - totalOpex;

    // Capital Expenditures (tenant improvements + leasing commissions for expiring leases)
    let capex = 0;
    for (const t of tenants) {
      const leaseEndYear = new Date(t.leaseEnd).getFullYear();
      const currentYear = new Date().getFullYear() + yr - 1;
      if (leaseEndYear === currentYear) {
        const renewRent = marketRentPsf * Math.pow(1 + rg, yr - 1);
        capex += t.tenantImprovements * t.sqft * (t.renewalProbability / 100);
        capex += (t.leasingCommission / 100) * renewRent * t.sqft * (1 - t.renewalProbability / 100);
      }
    }

    const ncf = noi - capex;
    const dcf = ncf / Math.pow(1 + dr, yr);
    cumDcf += dcf;

    projections.push({ year: yr, pgi, vacancy: vacancyLoss, egi, opex: totalOpex, noi, capex, ncf, dcf, cumDcf });
  }

  // Terminal Value (Reversion)
  const terminalNOI = projections[projections.length - 1].noi * (1 + rg);
  const grossTerminalValue = terminalNOI / (terminalCapRate / 100);
  const dispositionCost = grossTerminalValue * (dispositionCosts / 100);
  const netTerminalValue = grossTerminalValue - dispositionCost;
  const presentValueReversion = netTerminalValue / Math.pow(1 + dr, holdingPeriod);

  const presentValueNOI = cumDcf;
  const indicatedValue = presentValueNOI + presentValueReversion;

  // Direct Cap Value (Year 1 NOI)
  const yr1Noi = projections[0]?.noi || 0;
  const directCapValue = yr1Noi / (terminalCapRate / 100);
  const yr1CapRate = (yr1Noi / indicatedValue) * 100;

  // Average NOI
  const avgNoi = projections.reduce((s, p) => s + p.noi, 0) / projections.length;

  // IRR (Newton-Raphson approximation)
  const cashFlows = [-indicatedValue, ...projections.map((p) => p.ncf), netTerminalValue];
  let irr = 0.1;
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0, dnpv = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      npv += cashFlows[i] / Math.pow(1 + irr, i);
      dnpv -= i * cashFlows[i] / Math.pow(1 + irr, i + 1);
    }
    const delta = npv / dnpv;
    irr -= delta;
    if (Math.abs(delta) < 1e-7) break;
  }

  const equityMultiple = (projections.reduce((s, p) => s + p.ncf, 0) + netTerminalValue) / indicatedValue;

  return {
    projections,
    terminalValue: netTerminalValue,
    presentValueNOI,
    presentValueReversion,
    indicatedValue,
    irr: irr * 100,
    equityMultiple,
    directCapValue,
    yr1CapRate,
    yr1Noi,
    avgNoi,
  };
}

// ─── Default Inputs ───────────────────────────────────────────────────────────

const DEFAULT_TENANT: Tenant = {
  id: "T1",
  name: "Anchor Tenant LLC",
  suite: "100",
  sqft: 5000,
  leaseStart: "2023-01-01",
  leaseEnd: "2027-12-31",
  currentRent: 28,
  annualEscalation: 3,
  renewalProbability: 75,
  renewalTerm: 5,
  renewalRentAdj: 5,
  tenantImprovements: 25,
  leasingCommission: 4,
  creditRating: "A",
};

const DEFAULT_INPUTS: DCFInputs = {
  totalSqft: 20000,
  propertyType: "Office",
  marketRentPsf: 30,
  marketVacancyRate: 8,
  rentGrowthRate: 3,
  expenseGrowthRate: 2.5,
  operatingExpenses: 8,
  managementFee: 4,
  insurancePsf: 0.5,
  realEstateTaxPsf: 2.5,
  maintenancePsf: 1.5,
  reservesPsf: 0.25,
  discountRate: 8.5,
  terminalCapRate: 7.0,
  holdingPeriod: 10,
  acquisitionCosts: 1.5,
  dispositionCosts: 2.0,
  tenants: [DEFAULT_TENANT],
};

// ─── Component ────────────────────────────────────────────────────────────────

interface DCFIncomeApproachProps {
  initialSqft?: number;
  initialPropertyType?: string;
  onValueChange?: (value: number) => void;
}

export function DCFIncomeApproach({
  initialSqft = 20000,
  initialPropertyType = "Office",
  onValueChange,
}: DCFIncomeApproachProps) {
  const [inputs, setInputs] = useState<DCFInputs>({
    ...DEFAULT_INPUTS,
    totalSqft: initialSqft,
    propertyType: initialPropertyType,
  });
  const [showTenants, setShowTenants] = useState(true);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [activeView, setActiveView] = useState<"projections" | "sensitivity" | "summary">("projections");

  const results = useMemo(() => calculateDCF(inputs), [inputs]);

  const upd = (field: keyof DCFInputs, value: unknown) => {
    setInputs((p) => ({ ...p, [field]: value }));
  };

  const addTenant = () => {
    const newTenant: Tenant = {
      ...DEFAULT_TENANT,
      id: `T${Date.now()}`,
      name: `Tenant ${inputs.tenants.length + 1}`,
      suite: `${(inputs.tenants.length + 1) * 100}`,
    };
    upd("tenants", [...inputs.tenants, newTenant]);
  };

  const removeTenant = (id: string) => {
    upd("tenants", inputs.tenants.filter((t) => t.id !== id));
  };

  const updateTenant = (id: string, field: keyof Tenant, value: unknown) => {
    upd(
      "tenants",
      inputs.tenants.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const fmtPct = (n: number) => `${n.toFixed(2)}%`;
  const fmtPsf = (n: number) => `$${n.toFixed(2)}/sf`;

  const leasedSqft = inputs.tenants.reduce((s, t) => s + t.sqft, 0);
  const occupancy = Math.min(100, (leasedSqft / inputs.totalSqft) * 100);

  // Sensitivity analysis: vary discount rate and cap rate
  const sensitivityData = useMemo(() => {
    const drRange = [-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5];
    const crRange = [-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5];
    return drRange.map((drDelta) =>
      crRange.map((crDelta) => {
        const r = calculateDCF({
          ...inputs,
          discountRate: inputs.discountRate + drDelta,
          terminalCapRate: inputs.terminalCapRate + crDelta,
        });
        return r.indicatedValue;
      })
    );
  }, [inputs]);

  const baseValue = results.indicatedValue;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-mono font-bold text-cyan-400 tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            INCOME CAPITALIZATION APPROACH — DCF MODEL
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            USPAP SR 1-4(b) · {inputs.holdingPeriod}-Year Discounted Cash Flow with Reversion
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 font-mono">INDICATED VALUE</div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">{fmt(results.indicatedValue)}</div>
          <div className="text-xs text-gray-400 font-mono">
            IRR: {fmtPct(results.irr)} · EM: {results.equityMultiple.toFixed(2)}x
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-6 gap-2">
        {[
          { label: "Yr 1 NOI", value: fmt(results.yr1Noi), sub: fmtPsf(results.yr1Noi / inputs.totalSqft) },
          { label: "Avg NOI", value: fmt(results.avgNoi), sub: `${inputs.holdingPeriod}-yr avg` },
          { label: "Going-In Cap", value: fmtPct(results.yr1CapRate), sub: "Yr 1 NOI / Value" },
          { label: "Terminal Cap", value: fmtPct(inputs.terminalCapRate), sub: "Exit cap rate" },
          { label: "IRR", value: fmtPct(results.irr), sub: "Levered" },
          { label: "Direct Cap", value: fmt(results.directCapValue), sub: `@ ${inputs.terminalCapRate}%` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="border border-gray-700 rounded p-2.5 bg-gray-900/50">
            <div className="text-xs text-gray-400 font-mono">{label}</div>
            <div className="text-sm font-bold text-white font-mono mt-0.5">{value}</div>
            <div className="text-xs text-gray-500">{sub}</div>
          </div>
        ))}
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 border-b border-gray-700">
        {(["projections", "sensitivity", "summary"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            className={`px-4 py-2 text-xs font-mono font-bold border-b-2 transition-colors ${
              activeView === v
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {v === "projections" ? "10-YEAR PROJECTIONS" : v === "sensitivity" ? "SENSITIVITY MATRIX" : "ASSUMPTIONS"}
          </button>
        ))}
      </div>

      {/* Projections Table */}
      {activeView === "projections" && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-2 px-2 text-gray-400 font-normal">METRIC</th>
                {results.projections.map((p) => (
                  <th key={p.year} className="text-right py-2 px-2 text-gray-400 font-normal">
                    YR {p.year}
                  </th>
                ))}
                <th className="text-right py-2 px-2 text-gray-400 font-normal">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: "pgi", label: "Potential Gross Income", color: "text-white" },
                { key: "vacancy", label: "Less: Vacancy & Credit Loss", color: "text-red-400", neg: true },
                { key: "egi", label: "Effective Gross Income", color: "text-blue-400", bold: true },
                { key: "opex", label: "Less: Operating Expenses", color: "text-red-400", neg: true },
                { key: "noi", label: "Net Operating Income", color: "text-cyan-400", bold: true },
                { key: "capex", label: "Less: Capital Expenditures", color: "text-red-400", neg: true },
                { key: "ncf", label: "Net Cash Flow", color: "text-yellow-400", bold: true },
                { key: "dcf", label: "Discounted Cash Flow (PV)", color: "text-purple-400" },
                { key: "cumDcf", label: "Cumulative PV of NOI", color: "text-gray-300" },
              ].map(({ key, label, color, bold, neg }) => {
                const total = results.projections.reduce((s, p) => s + (p[key as keyof YearlyProjection] as number), 0);
                return (
                  <tr key={key} className="border-b border-gray-800 hover:bg-gray-900/30">
                    <td className={`py-1.5 px-2 ${color} ${bold ? "font-bold" : ""}`}>{label}</td>
                    {results.projections.map((p) => {
                      const val = p[key as keyof YearlyProjection] as number;
                      return (
                        <td key={p.year} className={`text-right py-1.5 px-2 ${color} ${bold ? "font-bold" : ""}`}>
                          {neg && val > 0 ? `(${fmt(val)})` : fmt(val)}
                        </td>
                      );
                    })}
                    <td className={`text-right py-1.5 px-2 ${color} ${bold ? "font-bold" : ""} border-l border-gray-700`}>
                      {key === "cumDcf" ? fmt(results.projections[results.projections.length - 1].cumDcf) :
                       neg && total > 0 ? `(${fmt(total)})` : fmt(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Reversion Summary */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="border border-gray-700 rounded p-3">
              <div className="text-xs text-gray-400 font-mono mb-1">PV OF NOI CASH FLOWS</div>
              <div className="text-lg font-bold text-blue-400 font-mono">{fmt(results.presentValueNOI)}</div>
              <div className="text-xs text-gray-500">{((results.presentValueNOI / results.indicatedValue) * 100).toFixed(1)}% of total value</div>
            </div>
            <div className="border border-gray-700 rounded p-3">
              <div className="text-xs text-gray-400 font-mono mb-1">PV OF REVERSION</div>
              <div className="text-lg font-bold text-purple-400 font-mono">{fmt(results.presentValueReversion)}</div>
              <div className="text-xs text-gray-500">
                Terminal NOI: {fmt(results.projections[results.projections.length - 1].noi * (1 + inputs.rentGrowthRate / 100))} ÷ {inputs.terminalCapRate}%
              </div>
            </div>
            <div className="border border-cyan-500/30 rounded p-3 bg-cyan-500/5">
              <div className="text-xs text-gray-400 font-mono mb-1">INDICATED VALUE (DCF)</div>
              <div className="text-lg font-bold text-cyan-400 font-mono">{fmt(results.indicatedValue)}</div>
              <div className="text-xs text-gray-500">${(results.indicatedValue / inputs.totalSqft).toFixed(0)}/sf overall</div>
            </div>
          </div>
        </div>
      )}

      {/* Sensitivity Matrix */}
      {activeView === "sensitivity" && (
        <div className="space-y-4">
          <div className="text-xs text-gray-400 font-mono">
            Indicated value sensitivity to Discount Rate (rows) and Terminal Cap Rate (columns). Base case highlighted.
          </div>
          <div className="overflow-x-auto">
            <table className="text-xs font-mono border-collapse">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-gray-400 text-left">DR \ Cap Rate</th>
                  {[-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5].map((d) => (
                    <th key={d} className={`px-3 py-2 text-right ${d === 0 ? "text-cyan-400" : "text-gray-400"}`}>
                      {(inputs.terminalCapRate + d).toFixed(1)}%
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5].map((drDelta, ri) => (
                  <tr key={drDelta} className="border-t border-gray-800">
                    <td className={`px-3 py-2 ${drDelta === 0 ? "text-cyan-400 font-bold" : "text-gray-400"}`}>
                      {(inputs.discountRate + drDelta).toFixed(1)}%
                    </td>
                    {sensitivityData[ri].map((val, ci) => {
                      const pct = ((val - baseValue) / baseValue) * 100;
                      const isBase = drDelta === 0 && ci === 3;
                      return (
                        <td
                          key={ci}
                          className={`px-3 py-2 text-right border border-gray-800 ${
                            isBase
                              ? "bg-cyan-500/20 text-cyan-400 font-bold"
                              : pct > 10
                              ? "bg-blue-500/10 text-blue-400"
                              : pct < -10
                              ? "bg-red-500/10 text-red-400"
                              : "text-gray-300"
                          }`}
                        >
                          <div>{fmt(val)}</div>
                          {!isBase && (
                            <div className={`text-xs ${pct >= 0 ? "text-cyan-500" : "text-red-500"}`}>
                              {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assumptions */}
      {activeView === "summary" && (
        <div className="grid grid-cols-2 gap-6">
          {/* Market Assumptions */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Market & Income Assumptions</h4>
            {[
              { label: "Total Rentable Area", field: "totalSqft" as const, suffix: "sf", type: "number" },
              { label: "Market Rent ($/sf/yr)", field: "marketRentPsf" as const, suffix: "$/sf/yr", type: "number", step: 0.5 },
              { label: "Market Vacancy Rate", field: "marketVacancyRate" as const, suffix: "%", type: "number", step: 0.5 },
              { label: "Rent Growth Rate", field: "rentGrowthRate" as const, suffix: "%/yr", type: "number", step: 0.25 },
              { label: "Expense Growth Rate", field: "expenseGrowthRate" as const, suffix: "%/yr", type: "number", step: 0.25 },
            ].map(({ label, field, suffix, step }) => (
              <div key={field} className="flex items-center justify-between">
                <label className="text-xs text-gray-400">{label}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step={step || 1}
                    className="w-20 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono text-right focus:border-cyan-500 outline-none"
                    value={inputs[field] as number}
                    onChange={(e) => upd(field, parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-xs text-gray-500 w-12">{suffix}</span>
                </div>
              </div>
            ))}

            <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-wider mt-4">Operating Expenses</h4>
            {[
              { label: "Base OpEx ($/sf/yr)", field: "operatingExpenses" as const, step: 0.25 },
              { label: "Management Fee", field: "managementFee" as const, suffix: "% EGI", step: 0.5 },
              { label: "Insurance ($/sf/yr)", field: "insurancePsf" as const, step: 0.1 },
              { label: "Real Estate Tax ($/sf/yr)", field: "realEstateTaxPsf" as const, step: 0.1 },
              { label: "Maintenance ($/sf/yr)", field: "maintenancePsf" as const, step: 0.1 },
              { label: "Reserves ($/sf/yr)", field: "reservesPsf" as const, step: 0.05 },
            ].map(({ label, field, suffix, step }) => (
              <div key={field} className="flex items-center justify-between">
                <label className="text-xs text-gray-400">{label}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step={step}
                    className="w-20 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono text-right focus:border-cyan-500 outline-none"
                    value={inputs[field] as number}
                    onChange={(e) => upd(field, parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-xs text-gray-500 w-12">{suffix || "$/sf"}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Valuation Assumptions */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Valuation Parameters</h4>
            {[
              { label: "Discount Rate (WACC)", field: "discountRate" as const, suffix: "%", step: 0.25 },
              { label: "Terminal Cap Rate", field: "terminalCapRate" as const, suffix: "%", step: 0.25 },
              { label: "Holding Period", field: "holdingPeriod" as const, suffix: "years", step: 1, min: 1, max: 20 },
              { label: "Acquisition Costs", field: "acquisitionCosts" as const, suffix: "%", step: 0.25 },
              { label: "Disposition Costs", field: "dispositionCosts" as const, suffix: "%", step: 0.25 },
            ].map(({ label, field, suffix, step, min, max }) => (
              <div key={field} className="flex items-center justify-between">
                <label className="text-xs text-gray-400">{label}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step={step}
                    min={min}
                    max={max}
                    className="w-20 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono text-right focus:border-cyan-500 outline-none"
                    value={inputs[field] as number}
                    onChange={(e) => upd(field, parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-xs text-gray-500 w-12">{suffix}</span>
                </div>
              </div>
            ))}

            {/* Value Summary Box */}
            <div className="border border-cyan-500/30 rounded p-3 bg-cyan-500/5 mt-4 space-y-2">
              <div className="text-xs font-mono text-cyan-400 font-bold">VALUE RECONCILIATION</div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Direct Capitalization</span>
                <span className="text-white font-mono">{fmt(results.directCapValue)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">DCF — PV of NOI</span>
                <span className="text-white font-mono">{fmt(results.presentValueNOI)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">DCF — PV of Reversion</span>
                <span className="text-white font-mono">{fmt(results.presentValueReversion)}</span>
              </div>
              <div className="border-t border-gray-600 pt-2 flex justify-between text-sm font-bold">
                <span className="text-cyan-400">Indicated Value (DCF)</span>
                <span className="text-cyan-400 font-mono">{fmt(results.indicatedValue)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Per Square Foot</span>
                <span className="text-gray-300 font-mono">${(results.indicatedValue / inputs.totalSqft).toFixed(0)}/sf</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Roll Schedule */}
      <div className="border border-gray-700 rounded">
        <button
          onClick={() => setShowTenants(!showTenants)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-mono font-bold text-cyan-400 hover:bg-gray-900/30"
        >
          <span className="flex items-center gap-2">
            <Building2 className="w-3 h-3" />
            TENANT ROLL SCHEDULE ({inputs.tenants.length} tenants · {occupancy.toFixed(0)}% occupied · {leasedSqft.toLocaleString()} sf leased)
          </span>
          {showTenants ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showTenants && (
          <div className="border-t border-gray-700 p-4 space-y-3">
            <div className="flex justify-end">
              <button
                onClick={addTenant}
                className="text-xs font-mono text-cyan-400 border border-cyan-500/50 rounded px-3 py-1 hover:bg-cyan-500/10"
              >
                + ADD TENANT
              </button>
            </div>

            {inputs.tenants.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-xs font-mono">
                No tenants added. Click "+ ADD TENANT" to add lease information.
              </div>
            ) : (
              inputs.tenants.map((tenant) => (
                <div key={tenant.id} className="border border-gray-700 rounded p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold ${
                        tenant.creditRating === "A" ? "bg-cyan-500/20 text-cyan-400" :
                        tenant.creditRating === "B" ? "bg-blue-500/20 text-blue-400" :
                        tenant.creditRating === "C" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>
                        {tenant.creditRating}
                      </span>
                      <input
                        className="bg-transparent text-sm text-white font-mono font-bold focus:outline-none border-b border-transparent focus:border-gray-500"
                        value={tenant.name}
                        onChange={(e) => updateTenant(tenant.id, "name", e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => removeTenant(tenant.id)}
                      className="text-xs text-red-400 hover:text-red-300 font-mono"
                    >
                      REMOVE
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-gray-500 mb-1">SUITE</label>
                      <input className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white font-mono focus:border-cyan-500 outline-none" value={tenant.suite} onChange={(e) => updateTenant(tenant.id, "suite", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">SQFT</label>
                      <input type="number" className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white font-mono focus:border-cyan-500 outline-none" value={tenant.sqft} onChange={(e) => updateTenant(tenant.id, "sqft", parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">LEASE START</label>
                      <input type="date" className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white font-mono focus:border-cyan-500 outline-none" value={tenant.leaseStart} onChange={(e) => updateTenant(tenant.id, "leaseStart", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">LEASE END</label>
                      <input type="date" className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white font-mono focus:border-cyan-500 outline-none" value={tenant.leaseEnd} onChange={(e) => updateTenant(tenant.id, "leaseEnd", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">RENT ($/SF/YR)</label>
                      <input type="number" step="0.5" className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white font-mono focus:border-cyan-500 outline-none" value={tenant.currentRent} onChange={(e) => updateTenant(tenant.id, "currentRent", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">ESCALATION %/YR</label>
                      <input type="number" step="0.25" className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white font-mono focus:border-cyan-500 outline-none" value={tenant.annualEscalation} onChange={(e) => updateTenant(tenant.id, "annualEscalation", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">RENEWAL PROB %</label>
                      <input type="number" step="5" min="0" max="100" className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white font-mono focus:border-cyan-500 outline-none" value={tenant.renewalProbability} onChange={(e) => updateTenant(tenant.id, "renewalProbability", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">CREDIT RATING</label>
                      <select className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white font-mono focus:border-cyan-500 outline-none" value={tenant.creditRating} onChange={(e) => updateTenant(tenant.id, "creditRating", e.target.value as Tenant["creditRating"])}>
                        <option value="A">A — Investment Grade</option>
                        <option value="B">B — Good Credit</option>
                        <option value="C">C — Speculative</option>
                        <option value="D">D — High Risk</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">TI AT RENEWAL ($/SF)</label>
                      <input type="number" step="1" className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white font-mono focus:border-cyan-500 outline-none" value={tenant.tenantImprovements} onChange={(e) => updateTenant(tenant.id, "tenantImprovements", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">LEASING COMM %</label>
                      <input type="number" step="0.5" className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white font-mono focus:border-cyan-500 outline-none" value={tenant.leasingCommission} onChange={(e) => updateTenant(tenant.id, "leasingCommission", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="col-span-2 flex items-end">
                      <div className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-xs text-gray-300 font-mono">
                        Annual Rent: {fmt(tenant.currentRent * tenant.sqft)} · Expires: {new Date(tenant.leaseEnd) < new Date() ? <span className="text-red-400">EXPIRED</span> : tenant.leaseEnd}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
