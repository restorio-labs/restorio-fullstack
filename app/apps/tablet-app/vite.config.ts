import { resolve } from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  root: ".",
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@restorio/types": resolve(__dirname, "../../packages/types/src"),
      "@restorio/ui": resolve(__dirname, "../../packages/ui/src"),
      "@restorio/auth": resolve(__dirname, "../../packages/auth/src"),
      "@restorio/api-client": resolve(__dirname, "../../packages/api-client/src"),
    },
  },
  optimizeDeps: {
    exclude: ["@restorio/types", "@restorio/ui", "@restorio/auth", "@restorio/api-client"],
  },
  server: {
    port: 3003,
  },
});
