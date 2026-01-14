/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen } from "@testing-library/react";
import React, { type ReactElement, forwardRef, type SVGProps } from "react";
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

  it("should render custom component via 'as' prop", () => {
    const CustomComponent = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>((props, ref) => (
      <g ref={ref} data-testid="custom-as" {...props} />
    ));

    render(<Icon as={CustomComponent} size="lg" className="test-class" />);

    const element = screen.getByTestId("custom-as");

    // @ts-expect-error - test purposes
    expect(element).toBeInTheDocument();
    // @ts-expect-error - test purposes
    expect(element).toHaveClass("w-6 h-6");
    // @ts-expect-error - test purposes
    expect(element).toHaveClass("test-class");
  });

  it("should clone and merge props when child is a direct SVG element", () => {
    render(
      <Icon size="sm" className="parent-class" aria-label="test-label">
        <svg data-testid="direct-svg" className="child-class" />
      </Icon>,
    );

    const svg = screen.getByTestId("direct-svg");

    // @ts-expect-error - test purposes
    expect(svg).toHaveClass("w-4 h-4");
    // @ts-expect-error - test purposes
    expect(svg).toHaveClass("parent-class");
    // @ts-expect-error - test purposes
    expect(svg).toHaveClass("child-class");

    // @ts-expect-error - test purposes
    expect(svg).toHaveAttribute("aria-label", "test-label");
  });

  it("should wrap functional component children in a span with size styles", () => {
    const CustomIcon = ({ className }: { className?: string }): ReactElement => (
      <svg data-testid="func-icon" className={className} />
    );

    const { container } = render(
      <Icon size="xl">
        <CustomIcon className="inner-class" />
      </Icon>,
    );

    const wrapperSpan = container.querySelector("span");
    const icon = screen.getByTestId("func-icon");

    // @ts-expect-error - test purposes
    expect(wrapperSpan).toBeInTheDocument();
    // @ts-expect-error - test purposes
    expect(wrapperSpan).toHaveClass("w-8 h-8");
    // @ts-expect-error - test purposes
    expect(icon).toBeInTheDocument();
  });

  it("should render text children directly (covering non-element check)", () => {
    render(<Icon data-testid="text-icon">KM</Icon>);
    const icon = screen.getByTestId("text-icon");

    // @ts-expect-error - test purposes
    expect(icon).toBeInTheDocument();
    // @ts-expect-error - test purposes
    expect(icon).toHaveTextContent("KM");
  });
});
