"use client";

import { useEffect } from "react";
import { useShell } from "./ShellProvider";
import type { ReviewFinding } from "@/lib/tfps/review";

export function AssignmentShellSync({ assignmentId }: { assignmentId: string }) {
  const { setActiveAssignment, setDockAttention, setBlockerCount } = useShell();

  useEffect(() => {
    let cancelled = false;

    // Load assignment title
    fetch(`/api/tfpr/assignments/${assignmentId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const title = d.workfile?.title ?? `Assignment ${assignmentId.slice(0, 8)}`;
        setActiveAssignment({ id: assignmentId, title });
      })
      .catch(() => {});

    // Load review findings for dock attention badges
    fetch(`/api/tfpr/assignments/${assignmentId}/review`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const attention: Record<string, number> = {};
        (d.findings as ReviewFinding[] | undefined)?.forEach((f) => {
          if (f.severity !== "info") {
            attention[f.module] = (attention[f.module] ?? 0) + 1;
          }
        });
        setDockAttention(attention);
        setBlockerCount(d.summary?.blockers ?? 0);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      setActiveAssignment(null);
      setDockAttention({});
      setBlockerCount(0);
    };
  }, [assignmentId, setActiveAssignment, setDockAttention, setBlockerCount]);

  return null;
}
