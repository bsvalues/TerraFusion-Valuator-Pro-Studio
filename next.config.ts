import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack's workspace root to THIS project. A stray pnpm-lock.yaml in a
  // parent directory (C:\Users\bsval) made Turbopack infer the wrong root in dev,
  // which broke next/font/google (Geist) resolution and rendered every route as a
  // build-error overlay. `next build` was unaffected. This silences the warning and
  // fixes `next dev --turbopack`.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
