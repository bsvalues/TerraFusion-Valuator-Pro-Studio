import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TFPS Route Authority: the TerraFusion Professional Suite at `/` is the only
  // product entry point. The legacy standalone surfaces are superseded — the
  // tab-based `/workbench` dashboard by the Assignment Command Center
  // (`/assignments/[id]`), and the standalone `/report` page by the
  // workfile-bound report (`/api/tfpr/assignments/[id]/report`). Redirect them
  // home so neither can be the public product path again. Temporary (307) on
  // purpose — reversible, not browser-cached like a permanent 308.
  async redirects() {
    return [
      { source: "/workbench", destination: "/", permanent: false },
      { source: "/workbench/:path*", destination: "/", permanent: false },
      { source: "/report", destination: "/", permanent: false },
      { source: "/report/:path*", destination: "/", permanent: false },
      // Flat module segments → /modules/[seg] (307 — reversible)
      { source: "/assignments/:id/subject",   destination: "/assignments/:id/modules/subject",   permanent: false },
      { source: "/assignments/:id/evidence",  destination: "/assignments/:id/modules/evidence",  permanent: false },
      { source: "/assignments/:id/cost",      destination: "/assignments/:id/modules/cost",      permanent: false },
      { source: "/assignments/:id/sales",     destination: "/assignments/:id/modules/sales",     permanent: false },
      { source: "/assignments/:id/income",    destination: "/assignments/:id/modules/income",    permanent: false },
      { source: "/assignments/:id/reconcile", destination: "/assignments/:id/modules/reconcile", permanent: false },
      { source: "/assignments/:id/certify",   destination: "/assignments/:id/modules/certify",   permanent: false },
      { source: "/assignments/:id/review",    destination: "/assignments/:id/modules/review",    permanent: false },
      { source: "/assignments/:id/market",    destination: "/assignments/:id/modules/market",    permanent: false },
      { source: "/assignments/:id/muse",      destination: "/assignments/:id/modules/muse",      permanent: false },
    ];
  },
};

export default nextConfig;
