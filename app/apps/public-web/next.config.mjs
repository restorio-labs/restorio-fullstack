/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@restorio/ui", "@restorio/types", "@restorio/auth", "@restorio/api-client"],
  experimental: {
    optimizePackageImports: ["@restorio/ui", "react-icons"],
  },
};

export default nextConfig;
