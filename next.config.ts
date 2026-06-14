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
    ];
  },
};

export default nextConfig;
