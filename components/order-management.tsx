"use client";

import { useState } from "react";
import type { AppraisalOrder, OrderStatus } from "@/lib/types";
import {
  ClipboardList,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  Calendar,
  DollarSign,
  Building2,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
} from "lucide-react";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  intake:       { label: "Intake",        color: "text-blue-400",    bg: "bg-blue-400/10" },
  inspection:   { label: "Inspection",    color: "text-yellow-400",  bg: "bg-yellow-400/10" },
  research:     { label: "Research",      color: "text-orange-400",  bg: "bg-orange-400/10" },
  analysis:     { label: "Analysis",      color: "text-purple-400",  bg: "bg-purple-400/10" },
  draft:        { label: "Draft",         color: "text-cyan-400",    bg: "bg-cyan-400/10" },
  review:       { label: "Review",        color: "text-primary",     bg: "bg-primary/10" },
  delivered:    { label: "Delivered",     color: "text-emerald-400", bg: "bg-emerald-400/10" },
  invoiced:     { label: "Invoiced",      color: "text-chart-2",     bg: "bg-chart-2/10" },
  paid:         { label: "Paid",          color: "text-emerald-400", bg: "bg-emerald-400/10" },
  on_hold:      { label: "On Hold",       color: "text-red-400",     bg: "bg-red-400/10" },
  cancelled:    { label: "Cancelled",     color: "text-muted-foreground", bg: "bg-muted/20" },
};

const PIPELINE_STAGES: OrderStatus[] = [
  "intake", "inspection", "research", "analysis", "draft", "review", "delivered"
];

function generateOrderId() {
  const year = new Date().getFullYear().toString().slice(-2);
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `TF-${year}-${num}`;
}

function daysUntilDue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function dueDateColor(days: number): string {
  if (days < 0) return "text-red-400";
  if (days <= 3) return "text-red-400";
  if (days <= 7) return "text-yellow-400";
  return "text-emerald-400";
}

const MOCK_ORDERS: AppraisalOrder[] = [
  {
    id: "TF-26-0042",
    fileNumber: "TF-26-0042",
    status: "analysis",
    propertyAddress: "1847 Oak Ridge Drive",
    city: "Austin",
    state: "TX",
    zip: "78703",
    propertyType: "single_family",
    clientName: "First National Bank",
    clientEmail: "orders@fnb.com",
    lenderName: "First National Bank",
    borrowerName: "James & Sarah Mitchell",
    loanNumber: "FNB-2026-88421",
    loanType: "Conventional",
    purpose: "Refinance",
    fee: 650,
    feeStatus: "pending",
    orderedDate: "2026-03-10",
    inspectionDate: "2026-03-13",
    dueDate: "2026-03-20",
    appraiserName: "Robert Chen, MAI",
    appraiserLicense: "TX-1234567",
    notes: "Rush order — client needs by 3/20. Pool and detached garage to be measured.",
    priority: "rush",
  },
  {
    id: "TF-26-0041",
    fileNumber: "TF-26-0041",
    status: "draft",
    propertyAddress: "4201 Congress Ave, Suite 300",
    city: "Austin",
    state: "TX",
    zip: "78751",
    propertyType: "office",
    clientName: "Lone Star Capital",
    clientEmail: "appraisals@lonestarcap.com",
    lenderName: "Lone Star Capital",
    borrowerName: "Westside Properties LLC",
    loanNumber: "LSC-2026-00312",
    loanType: "Commercial",
    purpose: "Purchase",
    fee: 4500,
    feeStatus: "invoiced",
    orderedDate: "2026-03-05",
    inspectionDate: "2026-03-08",
    dueDate: "2026-03-25",
    appraiserName: "Robert Chen, MAI",
    appraiserLicense: "TX-1234567",
    notes: "Three approaches required. Tenant rent rolls provided.",
    priority: "normal",
  },
  {
    id: "TF-26-0040",
    fileNumber: "TF-26-0040",
    status: "delivered",
    propertyAddress: "8823 Sunset Blvd",
    city: "Dallas",
    state: "TX",
    zip: "75201",
    propertyType: "single_family",
    clientName: "Texas Home Lending",
    clientEmail: "appraisals@txhomelending.com",
    lenderName: "Texas Home Lending",
    borrowerName: "Carlos Rodriguez",
    loanNumber: "THL-2026-55210",
    loanType: "FHA",
    purpose: "Purchase",
    fee: 550,
    feeStatus: "paid",
    orderedDate: "2026-03-01",
    inspectionDate: "2026-03-03",
    dueDate: "2026-03-12",
    deliveredDate: "2026-03-11",
    appraiserName: "Robert Chen, MAI",
    appraiserLicense: "TX-1234567",
    notes: "FHA 1004 with 1004MC. Delivered one day early.",
    priority: "normal",
  },
];

