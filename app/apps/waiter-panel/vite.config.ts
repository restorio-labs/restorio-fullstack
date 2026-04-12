import { resolve } from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  root: ".",
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3004,
    proxy: {
      "^/api": {
        target: "http://localhost",
        changeOrigin: true,
        cookieDomainRewrite: "localhost",
      },
    },
  },
});
