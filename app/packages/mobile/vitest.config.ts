import { resolve } from "path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["../../../vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@restorio/ui": resolve(__dirname, "../ui/src"),
    },
  },
});
