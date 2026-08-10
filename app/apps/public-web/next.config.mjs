/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@restorio/ui", "@restorio/types", "@restorio/auth", "@restorio/api-client"],
  async rewrites() {
    if (process.env.NODE_ENV !== "development") {
      return [];
    }

    const apiOrigin = process.env.RESTORIO_LOCAL_API_ORIGIN ?? "http://localhost:8000";

    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["@restorio/ui", "react-icons"],
  },
};

export default nextConfig;
