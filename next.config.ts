import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // App Router is default in Next 16
  },
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
