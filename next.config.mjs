/** @type {import('next').NextConfig} */

import {
  seoRedirects,
} from "./seo-redirects.mjs";

const API_PROXY_TARGET =
  process.env.API_PROXY_TARGET;

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig = {
  reactCompiler: true,

  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },

  async redirects() {
    return seoRedirects;
  },

  async rewrites() {
    if (!API_PROXY_TARGET) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination:
          `${API_PROXY_TARGET}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
