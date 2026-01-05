import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["../../vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@restorio/types": path.resolve(
        __dirname,
        "../types/dist/index.js"
      ),
    },
  },
});
