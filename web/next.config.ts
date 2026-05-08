import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  async rewrites() {
    const aiBase = process.env.AI_SERVICE_URL ?? "http://localhost:8000";
    return [
      {
        source: "/api/ai/:path*",
        destination: `${aiBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
