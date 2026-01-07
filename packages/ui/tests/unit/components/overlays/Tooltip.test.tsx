/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { Tooltip } from "../../../../src/components/overlays/Tooltip";

describe("Tooltip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does not show tooltip immediately on hover", () => {
    render(
      <Tooltip content="Tooltip text" delay={300}>
        <button>Hover me</button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByText("Hover me"));

    // @ts-expect-error - test purposes
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows tooltip after delay", () => {
    render(
      <Tooltip content="Tooltip text" delay={300}>
        <button>Hover me</button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByText("Hover me"));

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // @ts-expect-error - test purposes
    expect(screen.getByRole("tooltip")).toHaveTextContent("Tooltip text");
  });

  it("clears timeout and does not show tooltip when mouse leaves early", () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    render(
      <Tooltip content="Tooltip text" delay={500}>
        <button>Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByText("Hover me");

    fireEvent.mouseEnter(trigger);

    // leave BEFORE delay finishes
    fireEvent.mouseLeave(trigger);

    act(() => {
      vi.runAllTimers();
    });

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    // @ts-expect-error - test purposes
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("hides tooltip when mouse leaves after it becomes visible", () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByText("Hover me");

    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.runAllTimers();
    });

    // @ts-expect-error - test purposes
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.mouseLeave(trigger);

    // @ts-expect-error - test purposes
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows tooltip on focus and hides on blur (keyboard support)", () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Focusable</button>
      </Tooltip>,
    );

    const trigger = screen.getByText("Focusable");

    fireEvent.focus(trigger);

    act(() => {
      vi.runAllTimers();
    });

    // @ts-expect-error - test purposes
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.blur(trigger);

    // @ts-expect-error - test purposes
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("applies correct placement classes", () => {
    render(
      <Tooltip content="Tooltip text" placement="right">
        <button>Hover me</button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByText("Hover me"));

    act(() => {
      vi.runAllTimers();
    });

    const tooltip = screen.getByRole("tooltip");

    expect(tooltip.className).toContain("left-full");
  });

  it("does not call clearTimeout when mouse leaves without active timeout (covers false branch)", () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>,
    );
    const trigger = screen.getByText("Hover me");

    fireEvent.mouseLeave(trigger);

    expect(clearTimeoutSpy).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
