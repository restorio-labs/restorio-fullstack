import { resolve } from "path";

import react from "@vitejs/plugin-react";
import { defineConfig, mergeConfig } from "vite";

import { createPanelViteConfig } from "../../vite.shared";

export default defineConfig(
  mergeConfig(createPanelViteConfig(3004), {
    plugins: [react()],
    root: ".",
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
  }),
);
