import { createTailwindConfig } from "../../packages/ui/src/theme/tailwindUtils";
import type { Config } from "tailwindcss";

import { createTailwindConfig } from "../../packages/ui/src/theme/tailwindUtils";

/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call */
const config: Config = createTailwindConfig({
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./wrappers/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
});

export default config;
