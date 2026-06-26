import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack's workspace root to THIS project. A stray pnpm-lock.yaml in a
  // parent directory can make Turbopack infer the wrong root in dev, which breaks
  // next/font/google resolution and renders routes as a build-error overlay.
  // `next build` is unaffected. This silences the warning and fixes `next dev --turbopack`. 
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
