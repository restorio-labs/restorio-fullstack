import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@restorio/ui", "@restorio/types", "@restorio/auth", "@restorio/api-client"],
  outputFileTracingRoot: resolve(__dirname, "../../.."),
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    optimizePackageImports: ["@restorio/ui", "react-icons"],
  },
  turbopack: {},
};

export default nextConfig;
