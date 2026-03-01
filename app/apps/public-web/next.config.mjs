import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import createNextIntlPlugin from "next-intl/plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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
  async rewrites() {
    const target = process.env.NEXT_PUBLIC_API_PROXY_TARGET ?? "http://localhost:8000";

    return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
  },
  turbopack: {},
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

export default withNextIntl(nextConfig);
