import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ["@restorio/ui", "@restorio/types", "@restorio/auth", "@restorio/api-client"],
  outputFileTracingRoot: resolve(__dirname, "../../.."),
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    optimizePackageImports: ["@restorio/ui", "react-icons"],
  },
  webpack: (config, { dev }) => {
    if (dev && config.watchOptions) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: false,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
