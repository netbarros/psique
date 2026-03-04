import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      { protocol: "https", hostname: "api.qrserver.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://maps.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://api.qrserver.com",
              "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://openrouter.ai https://api.daily.co https://api.telegram.org https://api.stripe.com https://sentry.io https://*.sentry.io",
              "frame-src https://js.stripe.com https://*.daily.co",
              "media-src 'self' blob: https://*.supabase.co",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry org and project from env (set these in Vercel)
  org: process.env.SENTRY_ORG || "software-lotus",
  project: process.env.SENTRY_PROJECT || "javascript-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only upload source maps in CI/production builds
  silent: !process.env.CI,

  // Upload source maps on build
  widenClientFileUpload: true,
  hideSourceMaps: true,
});

