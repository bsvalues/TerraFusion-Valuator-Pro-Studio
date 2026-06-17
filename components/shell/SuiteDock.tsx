"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShell } from "./ShellProvider";

const DOCK_MODULES = [
  { id: "valuator",    label: "Valuator",    icon: "⊞", seg: "reconcile",  attentionKeys: ["reconcile", "certify", "subject"] },
  { id: "costforge",   label: "CostForge",   icon: "▦", seg: "cost",       attentionKeys: ["cost"] },
  { id: "compforge",   label: "CompForge",   icon: "≋", seg: "sales",      attentionKeys: ["sales"] },
  { id: "incomeforge", label: "IncomeForge", icon: "∿", seg: "income",     attentionKeys: ["income"] },
  { id: "reportforge", label: "ReportForge", icon: "📄", seg: "report",    attentionKeys: [] },
  { id: "reviewforge", label: "ReviewForge", icon: "🔍", seg: "review",    attentionKeys: ["review"] },
  { id: "marketpulse", label: "MarketPulse", icon: "◉", seg: "market",    attentionKeys: [] },
  { id: "dossier",     label: "Dossier",     icon: "🗂",  seg: "subject",   attentionKeys: ["evidence"] },
  { id: "muse",        label: "MUSE",        icon: "✦", seg: "muse",       attentionKeys: [] },
] as const;

const SEP_AFTER = new Set(["incomeforge", "marketpulse", "dossier"]);

export function SuiteDock() {
  const { activeAssignment, dockAttention } = useShell();
  const pathname = usePathname();

  const moduleHref = (seg: string) =>
    activeAssignment
      ? `/assignments/${activeAssignment.id}/modules/${seg}`
      : "/assignments";

  const isActive = (seg: string) =>
    activeAssignment
      ? pathname === `/assignments/${activeAssignment.id}/modules/${seg}`
      : false;

  const isHome = pathname === "/" || (!activeAssignment && !pathname.startsWith("/assignments/"));

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 52,
        zIndex: 50,
        background: "var(--tf-dock)",
        borderTop: "1px solid var(--tf-border)",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: 2,
      }}
    >
      {/* Home */}
      <Link
        href="/"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px 10px",
          borderRadius: 6,
          minWidth: 52,
          textDecoration: "none",
          background: isHome ? "var(--tf-glass)" : "transparent",
          border: isHome ? "1px solid var(--tf-border)" : "1px solid transparent",
          position: "relative",
        }}
      >
        <span style={{ fontSize: 16 }}>⌂</span>
        <span style={{ fontSize: 8, color: "var(--tf-sub)", fontWeight: 500 }}>Home</span>
        {isHome && (
          <span
            style={{
              position: "absolute",
              bottom: 2,
              left: "50%",
              transform: "translateX(-50%)",
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "var(--tf-chip-live)",
            }}
          />
        )}
      </Link>

      <div style={{ width: 1, height: 28, background: "var(--tf-border)", margin: "0 4px", flexShrink: 0 }} />

      {DOCK_MODULES.map((m) => {
        const attn = m.attentionKeys.reduce((acc, k) => acc + (dockAttention[k] ?? 0), 0);
        const active = isActive(m.seg);
        const href = moduleHref(m.seg);

        return (
          <span key={m.id} style={{ display: "contents" }}>
            <Link
              href={href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "4px 7px",
                borderRadius: 6,
                minWidth: 52,
                textDecoration: "none",
                position: "relative",
                background: active ? "var(--tf-glass)" : "transparent",
                border: active
                  ? "1px solid var(--tf-accent)"
                  : "1px solid transparent",
              }}
            >
              <span style={{ fontSize: 15 }}>{m.icon}</span>
              <span style={{ fontSize: 8, color: "var(--tf-sub)", fontWeight: 500, whiteSpace: "nowrap" }}>
                {m.label}
              </span>
              {/* Running indicator */}
              {active && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 2,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "var(--tf-chip-live)",
                  }}
                />
              )}
              {/* Attention badge */}
              {attn > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 4,
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "var(--tf-chip-warn)",
                    fontSize: 8,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  {attn}
                </span>
              )}
            </Link>
            {SEP_AFTER.has(m.id as typeof m.id) && (
              <div style={{ width: 1, height: 28, background: "var(--tf-border)", margin: "0 4px", flexShrink: 0 }} />
            )}
          </span>
        );
      })}
    </nav>
  );
}
