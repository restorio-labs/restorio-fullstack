import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    "react",
    "react-dom",
    "react-router-dom",
    "@restorio/api-client",
    "@restorio/types",
    "@restorio/ui",
    "@restorio/utils",
  ],
  tsconfig: "./tsconfig.dts.json",
});
