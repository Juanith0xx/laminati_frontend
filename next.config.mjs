/** @type {import('next').NextConfig} */

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

  /*
   * Evita exponer innecesariamente
   * que el frontend utiliza Next.js.
   */
  poweredByHeader: false,

  /*
   * Headers generales de seguridad.
   *
   * No agregamos CSP todavía.
   * Primero debemos levantar el inventario de
   * scripts, imágenes y recursos externos para
   * no romper catálogo, checkout o integraciones.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
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