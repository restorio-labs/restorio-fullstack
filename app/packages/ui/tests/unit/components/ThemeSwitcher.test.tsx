import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ThemeSwitcher } from "../../../src/components/ThemeSwitcher";
import { ThemeProvider } from "../../../src/theme/ThemeProvider";

describe("ThemeSwitcher", () => {
  it("renders with default mode", () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    );

    expect(screen.getByRole("button")).toBeDefined();
  });

  it("toggles between light and dark modes", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider defaultMode="light">
        <ThemeSwitcher />
      </ThemeProvider>,
    );

    const button = screen.getByRole("button");

    expect(button.getAttribute("aria-label")).toContain("Light");

    await user.click(button);

    expect(button.getAttribute("aria-label")).toContain("Dark");

    await user.click(button);

    expect(button.getAttribute("aria-label")).toContain("Light");
  });

  it("shows label when showLabel is true", () => {
    render(
      <ThemeProvider defaultMode="light">
        <ThemeSwitcher showLabel />
      </ThemeProvider>,
    );

    expect(screen.getByText("Light")).toBeDefined();
  });

  it("hides label when showLabel is false", () => {
    render(
      <ThemeProvider defaultMode="dark">
        <ThemeSwitcher showLabel={false} />
      </ThemeProvider>,
    );

    expect(screen.queryByText("Dark")).toBeNull();
  });

  it("applies custom className", () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher className="custom-class" />
      </ThemeProvider>,
    );

    const button = screen.getByRole("button");

    expect(button.className).toContain("custom-class");
  });

  it("uses custom labels", () => {
    render(
      <ThemeProvider defaultMode="light">
        <ThemeSwitcher showLabel lightLabel="Claro" darkLabel="Oscuro" />
      </ThemeProvider>,
    );

    expect(screen.getByText("Claro")).toBeDefined();
  });

  it("uses custom aria-label template", () => {
    render(
      <ThemeProvider defaultMode="dark">
        <ThemeSwitcher ariaLabelTemplate={(theme) => `Cambiar tema: ${theme}`} />
      </ThemeProvider>,
    );

    const button = screen.getByRole("button");

    expect(button.getAttribute("aria-label")).toContain("Cambiar tema:");
  });
});
