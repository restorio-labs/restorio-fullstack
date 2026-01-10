import { createTailwindConfig } from "@restorio/ui";

const config = createTailwindConfig({
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  uiPackagePath: "@restorio/ui",
});

export default config;
