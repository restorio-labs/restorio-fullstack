import { resolve } from "path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/tests-unit/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", ".next", "e2e"],
    setupFiles: ["./vitest.setup.ts"],
    environmentMatchGlobs: [
      ["**/tests-unit/**/*.tsx", "jsdom"],
      ["**/tests-unit/**/*.test.tsx", "jsdom"],
      ["**/auth/tests-unit/storage.test.ts", "jsdom"],
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests-unit/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/dist/**",
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
