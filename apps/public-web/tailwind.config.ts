import { createTailwindConfig } from "@restorio/ui";
import type { Config } from "tailwindcss";

const config: Config = createTailwindConfig({
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./wrappers/**/*.{ts,tsx}"],
  uiPackagePath: "../../packages/ui",
});

export default config;
