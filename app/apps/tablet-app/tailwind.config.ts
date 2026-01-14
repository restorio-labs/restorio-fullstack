import { createTailwindConfig } from "@restorio/ui/tailwind";

const config = createTailwindConfig({
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
});

export default config;
