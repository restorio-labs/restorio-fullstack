import { resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
const workspaceRoot = resolve(__dirname, "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@restorio/ui", "@restorio/types", "@restorio/auth", "@restorio/api-client"],
  webpack: (config) => {
    config.resolve.symlinks = true;
    return config;
  },
  experimental: {
    turbo: {
      root: workspaceRoot,
    },
  },
};

export default nextConfig;
