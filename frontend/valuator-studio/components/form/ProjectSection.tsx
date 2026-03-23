"use client";

import { WorkfileProject } from "@/lib/workfile-types";

interface Props {
  project: WorkfileProject;
  onChange: (updated: WorkfileProject) => void;
}

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

const inputCls =
  "h-7 rounded border border-slate-300 bg-white px-2 text-sm text-slate-900 " +
  "focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200 " +
  "dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100";

export default function ProjectSection({ project, onChange }: Props) {
  function set<K extends keyof WorkfileProject>(key: K, value: WorkfileProject[K]) {
    onChange({ ...project, [key]: value });
  }

  function numOrNull(s: string): number | null {
    const n = parseFloat(s);
    return s === "" || isNaN(n) ? null : n;
  }

  return (
    <section className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 px-4 py-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Project Information (Condominium)
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 sm:col-span-2">
          <Field label="Project Name">
            <input
              className={inputCls}
              value={project.project_name ?? ""}
              onChange={(e) => set("project_name", e.target.value || null)}
              placeholder="e.g. Harbor View Condominiums"
            />
          </Field>
        </div>

        <Field label="Total Units">
          <input
            className={inputCls}
            type="number"
            min={1}
            value={project.total_units ?? ""}
            onChange={(e) => set("total_units", numOrNull(e.target.value))}
            placeholder="e.g. 48"
          />
        </Field>

        <Field label="Owner Occupied %">
          <input
            className={inputCls}
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={project.owner_occ_pct ?? ""}
            onChange={(e) => set("owner_occ_pct", numOrNull(e.target.value))}
            placeholder="e.g. 72.5"
          />
        </Field>

        <Field label="HOA Monthly Fee ($)">
          <input
            className={inputCls}
            type="number"
            min={0}
            step={0.01}
            value={project.hoa_fee ?? ""}
            onChange={(e) => set("hoa_fee", numOrNull(e.target.value))}
            placeholder="e.g. 385.00"
          />
        </Field>

        <div className="col-span-2 sm:col-span-3 lg:col-span-5">
          <Field label="HOA Fee Includes">
            <input
              className={inputCls}
              value={project.hoa_includes ?? ""}
              onChange={(e) => set("hoa_includes", e.target.value || null)}
              placeholder="e.g. Water, Sewer, Trash, Exterior Insurance, Common Area Maintenance"
            />
          </Field>
        </div>
      </div>
    </section>
  );
}
