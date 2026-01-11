import path from "path";

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ["react", "react-dom"],
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
