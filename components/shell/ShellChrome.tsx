"use client";

import { ShellProvider } from "./ShellProvider";
import { TopSystemBar } from "./TopSystemBar";
import { SuiteDock } from "./SuiteDock";

export function ShellChrome({ children }: { children: React.ReactNode }) {
  return (
    <ShellProvider>
      <TopSystemBar />
      <div style={{ paddingTop: 44, paddingBottom: 52, minHeight: "100vh" }}>
        {children}
      </div>
      <SuiteDock />
    </ShellProvider>
  );
}
