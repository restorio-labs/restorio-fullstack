import { defineConfig } from "vitest/config";
import { resolve } from "path";

const isCI = !!process.env.GITHUB_ACTIONS;

export default defineConfig({
  test: {
    globals: true,
    root: process.cwd(),
    environment: "jsdom",
    include: [
      "packages/*/tests/unit/**/*.{test,spec}.{ts,tsx}",
      "apps/*/tests/unit/**/*.{test,spec}.{ts,tsx}",
    ],

    exclude: [
      "/node_modules/",
      "/dist/",
      "/\.turbo/",
      "/\.next/",
    ],

    setupFiles: ["vitest.setup.ts"],
    reporters: isCI
    ? ["default", "github-actions"]
    : ["default"],

    coverage: {
      enabled: true,
      provider: "v8",
      reportsDirectory: "./coverage",

      reporter: isCI
        ? ["json-summary"]
        : ["html", "text"],

      exclude: [
        "node_modules",
        "**/*.d.ts",
        "**/*.config.*",
        "**/dist/**"
      ],
    },
  },
  resolve: {
    alias: {
      "@restorio/types": resolve(__dirname, "./packages/types/src"),
      "@restorio/ui": resolve(__dirname, "./packages/ui/src"),
      "@restorio/api-client": resolve(__dirname, "./packages/api-client/src"),
      "@restorio/auth": resolve(__dirname, "./packages/auth/src"),
    },
  },
});
