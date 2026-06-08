"use client";

/**
 * Assignment layout — hosts the persistence-bound workbench provider so all
 * module routes (/assignments/[id]/[module]) share one hydrated workfile state,
 * and renders the shared command-center chrome (header + module nav).
 *
 * This is the OS workbench pattern (/property/:id/[tab]) applied to fee
 * appraisal: each appraisal tool is a first-class, addressable module route.
 */

import { use, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SubjectWorkbenchProvider } from "@/lib/subject-workbench-context";

const MODULES: { seg: string; label: string }[] = [
  { seg: "", label: "Command Center" },
  { seg: "subject", label: "Subject" },
  { seg: "cost", label: "CostForge" },
  { seg: "sales", label: "CompForge" },
  { seg: "income", label: "IncomeForge" },
  { seg: "reconcile", label: "Reconciliation" },
  { seg: "evidence", label: "Evidence" },
  { seg: "certify", label: "Certify" },
];

export default function AssignmentLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();
  const base = `/assignments/${id}`;

  return (
    <SubjectWorkbenchProvider assignmentId={id}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xs text-cyan-400">← Suite Home</Link>
          <div className="flex gap-2">
            <a
              href={`/api/tfpr/assignments/${id}/report`}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:border-cyan-500/50 hover:text-cyan-400"
            >
              Export Report →
            </a>
            <Link
              href={`${base}/audit`}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:border-cyan-500/50 hover:text-cyan-400"
            >
              Audit Trace →
            </Link>
          </div>
        </div>

        <nav className="flex flex-wrap gap-0 border-b border-border">
          {MODULES.map((m) => {
            const href = m.seg ? `${base}/${m.seg}` : base;
            const active = pathname === href;
            return (
              <Link
                key={m.seg || "home"}
                href={href}
                className={`border-b-2 px-4 py-2 text-sm transition-colors ${
                  active
                    ? "border-cyan-500 text-cyan-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </SubjectWorkbenchProvider>
  );
}
