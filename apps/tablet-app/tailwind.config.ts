import { createTailwindConfig } from "@restorio/ui/src/theme/tailwindUtils";

const config = createTailwindConfig({
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  uiPackagePath: "@restorio/ui",
});

export default config;
