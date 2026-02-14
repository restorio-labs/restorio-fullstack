import { describe, expect, it } from "vitest";

import { flattenColorVars } from "../../../src/theme/tailwindUtils";

describe("flattenColorVars", () => {
  it("keeps token keys but kebab-cases CSS variable names", () => {
    const input = {
      interactive: {
        primary: "#0066cc",
        primaryHover: "#0052a3",
        primaryActive: "#004080",
      },
    };

    const result = flattenColorVars(input);

    expect(result).toEqual({
      "interactive-primary": "var(--color-interactive-primary)",
      "interactive-primaryHover": "var(--color-interactive-primary-hover)",
      "interactive-primaryActive": "var(--color-interactive-primary-active)",
    });
  });
});
