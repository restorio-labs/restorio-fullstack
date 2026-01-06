import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "vitest";

import { Input } from "../../src/components/Input";

describe("Input", () => {
  it("renders an input element", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("renders input with label text", () => {
    render(<Input label="Title" />);
    expect(screen.getByText("Title")).toBeTruthy();
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("renders error message when error prop is provided", () => {
    render(<Input error="Error message" />);
    expect(screen.getByText("Error message")).toBeTruthy();
  });
});
