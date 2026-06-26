"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listOrders, createOrder } from "@/lib/api";
import type { AppraisalOrderSummary, CreateOrderBody, OrderStatus } from "@/lib/order-types";

const STATUS_COLORS: Record<OrderStatus, string> = {
  draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  "in-progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  review: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  complete: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_COLORS[status] ?? STATUS_COLORS.draft}`}>
      {status}
    </span>
  );
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return iso;
}

function fmtTs(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ── New Order Modal ───────────────────────────────────────────────────────────

interface NewOrderModalProps {
  onClose: () => void;
  onCreated: (id: string, formType?: string | null) => void;
}

function NewOrderModal({ onClose, onCreated }: NewOrderModalProps) {
  const [form, setForm] = useState<CreateOrderBody>({
    status: "draft",
    borrower: "",
    client: "",
    subject_address: "",
    due_date: "",
    file_number: "",
    form_type: "FNMA-1004",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(k: keyof CreateOrderBody, v: string) {
    setForm((prev) => ({ ...prev, [k]: v || undefined }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const order = await createOrder(form);
      onCreated(order.id, order.form_type);
    } catch {
      setError("Failed to create order. Is the API running?");
      setSaving(false);
    }
  }

  const inputCls =
    "h-7 w-full rounded border border-slate-300 bg-white px-2 text-sm text-slate-900 " +
    "focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200 " +
    "dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl dark:bg-slate-900 dark:border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">New Appraisal Order</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
        </div>
        <form onSubmit={submit} className="space-y-3 p-4">
          {[
            { key: "file_number" as const, label: "File Number", placeholder: "e.g. 2026-001" },
            { key: "borrower" as const, label: "Borrower", placeholder: "Full name" },
            { key: "client" as const, label: "Client (Lender / AMC)", placeholder: "" },
            { key: "subject_address" as const, label: "Subject Address", placeholder: "123 Main St, City ST" },
            { key: "due_date" as const, label: "Due Date", placeholder: "YYYY-MM-DD" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="flex flex-col gap-0.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</label>
              <input
                className={inputCls}
                placeholder={placeholder}
                value={(form[key] as string) ?? ""}
                onChange={(e) => set(key, e.target.value)}
              />
            </div>
          ))}

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Form Type</label>
            <select
              className={inputCls + " cursor-pointer"}
              value={form.form_type ?? "FNMA-1004"}
              onChange={(e) => set("form_type", e.target.value)}
            >
              <option value="FNMA-1004">FNMA 1004 — Uniform Residential</option>
              <option value="FNMA-2055">FNMA 2055 — Exterior-Only</option>
              <option value="FNMA-1073">FNMA 1073 — Individual Condo</option>
            </select>
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Status</label>
            <select
              className={inputCls + " cursor-pointer"}
              value={form.status ?? "draft"}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="complete">Complete</option>
            </select>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Orders Page ───────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders, setOrders] = useState<AppraisalOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setOrders(await listOrders());
      setError(null);
    } catch {
      setError("Could not load orders — is the API running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleCreated(id: string, formType?: string | null) {
    setShowModal(false);
    const base = formType === "FNMA-2055" ? "/2055" : formType === "FNMA-1073" ? "/1073" : "/";
    window.location.href = `${base}?order=${id}`;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600">
            TotalForge
          </Link>
          <span className="text-xs text-slate-400">Appraisal Orders</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
        >
          + New Order
        </button>
      </header>

      <main className="mx-auto max-w-5xl p-4">
        {loading && (
          <div className="mt-12 text-center text-sm text-slate-400">Loading orders…</div>
        )}
        {error && (
          <div className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="mt-16 text-center">
            <p className="text-slate-500 text-sm">No appraisal orders yet.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Create your first order
            </button>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  {["File #", "Form", "Borrower", "Address", "Due", "Status", "Updated", ""].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr
                    key={o.id}
                    className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${
                      i % 2 === 1 ? "bg-slate-50/50 dark:bg-slate-800/20" : ""
                    }`}
                  >
                    <td className="px-3 py-2 font-mono text-xs text-slate-500">
                      {o.file_number ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                        {o.form_type?.replace("FNMA-", "") ?? "1004"}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                      {o.borrower ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 max-w-[220px] truncate">
                      {o.subject_address ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {fmtDate(o.due_date)}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400 whitespace-nowrap">
                      {fmtTs(o.updated_at)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Link
                          href={(
                            o.workfile_id
                              ? (o.form_type === "FNMA-2055" ? `/2055?id=${o.workfile_id}` :
                                 o.form_type === "FNMA-1073" ? `/1073?id=${o.workfile_id}` :
                                 `/?id=${o.workfile_id}`)
                              : (o.form_type === "FNMA-2055" ? `/2055?order=${o.id}` :
                                 o.form_type === "FNMA-1073" ? `/1073?order=${o.id}` :
                                 `/?order=${o.id}`)
                          )}
                          className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/60"
                        >
                          {o.workfile_id ? "Open" : "Start"}
                        </Link>
                        {o.workfile_id && (
                          <a
                            href={`/api/workfiles/${o.workfile_id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                          >
                            PDF
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showModal && (
        <NewOrderModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
