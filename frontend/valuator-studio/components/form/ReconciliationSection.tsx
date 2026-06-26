"use client";

import { WorkfileReconciliation } from "@/lib/workfile-types";

interface Props {
  reconciliation: WorkfileReconciliation;
  onChange: (updated: WorkfileReconciliation) => void;
}

const inputCls =
  "h-8 rounded border border-slate-300 bg-white px-2 text-sm text-slate-900 " +
  "focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ReconciliationSection({ reconciliation, onChange }: Props) {
  function set<K extends keyof WorkfileReconciliation>(key: K, value: WorkfileReconciliation[K]) {
    onChange({ ...reconciliation, [key]: value });
  }

  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-3 py-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">
          Reconciliation
        </h2>
        {reconciliation.final_value !== null && (
          <span className="text-lg font-bold text-blue-700 dark:text-blue-400">
            ${reconciliation.final_value.toLocaleString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-4">
        <Field label="Opinion of Value ($)">
          <input
            type="number"
            className={inputCls + " font-bold text-blue-700 dark:text-blue-400"}
            placeholder="Final value"
            value={reconciliation.final_value ?? ""}
            onChange={(e) => {
              const n = parseFloat(e.target.value);
              set("final_value", e.target.value === "" || isNaN(n) ? null : n);
            }}
          />
        </Field>
        <Field label="Effective Date">
          <input
            className={inputCls}
            placeholder="yyyy-mm-dd"
            value={reconciliation.effective_date ?? ""}
            onChange={(e) => set("effective_date", e.target.value || null)}
          />
        </Field>
        <Field label="Appraiser Name">
          <input
            className={inputCls}
            placeholder="Last, First"
            value={reconciliation.appraiser_name ?? ""}
            onChange={(e) => set("appraiser_name", e.target.value || null)}
          />
        </Field>
        <Field label="License Number">
          <input
            className={inputCls}
            placeholder="WA-CR-XXXXXXX"
            value={reconciliation.license_num ?? ""}
            onChange={(e) => set("license_num", e.target.value || null)}
          />
        </Field>
      </div>
    </section>
  );
}
