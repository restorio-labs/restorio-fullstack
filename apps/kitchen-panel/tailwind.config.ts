import { createTailwindConfig } from "@restorio/ui";

const config = createTailwindConfig({
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  uiPackagePath: "../../packages/ui",
});

export default config;
