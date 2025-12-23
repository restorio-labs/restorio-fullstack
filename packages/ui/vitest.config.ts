import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests-unit/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["../../vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@restorio/types": path.resolve(__dirname, "../../packages/types/src"),
      "@restorio/ui": path.resolve(__dirname, "./src"),
    },
  },
});
