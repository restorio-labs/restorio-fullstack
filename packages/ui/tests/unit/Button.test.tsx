import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "bun:test";

import { Button } from "../../src/Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeDefined();
  });

  it("applies primary variant class", () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByText("Primary").className).toContain("btn-primary");
  });

  it("applies size class", () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByText("Large").className).toContain("btn-lg");
  });
});
