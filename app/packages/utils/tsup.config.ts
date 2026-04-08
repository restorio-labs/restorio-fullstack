import { defineConfig } from "tsup";

const sharedConfig = {
  entry: ["src/index.ts"],
  dts: true,
  sourcemap: false,
  tsconfig: "./tsconfig.dts.json",
} as const;

export default defineConfig([
  {
    ...sharedConfig,
    format: ["esm"],
    clean: true,
  },
  {
    ...sharedConfig,
    format: ["cjs"],
    esbuildOptions(options) {
      options.define = {
        ...(options.define ?? {}),
        "import.meta": "undefined",
        "import.meta.env": "process.env",
      };
    },
  },
]);
