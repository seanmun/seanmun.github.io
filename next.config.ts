import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Removed 'output: export' - Vercel handles Next.js natively
  images: {
    unoptimized: true, // Keep for now, can optimize later
  },
  // Enable Turbopack (Next.js 16 default)
  turbopack: {},
  // Retired project slugs from the Agent Army consolidation
  async redirects() {
    return [
      {
        source: '/projects/fantasy-league-bot',
        destination: '/projects/agent-army',
        permanent: true,
      },
      {
        source: '/projects/aibert-bot',
        destination: '/projects/agent-army',
        permanent: true,
      },
      // Moved behind the speakeasy door
      {
        source: '/projects/cross-chain-portfolio-tracker',
        destination: '/projects/classified',
        permanent: false,
      },
      {
        source: '/projects/hometown-hotspots',
        destination: '/projects/classified',
        permanent: false,
      },
    ];
  },
  // Add security headers (Vercel-specific)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Content-Security-Policy',
            // The browser only talks to this site: analytics and Firestore go
            // through /api, and Spotify is an iframe. WebAssembly runs on the
            // home page; full eval is only for the dev server's fast refresh.
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self'; font-src 'self' data:; connect-src 'self' blob:; frame-src https://open.spotify.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';`,
          },
        ],
      },
    ];
  },
  // Keep Firebase webpack config
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
    };
    return config;
  },
}

export default nextConfig