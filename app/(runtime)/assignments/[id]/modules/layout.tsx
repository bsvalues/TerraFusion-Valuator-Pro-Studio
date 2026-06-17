"use client";

import { use, type ReactNode } from "react";
import { usePathname } from "next/navigation";

const SEGMENT_META: Record<string, { label: string; writeLane: "read" | "write_low" | "write_high" }> = {
  subject:   { label: "Subject & Scope",   writeLane: "write_low"  },
  evidence:  { label: "Evidence Ledger",   writeLane: "write_low"  },
  cost:      { label: "CostForge Pro",     writeLane: "write_low"  },
  sales:     { label: "CompForge",         writeLane: "write_low"  },
  income:    { label: "IncomeForge Pro",   writeLane: "write_low"  },
  reconcile: { label: "Reconciliation",    writeLane: "write_low"  },
  certify:   { label: "Certify",           writeLane: "write_high" },
  review:    { label: "ReviewForge",       writeLane: "read"       },
  market:    { label: "MarketPulse",       writeLane: "read"       },
  muse:      { label: "MUSE · TerraPilot", writeLane: "write_low" },
  report:    { label: "ReportForge",       writeLane: "read"       },
  audit:     { label: "Audit / Workfile",  writeLane: "read"       },
};

const LANE_COLOR: Record<string, string> = {
  read:       "var(--tf-sub)",
  write_low:  "var(--tf-chip-warn)",
  write_high: "var(--tf-chip-block)",
};

export default function ModulesLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();
  // pathname = /assignments/[id]/modules/[segment]
  const segment = pathname.split("/").pop() ?? "";
  const m = SEGMENT_META[segment];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      {/* 36px surface header */}
      <div
        style={{
          height: 36,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 16px",
          background: "var(--tf-bg2)",
          borderBottom: "1px solid var(--tf-border)",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--tf-text)" }}>
          {m?.label ?? segment}
        </span>
        <span style={{ fontSize: 10, color: "var(--tf-sub)" }}>·</span>
        <span style={{ fontSize: 9, fontFamily: "var(--font-geist-mono)", color: "var(--tf-sub)" }}>
          wf-{id.slice(0, 8)}
        </span>
        {m && (
          <>
            <span style={{ fontSize: 10, color: "var(--tf-sub)" }}>·</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: LANE_COLOR[m.writeLane],
              }}
            >
              {m.writeLane}
            </span>
          </>
        )}
      </div>

      <div style={{ flex: 1, padding: "16px" }}>
        {children}
      </div>
    </div>
  );
}
