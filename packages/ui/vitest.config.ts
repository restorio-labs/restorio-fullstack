import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["../../vitest.setup.ts", "./tests/test.setup.ts"],
  },
  resolve: {
    alias: {
      "@restorio/types": resolve(__dirname, "../../packages/types/src"),
      "@restorio/ui": resolve(__dirname, "./src"),
    },
  },
});
