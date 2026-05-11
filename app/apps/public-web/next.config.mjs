/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ["@restorio/ui", "@restorio/types", "@restorio/auth", "@restorio/api-client"],
  experimental: {
    optimizePackageImports: ["@restorio/ui", "react-icons"],
  },
  async rewrites() {
    const target = process.env.NEXT_PUBLIC_API_PROXY_TARGET ?? "http://localhost";

    return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
  },
};

export default nextConfig;