interface NewOrderFormProps {
  onSave: (order: AppraisalOrder) => void;
  onCancel: () => void;
}

function NewOrderForm({ onSave, onCancel }: NewOrderFormProps) {
  const [form, setForm] = useState<Partial<AppraisalOrder>>({
    id: generateOrderId(),
    fileNumber: generateOrderId(),
    status: "intake",
    propertyType: "single_family",
    loanType: "Conventional",
    purpose: "Purchase",
    priority: "normal",
    feeStatus: "pending",
    orderedDate: new Date().toISOString().split("T")[0],
  });

  const set = <K extends keyof AppraisalOrder>(key: K, val: AppraisalOrder[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const inputCls = "w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary";
  const labelCls = "font-mono text-[10px] tracking-wider text-muted-foreground";

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-5">
      <h4 className="mb-4 font-mono text-xs font-semibold tracking-wider text-primary">NEW APPRAISAL ORDER</h4>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <label className={labelCls}>FILE NUMBER</label>
          <input type="text" value={form.fileNumber ?? ""} readOnly className={`${inputCls} opacity-60`} />
        </div>
        <div>
          <label className={labelCls}>PRIORITY</label>
          <select value={form.priority} onChange={(e) => set("priority", e.target.value as AppraisalOrder["priority"])} className={inputCls}>
            <option value="normal">Normal</option>
            <option value="rush">Rush</option>
            <option value="super_rush">Super Rush</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>PROPERTY TYPE</label>
          <select value={form.propertyType} onChange={(e) => set("propertyType", e.target.value as AppraisalOrder["propertyType"])} className={inputCls}>
            <option value="single_family">Single Family</option>
            <option value="condo">Condo</option>
            <option value="multi_family_2_4">2-4 Family</option>
            <option value="multi_family_5plus">5+ Multi-Family</option>
            <option value="office">Office</option>
            <option value="retail">Retail</option>
            <option value="industrial">Industrial</option>
            <option value="mixed_use">Mixed Use</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>PROPERTY ADDRESS</label>
          <input type="text" placeholder="123 Main St" value={form.propertyAddress ?? ""}
            onChange={(e) => set("propertyAddress", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>CITY</label>
          <input type="text" value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>CLIENT / AMC NAME</label>
          <input type="text" placeholder="Lender or AMC" value={form.clientName ?? ""}
            onChange={(e) => set("clientName", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>BORROWER NAME</label>
          <input type="text" value={form.borrowerName ?? ""} onChange={(e) => set("borrowerName", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>LOAN TYPE</label>
          <select value={form.loanType} onChange={(e) => set("loanType", e.target.value as AppraisalOrder["loanType"])} className={inputCls}>
            <option value="Conventional">Conventional</option>
            <option value="FHA">FHA</option>
            <option value="VA">VA</option>
            <option value="USDA">USDA</option>
            <option value="Commercial">Commercial</option>
            <option value="Cash">Cash / Non-Lending</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>PURPOSE</label>
          <select value={form.purpose} onChange={(e) => set("purpose", e.target.value as AppraisalOrder["purpose"])} className={inputCls}>
            <option value="Purchase">Purchase</option>
            <option value="Refinance">Refinance</option>
            <option value="HELOC">HELOC</option>
            <option value="Estate">Estate / Probate</option>
            <option value="Divorce">Divorce</option>
            <option value="Tax Appeal">Tax Appeal</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>APPRAISAL FEE ($)</label>
          <input type="number" min={0} value={form.fee ?? ""}
            onChange={(e) => set("fee", Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>DUE DATE</label>
          <input type="date" value={form.dueDate ?? ""} onChange={(e) => set("dueDate", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>INSPECTION DATE</label>
          <input type="date" value={form.inspectionDate ?? ""} onChange={(e) => set("inspectionDate", e.target.value)} className={inputCls} />
        </div>
        <div className="col-span-2 sm:col-span-3">
          <label className={labelCls}>NOTES / SPECIAL INSTRUCTIONS</label>
          <textarea rows={2} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)}
            className={`${inputCls} resize-none`} />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => onSave(form as AppraisalOrder)}
          className="flex items-center gap-1.5 rounded bg-primary px-4 py-2 font-mono text-xs font-bold text-primary-foreground hover:opacity-90">
          <Plus className="h-3.5 w-3.5" /> CREATE ORDER
        </button>
        <button type="button" onClick={onCancel}
          className="rounded border border-border px-4 py-2 font-mono text-xs text-muted-foreground hover:text-foreground">
          CANCEL
        </button>
      </div>
    </div>
  );
}

export function OrderManagement() {
  const [orders, setOrders] = useState<AppraisalOrder[]>(MOCK_ORDERS);
  const [showNewForm, setShowNewForm] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || [o.fileNumber, o.propertyAddress, o.clientName, o.borrowerName]
      .some((f) => f?.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const stats = {
    active: orders.filter((o) => !["delivered", "paid", "cancelled"].includes(o.status)).length,
    dueThisWeek: orders.filter((o) => {
      if (!o.dueDate) return false;
      const days = daysUntilDue(o.dueDate);
      return days >= 0 && days <= 7;
    }).length,
    totalFees: orders.reduce((s, o) => s + (o.fee ?? 0), 0),
    delivered: orders.filter((o) => ["delivered", "paid"].includes(o.status)).length,
  };

  const handleNewOrder = (order: AppraisalOrder) => {
    setOrders((prev) => [order, ...prev]);
    setShowNewForm(false);
  };

  const updateStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground">
            APPRAISAL ORDER MANAGEMENT
          </h3>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 font-mono text-[10px] font-bold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          NEW ORDER
        </button>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded border border-border/50 bg-background/50 p-3 text-center">
          <p className="font-mono text-[9px] tracking-wider text-muted-foreground">ACTIVE ORDERS</p>
          <p className="font-mono text-2xl font-bold text-primary">{stats.active}</p>
        </div>
        <div className="rounded border border-border/50 bg-background/50 p-3 text-center">
          <p className="font-mono text-[9px] tracking-wider text-muted-foreground">DUE THIS WEEK</p>
          <p className={`font-mono text-2xl font-bold ${stats.dueThisWeek > 0 ? "text-yellow-400" : "text-foreground"}`}>
            {stats.dueThisWeek}
          </p>
        </div>
        <div className="rounded border border-border/50 bg-background/50 p-3 text-center">
          <p className="font-mono text-[9px] tracking-wider text-muted-foreground">PIPELINE FEES</p>
          <p className="font-mono text-lg font-bold text-emerald-400">
            ${stats.totalFees.toLocaleString()}
          </p>
        </div>
        <div className="rounded border border-border/50 bg-background/50 p-3 text-center">
          <p className="font-mono text-[9px] tracking-wider text-muted-foreground">DELIVERED</p>
          <p className="font-mono text-2xl font-bold text-foreground">{stats.delivered}</p>
        </div>
      </div>

      {/* New Order Form */}
      {showNewForm && (
        <div className="mb-5">
          <NewOrderForm onSave={handleNewOrder} onCancel={() => setShowNewForm(false)} />
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 rounded border border-border bg-background px-2 py-1.5 flex-1 min-w-[160px]">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none w-full"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilterStatus("all")}
            className={`rounded px-2 py-1 font-mono text-[10px] transition-colors ${filterStatus === "all" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            ALL ({orders.length})
          </button>
          {(["intake", "inspection", "analysis", "draft", "review", "delivered"] as OrderStatus[]).map((s) => {
            const count = orders.filter((o) => o.status === s).length;
            if (count === 0) return null;
            const cfg = STATUS_CONFIG[s];
            return (
              <button key={s}
                onClick={() => setFilterStatus(s)}
                className={`rounded px-2 py-1 font-mono text-[10px] transition-colors ${filterStatus === s ? `${cfg.bg} ${cfg.color}` : "text-muted-foreground hover:text-foreground"}`}
              >
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Order List */}
      <div className="space-y-2">
        {filtered.map((order) => {
          const isExpanded = expandedOrder === order.id;
          const cfg = STATUS_CONFIG[order.status];
          const daysLeft = order.dueDate ? daysUntilDue(order.dueDate) : null;
          const stageIdx = PIPELINE_STAGES.indexOf(order.status);

          return (
            <div key={order.id} className={`rounded-lg border transition-colors ${
              isExpanded ? "border-primary/40 bg-primary/5" : "border-border/50 bg-background/30 hover:border-border"
            }`}>
              <button
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                className="w-full px-4 py-3 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {order.priority === "rush" && (
                      <span className="flex-shrink-0 rounded bg-red-400/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-red-400">RUSH</span>
                    )}
                    <span className="flex-shrink-0 font-mono text-[10px] font-bold text-muted-foreground">{order.fileNumber}</span>
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-medium text-foreground truncate">{order.propertyAddress}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {order.city}, {order.state} · {order.clientName} · {order.borrowerName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    {daysLeft !== null && (
                      <span className={`font-mono text-[10px] ${dueDateColor(daysLeft)}`}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d OVERDUE` : `${daysLeft}d left`}
                      </span>
                    )}
                    {order.fee && (
                      <span className="font-mono text-[10px] text-emerald-400 hidden sm:block">
                        ${order.fee.toLocaleString()}
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border/30 px-4 pb-4 pt-3">
                  {/* Pipeline Progress */}
                  <div className="mb-4">
                    <p className="mb-2 font-mono text-[9px] tracking-widest text-muted-foreground">PIPELINE PROGRESS</p>
                    <div className="flex items-center gap-0">
                      {PIPELINE_STAGES.map((stage, i) => {
                        const isActive = stage === order.status;
                        const isPast = i < stageIdx;
                        const stageCfg = STATUS_CONFIG[stage];
                        return (
                          <div key={stage} className="flex items-center flex-1">
                            <button
                              onClick={() => updateStatus(order.id, stage)}
                              className={`flex-shrink-0 rounded-full border-2 w-6 h-6 flex items-center justify-center transition-all ${
                                isActive ? "border-primary bg-primary text-primary-foreground scale-110" :
                                isPast ? "border-emerald-400 bg-emerald-400/20 text-emerald-400" :
                                "border-border bg-background text-muted-foreground"
                              }`}
                              title={stageCfg.label}
                            >
                              {isPast ? <CheckCircle className="h-3 w-3" /> : <span className="font-mono text-[8px]">{i + 1}</span>}
                            </button>
                            {i < PIPELINE_STAGES.length - 1 && (
                              <div className={`flex-1 h-0.5 ${isPast || isActive ? "bg-primary/40" : "bg-border/30"}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1">
                      {PIPELINE_STAGES.map((stage) => (
                        <span key={stage} className="font-mono text-[8px] text-muted-foreground/60 text-center" style={{ width: `${100 / PIPELINE_STAGES.length}%` }}>
                          {STATUS_CONFIG[stage].label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-3">
                    <div>
                      <p className="font-mono text-[9px] text-muted-foreground">LOAN TYPE</p>
                      <p className="font-mono text-xs text-foreground">{order.loanType}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] text-muted-foreground">PURPOSE</p>
                      <p className="font-mono text-xs text-foreground">{order.purpose}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] text-muted-foreground">ORDERED</p>
                      <p className="font-mono text-xs text-foreground">{order.orderedDate}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] text-muted-foreground">INSPECTION</p>
                      <p className="font-mono text-xs text-foreground">{order.inspectionDate ?? "—"}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] text-muted-foreground">DUE DATE</p>
                      <p className={`font-mono text-xs font-semibold ${daysLeft !== null ? dueDateColor(daysLeft) : "text-foreground"}`}>
                        {order.dueDate ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] text-muted-foreground">FEE</p>
                      <p className="font-mono text-xs text-emerald-400">${order.fee?.toLocaleString() ?? "—"}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] text-muted-foreground">FEE STATUS</p>
                      <p className={`font-mono text-xs ${order.feeStatus === "paid" ? "text-emerald-400" : order.feeStatus === "invoiced" ? "text-yellow-400" : "text-muted-foreground"}`}>
                        {order.feeStatus?.toUpperCase()}
                      </p>
                    </div>
                    {order.loanNumber && (
                      <div>
                        <p className="font-mono text-[9px] text-muted-foreground">LOAN #</p>
                        <p className="font-mono text-xs text-foreground">{order.loanNumber}</p>
                      </div>
                    )}
                  </div>

                  {order.notes && (
                    <div className="rounded border border-border/30 bg-background/30 p-2">
                      <p className="font-mono text-[9px] tracking-wider text-muted-foreground mb-1">NOTES</p>
                      <p className="font-mono text-[10px] text-foreground/80">{order.notes}</p>
                    </div>
                  )}

                  {/* Quick Status Update */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="font-mono text-[10px] text-muted-foreground self-center">ADVANCE TO:</span>
                    {PIPELINE_STAGES.filter((s) => PIPELINE_STAGES.indexOf(s) > stageIdx).slice(0, 3).map((s) => (
                      <button key={s} onClick={() => updateStatus(order.id, s)}
                        className={`rounded px-2 py-1 font-mono text-[10px] border border-border hover:border-primary hover:text-primary transition-colors text-muted-foreground`}>
                        {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                    {order.status !== "on_hold" && (
                      <button onClick={() => updateStatus(order.id, "on_hold")}
                        className="rounded px-2 py-1 font-mono text-[10px] border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors">
                        Hold
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-8 text-center">
          <p className="font-mono text-xs text-muted-foreground">No orders match your filter criteria.</p>
        </div>
      )}
    </div>
  );
}
