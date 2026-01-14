import { createTailwindConfig } from "@restorio/ui/tailwind";
import type { Config } from "tailwindcss";

const config: Config = createTailwindConfig({
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./wrappers/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
});

export default config;
