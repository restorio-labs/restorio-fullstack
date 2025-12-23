import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: ".",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@restorio/types": path.resolve(__dirname, "../../packages/types/src"),
      "@restorio/api-client": path.resolve(
        __dirname,
        "../../packages/api-client/src"
      ),
      "@restorio/auth": path.resolve(__dirname, "../../packages/auth/src"),
      "@restorio/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
  server: {
    port: 3002,
  },
});
