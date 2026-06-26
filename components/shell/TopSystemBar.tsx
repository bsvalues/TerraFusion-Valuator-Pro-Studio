"use client";

import Link from "next/link";
import { useShell } from "./ShellProvider";

export function TopSystemBar() {
  const { theme, toggleTheme, activeAssignment, blockerCount } = useShell();

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 44,
        zIndex: 50,
        background: "var(--tf-bar)",
        borderBottom: "1px solid var(--tf-border)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 10,
      }}
    >
      {/* OS identity */}
      <Link
        href="/"
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.07em",
          color: "var(--tf-accent)",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        TERRAFUSION PROFESSIONAL OS
      </Link>

      <div style={{ width: 1, height: 20, background: "var(--tf-border)", flexShrink: 0 }} />

      {/* Suite subtitle or active assignment context */}
      {activeAssignment ? (
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--tf-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 320 }}>
          {activeAssignment.title}
        </span>
      ) : (
        <span style={{ fontSize: 10, color: "var(--tf-sub)", whiteSpace: "nowrap" }}>
          Commercial Appraisal Suite
        </span>
      )}

      <div style={{ flex: 1 }} />

      {/* Search pill */}
      <span
        style={{
          fontSize: 10,
          padding: "3px 10px",
          borderRadius: 12,
          border: "1px solid var(--tf-border)",
          color: "var(--tf-sub)",
          background: "var(--tf-glass)",
          whiteSpace: "nowrap",
          cursor: "default",
        }}
      >
        ⌘K&nbsp;&nbsp;Search or jump…
      </span>

      <div style={{ width: 1, height: 20, background: "var(--tf-border)", flexShrink: 0 }} />

      {/* MUSE pill — navigates to MUSE module if inside assignment, else assignments list */}
      <Link
        href={activeAssignment ? `/assignments/${activeAssignment.id}/modules/muse` : "/assignments"}
        style={{
          fontSize: 10,
          padding: "3px 10px",
          borderRadius: 12,
          border: "1px solid var(--tf-accent)",
          color: "var(--tf-accent)",
          background: "var(--tf-glass)",
          whiteSpace: "nowrap",
          textDecoration: "none",
          cursor: "pointer",
        }}
      >
        ✦ MUSE
      </Link>

      <div style={{ width: 1, height: 20, background: "var(--tf-border)", flexShrink: 0 }} />

      {/* Trace status — red dot when blockers exist */}
      {blockerCount > 0 && (
        <span
          title={`${blockerCount} blocker(s) — open ReviewForge`}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--tf-chip-block)",
            flexShrink: 0,
            cursor: "pointer",
          }}
        />
      )}

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={theme === "night" ? "Switch to Professional Light" : "Switch to TerraFusion Night"}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          color: "var(--tf-sub)",
          padding: "2px 4px",
          lineHeight: 1,
        }}
      >
        {theme === "night" ? "☀" : "◑"}
      </button>

      {/* Profile */}
      <span
        style={{
          fontSize: 10,
          padding: "3px 8px",
          borderRadius: 12,
          border: "1px solid var(--tf-border)",
          color: "var(--tf-sub)",
          background: "var(--tf-glass)",
          whiteSpace: "nowrap",
          cursor: "default",
        }}
      >
        Appraiser
      </span>
    </header>
  );
}
