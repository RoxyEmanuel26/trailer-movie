import type { NextConfig } from "next";
import "./src/env";
import { assertProductionSiteConfig } from "./src/lib/site-config";

assertProductionSiteConfig();

const sentryConnectOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_SENTRY_DSN ? new URL(process.env.NEXT_PUBLIC_SENTRY_DSN).origin : '';
  } catch {
    return '';
  }
})();

const nextConfig: NextConfig = {
  // Enable standalone output only when building the Docker fallback image.
  ...(process.env.NEXT_OUTPUT_STANDALONE === 'true' ? { output: 'standalone' as const } : {}),
  // Keep large local workspace folders out of Next.js/Turbopack output file tracing.
  outputFileTracingExcludes: {
    '/**': [
      './backup/**/*',
      './graphify-out/**/*',
      './tmdb-reference/**/*',
      './movieflix-deploy.tar.gz',
      './.cache/**/*',
    ],
  },
  // Keep build-time database fan-out within a small self-hosted PostgreSQL server.
  experimental: { cpus: 1 },
  // Resolve metadata before sending headers so redirects and not-found responses
  // keep their real HTTP status for crawlers, browsers, and link checkers.
  htmlLimitedBots: /.*/,
  images: {
    loader: 'custom',
    loaderFile: './src/lib/tmdb-image-loader.ts',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      }
    ],
  },
  poweredByHeader: false,
  async headers() {
    const baseCsp = `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://image.tmdb.org https://i.ytimg.com; font-src 'self' data:; connect-src 'self'${sentryConnectOrigin ? ` ${sentryConnectOrigin}` : ''}`;
    const ogImageHeaders = [
      { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
      {
        key: 'Cache-Control',
        value: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
      },
      {
        key: 'CDN-Cache-Control',
        value: 'public, max-age=3600, stale-while-revalidate=86400',
      },
      {
        key: 'Cloudflare-CDN-Cache-Control',
        value: 'public, max-age=3600, stale-while-revalidate=86400',
      },
    ];

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-site',
          },
        ],
      },
      {
        source: '/((?!embed/).*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Content-Security-Policy',
            value: baseCsp,
          },
        ],
      },
      {
        source: '/embed/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `${baseCsp}; frame-ancestors *`,
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      {
        source: '/opengraph-image:suffix(-[a-z0-9]+)?',
        headers: ogImageHeaders,
      },
      {
        source: '/:path*/opengraph-image:suffix(-[a-z0-9]+)?',
        headers: ogImageHeaders,
      },
      {
        source: '/brand/:path*',
        headers: [{ key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' }],
      },
      {
        source: '/favicon.ico',
        headers: [{ key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' }],
      },
    ];
  },
};

import { withSentryConfig } from "@sentry/nextjs";

const sentryBuildEnabled = Boolean(
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT,
);

export default sentryBuildEnabled ? withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",
}) : nextConfig;
