import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "vitest";

import { Button } from "../../src/Button";

describe("Button", () => {
  it("should render button with children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("should apply primary variant class", () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByText("Primary");

    expect(button.className).toContain("btn-primary");
  });

  it("should apply size class", () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByText("Large");

    expect(button).toHaveClass("btn-lg");
  });
});
