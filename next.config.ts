import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: __dirname,
  },
  // PATCH_76: Redirect old deal/rental routes to unified service detail page
  async redirects() {
    return [
      {
        source: "/deals/:id",
        destination: "/services/:id",
        permanent: true,
      },
      {
        source: "/rentals/:id",
        destination: "/services/:id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
