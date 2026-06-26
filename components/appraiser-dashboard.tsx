"use client";

import { useState } from "react";
import {
  TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle,
  FileText, Calendar, BarChart3, Target, Award, Zap,
  Building2, Home, Factory, ShoppingBag, Users
} from "lucide-react";

interface DashboardMetric {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "flat";
  trendPct?: string;
  color?: string;
}

interface RecentOrder {
  id: string;
  address: string;
  type: string;
  client: string;
  fee: number;
  dueDate: string;
  status: "In Progress" | "Review" | "Completed" | "Overdue";
  daysLeft: number;
}

const SAMPLE_ORDERS: RecentOrder[] = [
  { id: "TF-28451", address: "4521 Congress Ave, Austin TX", type: "Office", client: "First National Bank", fee: 3500, dueDate: "Mar 22, 2026", status: "In Progress", daysLeft: 5 },
  { id: "TF-28440", address: "1820 S Lamar Blvd, Austin TX", type: "Retail", client: "Wells Fargo CRE", fee: 4200, dueDate: "Mar 19, 2026", status: "Review", daysLeft: 2 },
  { id: "TF-28431", address: "9800 N Mopac Expy, Austin TX", type: "Industrial", client: "Lone Star Capital", fee: 5800, dueDate: "Mar 17, 2026", status: "Overdue", daysLeft: 0 },
  { id: "TF-28420", address: "2301 E 6th St, Austin TX", type: "Mixed Use", client: "Austin Community Bank", fee: 3200, dueDate: "Mar 28, 2026", status: "In Progress", daysLeft: 11 },
  { id: "TF-28410", address: "5600 Burnet Rd, Austin TX", type: "Single Family", client: "Quicken Loans", fee: 650, dueDate: "Mar 20, 2026", status: "In Progress", daysLeft: 3 },
  { id: "TF-28399", address: "3400 Bee Cave Rd, Austin TX", type: "Office", client: "JPMorgan Chase", fee: 6500, dueDate: "Mar 15, 2026", status: "Completed", daysLeft: 0 },
];

const METRICS: DashboardMetric[] = [
  { label: "Active Orders", value: "12", sub: "4 due this week", trend: "up", trendPct: "+3", color: "text-primary" },
  { label: "MTD Revenue", value: "$38,450", sub: "vs $31,200 last month", trend: "up", trendPct: "+23%", color: "text-emerald-400" },
  { label: "Avg Turnaround", value: "6.2 days", sub: "Target: 7 days", trend: "down", trendPct: "-0.8d", color: "text-emerald-400" },
  { label: "Completed (YTD)", value: "47", sub: "vs 38 same period LY", trend: "up", trendPct: "+24%", color: "text-primary" },
];

const PROPERTY_MIX = [
  { type: "Office", count: 8, pct: 32, icon: Building2, color: "bg-blue-500" },
  { type: "Retail", count: 5, pct: 20, icon: ShoppingBag, color: "bg-purple-500" },
  { type: "Industrial", count: 4, pct: 16, icon: Factory, color: "bg-orange-500" },
  { type: "Single Family", count: 6, pct: 24, icon: Home, color: "bg-emerald-500" },
  { type: "Other", count: 2, pct: 8, icon: Building2, color: "bg-yellow-500" },
];

const TOP_CLIENTS = [
  { name: "First National Bank", orders: 14, revenue: 52400, ytd: true },
  { name: "Wells Fargo CRE", orders: 9, revenue: 38700, ytd: true },
  { name: "JPMorgan Chase", orders: 7, revenue: 45500, ytd: true },
  { name: "Austin Community Bank", orders: 6, revenue: 19200, ytd: true },
  { name: "Lone Star Capital", orders: 5, revenue: 29000, ytd: true },
];

