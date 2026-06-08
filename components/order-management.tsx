"use client";

import { useState, useEffect, useCallback } from "react";
import type { AppraisalOrder, OrderStatus, PropertyType } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ClipboardList, Plus, Clock, CheckCircle, AlertCircle, FileText,
  User, Calendar, DollarSign, Building2, ChevronDown, ChevronUp,
  Search, X, Edit2, Trash2, TrendingUp, Inbox, BarChart2,
  AlertTriangle, Zap,
} from "lucide-react";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; border: string }> = {
  intake:       { label: "Intake",        color: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/30" },
  inspection:   { label: "Inspection",    color: "text-yellow-400",  bg: "bg-yellow-400/10",  border: "border-yellow-400/30" },
  research:     { label: "Research",      color: "text-orange-400",  bg: "bg-orange-400/10",  border: "border-orange-400/30" },
  analysis:     { label: "Analysis",      color: "text-purple-400",  bg: "bg-purple-400/10",  border: "border-purple-400/30" },
  draft:        { label: "Draft",         color: "text-cyan-400",    bg: "bg-cyan-400/10",    border: "border-cyan-400/30" },
  review:       { label: "Review",        color: "text-primary",     bg: "bg-primary/10",     border: "border-primary/30" },
  delivered:    { label: "Delivered",     color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/30" },
  invoiced:     { label: "Invoiced",      color: "text-chart-2",     bg: "bg-chart-2/10",     border: "border-chart-2/30" },
  paid:         { label: "Paid",          color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/30" },
  on_hold:      { label: "On Hold",       color: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/30" },
  cancelled:    { label: "Cancelled",     color: "text-muted-foreground", bg: "bg-muted/20",  border: "border-muted/20" },
};

const PIPELINE_STAGES: OrderStatus[] = [
  "intake", "inspection", "research", "analysis", "draft", "review", "delivered"
];

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  single_family: "Single Family", condo: "Condo", multi_family_2_4: "2-4 Family",
  multi_family_5plus: "5+ Multi", office: "Office", retail: "Retail",
  industrial: "Industrial", mixed_use: "Mixed Use", hospitality: "Hospitality",
  land: "Land", special_purpose: "Special Purpose",
};

const PRIORITY_CONFIG = {
  normal:      { label: "Normal",      color: "text-muted-foreground", bg: "bg-muted/20" },
  rush:        { label: "Rush",        color: "text-yellow-400",       bg: "bg-yellow-400/10" },
  super_rush:  { label: "Super Rush",  color: "text-red-400",          bg: "bg-red-400/10" },
};

function daysUntilDue(dueDate: string): number {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
}

function DueBadge({ dueDate }: { dueDate?: string }) {
  if (!dueDate) return null;
  const days = daysUntilDue(dueDate);
  const color = days < 0 ? "text-red-400" : days <= 3 ? "text-red-400" : days <= 7 ? "text-yellow-400" : "text-cyan-400";
  const label = days < 0 ? `${Math.abs(days)}d OVERDUE` : days === 0 ? "DUE TODAY" : `${days}d left`;
  return <span className={`font-mono text-[9px] font-semibold ${color}`}>{label}</span>;
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("rounded px-2 py-0.5 font-mono text-[9px] font-semibold tracking-wider", cfg.color, cfg.bg)}>
      {cfg.label.toUpperCase()}
    </span>
  );
}

const BLANK_ORDER: Partial<AppraisalOrder> = {
  status: "intake",
  propertyType: "single_family",
  state: "TX",
  priority: "normal",
  loanType: "Conventional",
  purpose: "Purchase",
  formType: "URAR_1004",
  orderedDate: new Date().toISOString().slice(0, 10),
};

const INPUT = "w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary";
const LABEL = "font-mono text-[10px] tracking-wider text-muted-foreground mb-0.5 block";

export function OrderManagement() {
  const [orders, setOrders] = useState<AppraisalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "kanban" | "metrics">("list");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Partial<AppraisalOrder>>(BLANK_ORDER);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isEditing && editingOrder.id) {
        const res = await fetch("/api/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingOrder),
        });
        const data = await res.json();
        setOrders((prev) => prev.map((o) => o.id === data.order.id ? data.order : o));
      } else {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingOrder),
        });
        const data = await res.json();
        setOrders((prev) => [data.order, ...prev]);
      }
      setShowForm(false);
      setEditingOrder(BLANK_ORDER);
      setIsEditing(false);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this order?")) return;
    await fetch(`/api/orders?id=${id}`, { method: "DELETE" });
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const handleAdvanceStatus = async (order: AppraisalOrder) => {
    const idx = PIPELINE_STAGES.indexOf(order.status);
    if (idx < 0 || idx >= PIPELINE_STAGES.length - 1) return;
    const nextStatus = PIPELINE_STAGES[idx + 1];
    const updates: Partial<AppraisalOrder> = { id: order.id, status: nextStatus };
    if (nextStatus === "delivered") updates.deliveredDate = new Date().toISOString().slice(0, 10);
    const res = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    setOrders((prev) => prev.map((o) => o.id === data.order.id ? data.order : o));
  };

  const filtered = orders.filter((o) => {
    const matchSearch = !search || [o.propertyAddress, o.clientName, o.borrowerName, o.fileNumber]
      .some((f) => f?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Metrics
  const activeOrders = orders.filter((o) => !["delivered", "paid", "cancelled"].includes(o.status));
  const totalRevenuePending = orders.filter((o) => o.feeStatus !== "paid").reduce((s, o) => s + (o.fee ?? 0), 0);
  const totalRevenuePaid = orders.filter((o) => o.feeStatus === "paid").reduce((s, o) => s + (o.fee ?? 0), 0);
  const overdueOrders = orders.filter((o) => o.dueDate && daysUntilDue(o.dueDate) < 0 && !["delivered", "paid", "cancelled"].includes(o.status));
  const rushOrders = orders.filter((o) => (o.priority === "rush" || o.priority === "super_rush") && !["delivered", "paid", "cancelled"].includes(o.status));

  const setField = <K extends keyof AppraisalOrder>(key: K, val: AppraisalOrder[K]) =>
    setEditingOrder((p) => ({ ...p, [key]: val }));

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <h2 className="font-mono text-xs font-semibold tracking-wider text-foreground">ORDER MANAGEMENT</h2>
          <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">{orders.length} ORDERS</span>
        </div>
        <button
          onClick={() => { setEditingOrder(BLANK_ORDER); setIsEditing(false); setShowForm(true); }}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-mono text-[10px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          NEW ORDER
        </button>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="font-mono text-[9px] tracking-wider text-muted-foreground">ACTIVE ORDERS</p>
          <p className="font-mono text-2xl font-bold text-foreground">{activeOrders.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="font-mono text-[9px] tracking-wider text-muted-foreground">PENDING FEES</p>
          <p className="font-mono text-lg font-bold text-primary">${totalRevenuePending.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="font-mono text-[9px] tracking-wider text-muted-foreground">COLLECTED</p>
          <p className="font-mono text-lg font-bold text-cyan-400">${totalRevenuePaid.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="font-mono text-[9px] tracking-wider text-muted-foreground">OVERDUE / RUSH</p>
          <p className="font-mono text-lg font-bold">
            <span className="text-red-400">{overdueOrders.length}</span>
            <span className="text-muted-foreground mx-1">/</span>
            <span className="text-yellow-400">{rushOrders.length}</span>
          </p>
        </div>
      </div>

      {/* ── View Toggle + Search + Filter ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-border overflow-hidden">
          {(["list", "kanban", "metrics"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={cn("px-3 py-1.5 font-mono text-[10px] font-semibold tracking-wider transition-colors",
                view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground bg-card"
              )}>
              {v.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search orders, clients, addresses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as OrderStatus | "all")}
          className="rounded-md border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* ── New/Edit Order Form ── */}
      {showForm && (
        <div className="rounded-lg border border-primary/30 bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-mono text-xs font-semibold tracking-wider text-primary">
              {isEditing ? "EDIT ORDER" : "NEW APPRAISAL ORDER"}
            </h3>
            <button onClick={() => { setShowForm(false); setEditingOrder(BLANK_ORDER); }}
              className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={LABEL}>PROPERTY ADDRESS *</label>
              <input className={INPUT} placeholder="123 Main Street" value={editingOrder.propertyAddress || ""}
                onChange={(e) => setField("propertyAddress", e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>CITY *</label>
              <input className={INPUT} placeholder="Austin" value={editingOrder.city || ""}
                onChange={(e) => setField("city", e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>STATE</label>
              <input className={INPUT} placeholder="TX" maxLength={2} value={editingOrder.state || "TX"}
                onChange={(e) => setField("state", e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className={LABEL}>ZIP</label>
              <input className={INPUT} placeholder="78701" value={editingOrder.zip || ""}
                onChange={(e) => setField("zip", e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>PROPERTY TYPE</label>
              <select className={INPUT} value={editingOrder.propertyType || "single_family"}
                onChange={(e) => setField("propertyType", e.target.value as PropertyType)}>
                {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>CLIENT / LENDER *</label>
              <input className={INPUT} placeholder="First National Bank" value={editingOrder.clientName || ""}
                onChange={(e) => setField("clientName", e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>BORROWER NAME</label>
              <input className={INPUT} placeholder="John & Jane Doe" value={editingOrder.borrowerName || ""}
                onChange={(e) => setField("borrowerName", e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>LOAN NUMBER</label>
              <input className={INPUT} placeholder="LN-2026-00001" value={editingOrder.loanNumber || ""}
                onChange={(e) => setField("loanNumber", e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>LOAN TYPE</label>
              <select className={INPUT} value={editingOrder.loanType || "Conventional"}
                onChange={(e) => setField("loanType", e.target.value as AppraisalOrder["loanType"])}>
                {["Conventional","FHA","VA","USDA","Commercial","Cash","Other"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>PURPOSE</label>
              <select className={INPUT} value={editingOrder.purpose || "Purchase"}
                onChange={(e) => setField("purpose", e.target.value as AppraisalOrder["purpose"])}>
                {["Purchase","Refinance","HELOC","Estate","Divorce","Tax Appeal","Other"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>FORM TYPE</label>
              <select className={INPUT} value={editingOrder.formType || "URAR_1004"}
                onChange={(e) => setField("formType", e.target.value as AppraisalOrder["formType"])}>
                {["URAR_1004","1073_Condo","1025_Multi","2055_Exterior","1004D_Update","Commercial_Narrative","Restricted_Appraisal","Summary_Appraisal","Desktop_1004"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>APPRAISAL FEE ($)</label>
              <input className={INPUT} type="number" min={0} placeholder="650" value={editingOrder.fee || ""}
                onChange={(e) => setField("fee", e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <label className={LABEL}>ORDERED DATE</label>
              <input className={INPUT} type="date" value={editingOrder.orderedDate || ""}
                onChange={(e) => setField("orderedDate", e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>INSPECTION DATE</label>
              <input className={INPUT} type="date" value={editingOrder.inspectionDate || ""}
                onChange={(e) => setField("inspectionDate", e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>DUE DATE</label>
              <input className={INPUT} type="date" value={editingOrder.dueDate || ""}
                onChange={(e) => setField("dueDate", e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>PRIORITY</label>
              <select className={INPUT} value={editingOrder.priority || "normal"}
                onChange={(e) => setField("priority", e.target.value as AppraisalOrder["priority"])}>
                <option value="normal">Normal</option>
                <option value="rush">Rush</option>
                <option value="super_rush">Super Rush</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>STATUS</label>
              <select className={INPUT} value={editingOrder.status || "intake"}
                onChange={(e) => setField("status", e.target.value as OrderStatus)}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={LABEL}>NOTES</label>
              <textarea className={INPUT + " resize-none"} rows={2} placeholder="Special instructions, access info, etc."
                value={editingOrder.notes || ""} onChange={(e) => setField("notes", e.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); setEditingOrder(BLANK_ORDER); }}
              className="rounded-md border border-border px-4 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
              CANCEL
            </button>
            <button onClick={handleSave} disabled={saving || !editingOrder.propertyAddress || !editingOrder.clientName}
              className="rounded-md bg-primary px-4 py-1.5 font-mono text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? "SAVING..." : isEditing ? "UPDATE ORDER" : "CREATE ORDER"}
            </button>
          </div>
        </div>
      )}

      {/* ── List View ── */}
      {view === "list" && (
        <div className="space-y-2">
          {loading && <p className="font-mono text-xs text-muted-foreground text-center py-8">Loading orders...</p>}
          {!loading && filtered.length === 0 && (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-mono text-xs text-muted-foreground">No orders found. Create your first order above.</p>
            </div>
          )}
          {filtered.map((order) => {
            const isExpanded = expandedId === order.id;
            const pipelineIdx = PIPELINE_STAGES.indexOf(order.status);
            const canAdvance = pipelineIdx >= 0 && pipelineIdx < PIPELINE_STAGES.length - 1;
            const cfg = STATUS_CONFIG[order.status];
            const priorityCfg = PRIORITY_CONFIG[order.priority || "normal"];

            return (
              <div key={order.id} className={cn("rounded-lg border transition-colors",
                isExpanded ? "border-primary/30 bg-card" : "border-border/50 bg-card/50 hover:border-border"
              )}>
                <button onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full px-4 py-3 text-left">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex-shrink-0 font-mono text-[10px] font-bold text-primary">{order.fileNumber}</span>
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-medium text-foreground truncate">{order.propertyAddress}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {order.city}, {order.state} · {order.clientName}
                          {order.borrowerName && ` · ${order.borrowerName}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {order.priority !== "normal" && (
                        <span className={cn("rounded px-1.5 py-0.5 font-mono text-[9px] font-bold", priorityCfg.color, priorityCfg.bg)}>
                          {priorityCfg.label.toUpperCase()}
                        </span>
                      )}
                      <StatusBadge status={order.status} />
                      <DueBadge dueDate={order.dueDate} />
                      {order.fee && (
                        <span className="font-mono text-[10px] text-foreground">${order.fee.toLocaleString()}</span>
                      )}
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Mini pipeline progress */}
                  {pipelineIdx >= 0 && (
                    <div className="mt-2 flex gap-0.5">
                      {PIPELINE_STAGES.map((stage, i) => (
                        <div key={stage} className={cn("h-1 flex-1 rounded-full transition-colors",
                          i <= pipelineIdx ? "bg-primary" : "bg-border/40"
                        )} />
                      ))}
                    </div>
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-border/30 px-4 pb-4 pt-3">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 mb-4">
                      <div>
                        <p className="font-mono text-[9px] tracking-wider text-muted-foreground">PROPERTY TYPE</p>
                        <p className="font-mono text-xs text-foreground">{PROPERTY_TYPE_LABELS[order.propertyType]}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[9px] tracking-wider text-muted-foreground">FORM TYPE</p>
                        <p className="font-mono text-xs text-foreground">{order.formType || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[9px] tracking-wider text-muted-foreground">LOAN TYPE / PURPOSE</p>
                        <p className="font-mono text-xs text-foreground">{order.loanType} · {order.purpose}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[9px] tracking-wider text-muted-foreground">LOAN NUMBER</p>
                        <p className="font-mono text-xs text-foreground">{order.loanNumber || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[9px] tracking-wider text-muted-foreground">ORDERED</p>
                        <p className="font-mono text-xs text-foreground">{order.orderedDate || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[9px] tracking-wider text-muted-foreground">INSPECTION</p>
                        <p className="font-mono text-xs text-foreground">{order.inspectionDate || "Not scheduled"}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[9px] tracking-wider text-muted-foreground">DUE DATE</p>
                        <p className="font-mono text-xs text-foreground">{order.dueDate || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[9px] tracking-wider text-muted-foreground">FEE STATUS</p>
                        <p className={cn("font-mono text-xs font-semibold",
                          order.feeStatus === "paid" ? "text-cyan-400" :
                          order.feeStatus === "invoiced" ? "text-chart-2" : "text-muted-foreground"
                        )}>
                          {order.fee ? `$${order.fee.toLocaleString()}` : "N/A"} · {(order.feeStatus || "pending").toUpperCase()}
                        </p>
                      </div>
                      {order.appraiserName && (
                        <div>
                          <p className="font-mono text-[9px] tracking-wider text-muted-foreground">APPRAISER</p>
                          <p className="font-mono text-xs text-foreground">{order.appraiserName}</p>
                        </div>
                      )}
                      {order.notes && (
                        <div className="sm:col-span-2 lg:col-span-3">
                          <p className="font-mono text-[9px] tracking-wider text-muted-foreground">NOTES</p>
                          <p className="font-mono text-xs text-foreground/80">{order.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {canAdvance && (
                        <button onClick={() => handleAdvanceStatus(order)}
                          className="flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/30 px-3 py-1.5 font-mono text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors">
                          <Zap className="h-3 w-3" />
                          ADVANCE → {STATUS_CONFIG[PIPELINE_STAGES[pipelineIdx + 1]].label.toUpperCase()}
                        </button>
                      )}
                      <button onClick={() => {
                        setEditingOrder(order);
                        setIsEditing(true);
                        setShowForm(true);
                        setExpandedId(null);
                      }}
                        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                        <Edit2 className="h-3 w-3" />
                        EDIT
                      </button>
                      <button onClick={() => handleDelete(order.id)}
                        className="flex items-center gap-1.5 rounded-md border border-red-400/20 px-3 py-1.5 font-mono text-[10px] text-red-400/70 hover:text-red-400 transition-colors">
                        <Trash2 className="h-3 w-3" />
                        DELETE
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Kanban View ── */}
      {view === "kanban" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {PIPELINE_STAGES.map((stage) => {
              const stageOrders = orders.filter((o) => o.status === stage);
              const cfg = STATUS_CONFIG[stage];
              return (
                <div key={stage} className="w-56 flex-shrink-0">
                  <div className={cn("mb-2 rounded-md border px-2 py-1.5 flex items-center justify-between", cfg.border, cfg.bg)}>
                    <span className={cn("font-mono text-[10px] font-semibold tracking-wider", cfg.color)}>
                      {cfg.label.toUpperCase()}
                    </span>
                    <span className={cn("rounded-full px-1.5 font-mono text-[9px] font-bold", cfg.color, cfg.bg)}>
                      {stageOrders.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {stageOrders.map((order) => (
                      <div key={order.id} className="rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-colors cursor-pointer"
                        onClick={() => { setView("list"); setExpandedId(order.id); }}>
                        <p className="font-mono text-[10px] font-bold text-primary mb-0.5">{order.fileNumber}</p>
                        <p className="font-mono text-[10px] text-foreground truncate">{order.propertyAddress}</p>
                        <p className="font-mono text-[9px] text-muted-foreground truncate">{order.clientName}</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          {order.fee && <span className="font-mono text-[9px] text-foreground">${order.fee.toLocaleString()}</span>}
                          <DueBadge dueDate={order.dueDate} />
                        </div>
                      </div>
                    ))}
                    {stageOrders.length === 0 && (
                      <div className="rounded border border-dashed border-border/30 p-4 text-center">
                        <p className="font-mono text-[9px] text-muted-foreground/50">Empty</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Metrics View ── */}
      {view === "metrics" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Revenue by Status */}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-3 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground">REVENUE BY FEE STATUS</p>
            {(["pending", "invoiced", "paid"] as const).map((fs) => {
              const total = orders.filter((o) => o.feeStatus === fs).reduce((s, o) => s + (o.fee ?? 0), 0);
              const count = orders.filter((o) => o.feeStatus === fs).length;
              const color = fs === "paid" ? "bg-cyan-400" : fs === "invoiced" ? "bg-chart-2" : "bg-muted-foreground/30";
              return (
                <div key={fs} className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-[10px] text-muted-foreground capitalize">{fs} ({count})</span>
                    <span className="font-mono text-[10px] text-foreground">${total.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border/30 overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", color)}
                      style={{ width: `${Math.min(100, (total / Math.max(1, orders.reduce((s, o) => s + (o.fee ?? 0), 0))) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Orders by Property Type */}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-3 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground">ORDERS BY PROPERTY TYPE</p>
            {Object.entries(PROPERTY_TYPE_LABELS)
              .map(([type, label]) => ({ type, label, count: orders.filter((o) => o.propertyType === type).length }))
              .filter((x) => x.count > 0)
              .sort((a, b) => b.count - a.count)
              .map(({ type, label, count }) => (
                <div key={type} className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-[10px] text-muted-foreground">{label}</span>
                    <span className="font-mono text-[10px] text-foreground">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border/30 overflow-hidden">
                    <div className="h-full rounded-full bg-primary/60 transition-all"
                      style={{ width: `${(count / orders.length) * 100}%` }} />
                  </div>
                </div>
              ))}
          </div>

          {/* Pipeline Status */}
          <div className="rounded-lg border border-border bg-card p-4 sm:col-span-2">
            <p className="mb-3 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground">PIPELINE STATUS</p>
            <div className="flex gap-2 flex-wrap">
              {PIPELINE_STAGES.map((stage) => {
                const count = orders.filter((o) => o.status === stage).length;
                const cfg = STATUS_CONFIG[stage];
                return (
                  <div key={stage} className={cn("flex-1 min-w-[80px] rounded-lg border p-3 text-center", cfg.border, cfg.bg)}>
                    <p className={cn("font-mono text-[9px] font-semibold tracking-wider", cfg.color)}>{cfg.label.toUpperCase()}</p>
                    <p className={cn("font-mono text-xl font-bold mt-0.5", cfg.color)}>{count}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
