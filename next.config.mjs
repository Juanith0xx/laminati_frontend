/** @type {import('next').NextConfig} */

const API_PROXY_TARGET =
  process.env.API_PROXY_TARGET;

const nextConfig = {
  reactCompiler: true,

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