function statusBadge(status: RecentOrder["status"]) {
  const map: Record<RecentOrder["status"], string> = {
    "In Progress": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Review": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    "Completed": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Overdue": "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return map[status];
}

function daysLeftColor(days: number, status: RecentOrder["status"]) {
  if (status === "Completed") return "text-emerald-400";
  if (status === "Overdue") return "text-red-400";
  if (days <= 2) return "text-red-400";
  if (days <= 5) return "text-yellow-400";
  return "text-muted-foreground";
}

export function AppraiserDashboard() {
  const [view, setView] = useState<"overview" | "pipeline" | "clients">("overview");

  return (
    <div className="space-y-6">

      {/* View Toggle */}
      <div className="flex gap-1 rounded-lg border border-border bg-card/50 p-1 w-fit">
        {(["overview", "pipeline", "clients"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded px-3 py-1.5 font-mono text-[10px] font-semibold tracking-wider transition-all ${
              view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {v.toUpperCase()}
          </button>
        ))}
      </div>

      {view === "overview" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {METRICS.map((m) => (
              <div key={m.label} className="rounded-lg border border-border bg-card p-4">
                <p className="font-mono text-[9px] tracking-widest text-muted-foreground mb-1">{m.label}</p>
                <p className={`font-mono text-2xl font-bold ${m.color}`}>{m.value}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  {m.trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-400" />}
                  {m.trend === "down" && <TrendingUp className="h-3 w-3 text-emerald-400 rotate-180" />}
                  <span className="font-mono text-[10px] text-muted-foreground">{m.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Chart (sparkline-style) */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground">MONTHLY REVENUE — 2026</h3>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">YTD: $89,450</span>
            </div>
            <div className="flex items-end gap-2 h-24">
              {[28400, 32100, 38450, 0, 0, 0, 0, 0, 0, 0, 0, 0].map((val, i) => {
                const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
                const maxVal = 45000;
                const h = val > 0 ? Math.max(8, Math.round((val / maxVal) * 96)) : 4;
                const isCurrent = i === 2;
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t transition-all ${isCurrent ? "bg-primary" : val > 0 ? "bg-primary/40" : "bg-border/30"}`}
                      style={{ height: `${h}px` }}
                    />
                    <span className={`font-mono text-[8px] ${isCurrent ? "text-primary" : "text-muted-foreground/50"}`}>
                      {months[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Property Type Mix */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground">PROPERTY TYPE MIX (YTD)</h3>
              </div>
              <div className="space-y-3">
                {PROPERTY_MIX.map((p) => (
                  <div key={p.type} className="flex items-center gap-3">
                    <p.icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1">
                      <div className="mb-1 flex justify-between">
                        <span className="font-mono text-[10px] text-foreground">{p.type}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{p.count} orders · {p.pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-border/40">
                        <div className={`h-1.5 rounded-full ${p.color}`} style={{ width: `${p.pct}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Indicators */}
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground">PERFORMANCE INDICATORS</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: "On-Time Delivery Rate", value: "94%", target: "95%", pct: 94, good: true },
                  { label: "Revision Request Rate", value: "4.2%", target: "< 5%", pct: 84, good: true },
                  { label: "Client Satisfaction", value: "4.8/5.0", target: "4.5+", pct: 96, good: true },
                  { label: "USPAP Compliance Score", value: "100%", target: "100%", pct: 100, good: true },
                  { label: "Avg Fee / Report", value: "$2,847", target: "$2,500+", pct: 88, good: true },
                ].map((kpi) => (
                  <div key={kpi.label} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="mb-1 flex justify-between">
                        <span className="font-mono text-[10px] text-foreground">{kpi.label}</span>
                        <span className={`font-mono text-[10px] font-bold ${kpi.good ? "text-emerald-400" : "text-yellow-400"}`}>
                          {kpi.value}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-border/40">
                        <div
                          className={`h-1.5 rounded-full ${kpi.good ? "bg-emerald-500" : "bg-yellow-500"}`}
                          style={{ width: `${kpi.pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {view === "pipeline" && (
        <>
          {/* Active Orders Table */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground">ACTIVE APPRAISAL PIPELINE</h3>
              </div>
              <div className="flex gap-2">
                {(["In Progress", "Review", "Overdue", "Completed"] as const).map((s) => (
                  <span key={s} className={`rounded border px-2 py-0.5 font-mono text-[9px] ${statusBadge(s)}`}>
                    {SAMPLE_ORDERS.filter(o => o.status === s).length} {s.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-background/50">
                    <th className="px-4 py-2.5 text-left font-mono text-[9px] tracking-wider text-muted-foreground">FILE NO.</th>
                    <th className="px-4 py-2.5 text-left font-mono text-[9px] tracking-wider text-muted-foreground">PROPERTY</th>
                    <th className="px-4 py-2.5 text-left font-mono text-[9px] tracking-wider text-muted-foreground">TYPE</th>
                    <th className="px-4 py-2.5 text-left font-mono text-[9px] tracking-wider text-muted-foreground">CLIENT</th>
                    <th className="px-4 py-2.5 text-right font-mono text-[9px] tracking-wider text-muted-foreground">FEE</th>
                    <th className="px-4 py-2.5 text-center font-mono text-[9px] tracking-wider text-muted-foreground">DUE DATE</th>
                    <th className="px-4 py-2.5 text-center font-mono text-[9px] tracking-wider text-muted-foreground">STATUS</th>
                    <th className="px-4 py-2.5 text-center font-mono text-[9px] tracking-wider text-muted-foreground">DAYS LEFT</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_ORDERS.map((order) => (
                    <tr key={order.id} className="border-b border-border/30 hover:bg-primary/5 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] font-semibold text-primary">{order.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-[10px] text-foreground max-w-[200px] truncate">{order.address}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] text-muted-foreground">{order.type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] text-foreground">{order.client}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-[10px] font-semibold text-emerald-400">
                          ${order.fee.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono text-[10px] text-muted-foreground">{order.dueDate}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded border px-2 py-0.5 font-mono text-[9px] ${statusBadge(order.status)}`}>
                          {order.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-mono text-[10px] font-bold ${daysLeftColor(order.daysLeft, order.status)}`}>
                          {order.status === "Completed" ? "Done" : order.status === "Overdue" ? "PAST DUE" : `${order.daysLeft}d`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border/30 px-5 py-3 flex items-center justify-between bg-background/30">
              <span className="font-mono text-[10px] text-muted-foreground">
                Showing {SAMPLE_ORDERS.length} orders · Total pipeline value:{" "}
                <span className="text-emerald-400 font-semibold">
                  ${SAMPLE_ORDERS.filter(o => o.status !== "Completed").reduce((s, o) => s + o.fee, 0).toLocaleString()}
                </span>
              </span>
              <button className="rounded border border-primary/30 px-3 py-1 font-mono text-[10px] text-primary hover:bg-primary/10 transition-colors">
                + NEW ORDER
              </button>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground">UPCOMING DEADLINES</h3>
            </div>
            <div className="space-y-2">
              {SAMPLE_ORDERS.filter(o => o.status !== "Completed").sort((a, b) => a.daysLeft - b.daysLeft).map((order) => (
                <div key={order.id} className={`flex items-center justify-between rounded border px-4 py-2.5 ${
                  order.status === "Overdue" ? "border-red-500/30 bg-red-500/5" :
                  order.daysLeft <= 2 ? "border-red-500/20 bg-red-500/5" :
                  order.daysLeft <= 5 ? "border-yellow-500/20 bg-yellow-500/5" :
                  "border-border/40 bg-background/30"
                }`}>
                  <div className="flex items-center gap-3">
                    {order.status === "Overdue" || order.daysLeft <= 2
                      ? <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                      : order.daysLeft <= 5
                      ? <AlertCircle className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />
                      : <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                    }
                    <div>
                      <p className="font-mono text-[10px] font-semibold text-foreground">{order.id} — {order.address}</p>
                      <p className="font-mono text-[9px] text-muted-foreground">{order.client} · ${order.fee.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono text-[10px] font-bold ${daysLeftColor(order.daysLeft, order.status)}`}>
                      {order.status === "Overdue" ? "OVERDUE" : `${order.daysLeft} days`}
                    </p>
                    <p className="font-mono text-[9px] text-muted-foreground">{order.dueDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {view === "clients" && (
        <>
          {/* Top Clients */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground">CLIENT BOOK — YTD 2026</h3>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                Total YTD: <span className="text-emerald-400 font-semibold">$184,800</span>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-background/50">
                    <th className="px-4 py-2.5 text-left font-mono text-[9px] tracking-wider text-muted-foreground">CLIENT / LENDER</th>
                    <th className="px-4 py-2.5 text-center font-mono text-[9px] tracking-wider text-muted-foreground">ORDERS</th>
                    <th className="px-4 py-2.5 text-right font-mono text-[9px] tracking-wider text-muted-foreground">YTD REVENUE</th>
                    <th className="px-4 py-2.5 text-right font-mono text-[9px] tracking-wider text-muted-foreground">AVG FEE</th>
                    <th className="px-4 py-2.5 text-right font-mono text-[9px] tracking-wider text-muted-foreground">% OF BOOK</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_CLIENTS.map((client, i) => {
                    const totalRevenue = TOP_CLIENTS.reduce((s, c) => s + c.revenue, 0);
                    const pct = Math.round((client.revenue / totalRevenue) * 100);
                    return (
                      <tr key={client.name} className="border-b border-border/30 hover:bg-primary/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 font-mono text-[9px] font-bold text-primary">
                              {i + 1}
                            </span>
                            <span className="font-mono text-[10px] text-foreground">{client.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono text-[10px] text-muted-foreground">{client.orders}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-[10px] font-semibold text-emerald-400">
                            ${client.revenue.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            ${Math.round(client.revenue / client.orders).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-border/40">
                              <div className="h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="font-mono text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Client Concentration Warning */}
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-mono text-[10px] font-semibold text-yellow-500 mb-1">CLIENT CONCENTRATION ADVISORY</p>
                <p className="font-mono text-[10px] text-yellow-500/80">
                  JPMorgan Chase represents 24.6% of YTD revenue. USPAP and FIRREA guidelines recommend maintaining
                  independence. Consider diversifying your client base to reduce concentration risk and maintain
                  appraiser independence under USPAP Ethics Rule.
                </p>
              </div>
            </div>
          </div>

          {/* Fee Schedule */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground">FEE SCHEDULE BY PROPERTY TYPE</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="py-2 text-left font-mono text-[9px] tracking-wider text-muted-foreground">PROPERTY TYPE</th>
                    <th className="py-2 text-right font-mono text-[9px] tracking-wider text-muted-foreground">MIN FEE</th>
                    <th className="py-2 text-right font-mono text-[9px] tracking-wider text-muted-foreground">TYPICAL FEE</th>
                    <th className="py-2 text-right font-mono text-[9px] tracking-wider text-muted-foreground">COMPLEX FEE</th>
                    <th className="py-2 text-right font-mono text-[9px] tracking-wider text-muted-foreground">YOUR AVG</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { type: "Single Family (1004)", min: 500, typ: 650, complex: 900, avg: 625 },
                    { type: "Condo (1073)", min: 400, typ: 550, complex: 750, avg: 510 },
                    { type: "2-4 Family (1025)", min: 600, typ: 800, complex: 1100, avg: 780 },
                    { type: "Small Office (<5k SF)", min: 1500, typ: 2500, complex: 4000, avg: 2800 },
                    { type: "Retail Strip", min: 2000, typ: 3500, complex: 6000, avg: 3800 },
                    { type: "Industrial/Warehouse", min: 2500, typ: 4500, complex: 8000, avg: 5200 },
                    { type: "Mixed Use", min: 2000, typ: 3500, complex: 6500, avg: 3400 },
                    { type: "Multifamily (5+)", min: 3000, typ: 5500, complex: 12000, avg: 5800 },
                  ].map((row) => (
                    <tr key={row.type} className="border-b border-border/20 hover:bg-primary/5">
                      <td className="py-2.5 font-mono text-[10px] text-foreground">{row.type}</td>
                      <td className="py-2.5 text-right font-mono text-[10px] text-muted-foreground">${row.min.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-mono text-[10px] text-muted-foreground">${row.typ.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-mono text-[10px] text-muted-foreground">${row.complex.toLocaleString()}</td>
                      <td className="py-2.5 text-right">
                        <span className={`font-mono text-[10px] font-semibold ${row.avg >= row.typ ? "text-emerald-400" : "text-yellow-400"}`}>
                          ${row.avg.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
