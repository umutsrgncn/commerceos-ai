import type { NextConfig } from "next";

/**
 * Direct rewrites to the AI service are intentionally NOT wired here —
 * every AI call must go through an authed Next.js route handler or
 * server action so that the FastAPI service stays internal-only.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  experimental: {
    typedRoutes: true,
  },
  // Production build sırasında ESLint stilistik hataları engellemesin.
  // Tip kontrolü ayrı bir adımda (pnpm typecheck) koşar.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
