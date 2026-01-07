/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi } from "vitest";

import { Icon } from "../../../../src/components/primitives/Icon";

describe("Icon", () => {
  it("should render SVG element", () => {
    render(
      <Icon data-testid="test-icon">
        <path d="M10 10" />
      </Icon>,
    );
    // @ts-expect-error - test purposes
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("should apply size classes", () => {
    const { rerender } = render(
      <Icon size="xs" data-testid="test-icon">
        <path d="M10 10" />
      </Icon>,
    );

    expect(screen.getByTestId("test-icon").getAttribute("class")).toContain("w-3");

    rerender(
      <Icon size="sm" data-testid="test-icon">
        <path d="M10 10" />
      </Icon>,
    );
    expect(screen.getByTestId("test-icon").getAttribute("class")).toContain("w-4");

    rerender(
      <Icon size="md" data-testid="test-icon">
        <path d="M10 10" />
      </Icon>,
    );
    expect(screen.getByTestId("test-icon").getAttribute("class")).toContain("w-5");

    rerender(
      <Icon size="lg" data-testid="test-icon">
        <path d="M10 10" />
      </Icon>,
    );
    expect(screen.getByTestId("test-icon").getAttribute("class")).toContain("w-6");

    rerender(
      <Icon size="xl" data-testid="test-icon">
        <path d="M10 10" />
      </Icon>,
    );
    expect(screen.getByTestId("test-icon").getAttribute("class")).toContain("w-8");
  });

  it("should have aria-hidden attribute", () => {
    render(
      <Icon data-testid="test-icon">
        <path d="M10 10" />
      </Icon>,
    );
    // @ts-expect-error - test purposes
    expect(screen.getByTestId("test-icon")).toHaveAttribute("aria-hidden", "true");
  });

  it("should forward ref", () => {
    const ref = vi.fn();

    render(
      <Icon ref={ref}>
        <path d="M10 10" />
      </Icon>,
    );
    expect(ref).toHaveBeenCalled();
  });
});
