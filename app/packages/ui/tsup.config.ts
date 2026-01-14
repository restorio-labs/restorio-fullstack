import path from "path";

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/theme/tailwindUtils.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  tsconfig: "./tsconfig.dts.json",
  esbuildPlugins: [
    {
      name: "path-alias",
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      setup(build) {
        build.onResolve({ filter: /^@utils$/ }, () => {
          return {
            path: path.resolve(__dirname, "./src/utils/index.ts"),
          };
        });
        build.onResolve({ filter: /^@components/ }, (args) => {
          const match = args.path.match(/^@components\/(.+)$/);

          if (match) {
            return {
              path: path.resolve(__dirname, "./src/components", match[1]),
            };
          }

          return {
            path: path.resolve(__dirname, "./src/components"),
          };
        });
      },
    },
  ],
});
