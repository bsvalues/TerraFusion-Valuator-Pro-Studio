"use client";

import { use, type ReactNode } from "react";
import { SubjectWorkbenchProvider } from "@/lib/subject-workbench-context";
import { AssignmentShellSync } from "@/components/shell/AssignmentShellSync";

export default function AssignmentLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <SubjectWorkbenchProvider assignmentId={id}>
      <AssignmentShellSync assignmentId={id} />
      {children}
    </SubjectWorkbenchProvider>
  );
}
