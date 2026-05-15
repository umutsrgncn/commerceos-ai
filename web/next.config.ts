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
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        // Tüm path'lere defansif security headers
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          // CSP — iyzico checkout, trycloudflare.com, ve kendi resource'larımız
          // 'unsafe-inline' Tailwind v4 + Next 15 RSC gereksinimi (style-src)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sandbox-static.iyzipay.com https://static.iyzipay.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://sandbox-api.iyzipay.com https://api.iyzipay.com",
              "frame-src 'self' https://sandbox-static.iyzipay.com https://static.iyzipay.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
