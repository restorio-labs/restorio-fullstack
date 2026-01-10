import { createTailwindConfig } from "../../packages/ui/src/theme/tailwindUtils";

const config = createTailwindConfig({
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  uiPackagePath: "../../packages/ui",
});

export default config;
