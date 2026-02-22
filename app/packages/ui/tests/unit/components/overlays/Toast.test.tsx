/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, it, expect, vi } from "vitest";

import { Toast, ToastContainer } from "../../../../src/components/overlays/Toast";

describe("Toast", () => {
  it("should render title", () => {
    render(<Toast id="1" title="Toast title" />);
    // @ts-expect-error - test purposes
    expect(screen.getByText("Toast title")).toBeInTheDocument();
  });

  it("should render description when provided", () => {
    render(<Toast id="1" title="Title" description="Description text" />);
    // @ts-expect-error - test purposes
    expect(screen.getByText("Description text")).toBeInTheDocument();
  });

  it("should render action when provided", () => {
    render(
      <Toast
        id="1"
        title="Title"
        action={
          <button type="button" data-testid="action">
            Action
          </button>
        }
      />,
    );
    // @ts-expect-error - test purposes
    expect(screen.getByTestId("action")).toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<Toast id="1" title="Title" onClose={onClose} />);

    const closeButton = screen.getByLabelText("Close toast");

    await user.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should not render close button when onClose is not provided", () => {
    render(<Toast id="1" title="Title" />);
    // @ts-expect-error - test purposes
    expect(screen.queryByLabelText("Close toast")).not.toBeInTheDocument();
  });

  it("should apply variant styles", () => {
    const { rerender } = render(<Toast id="1" title="Title" variant="info" />);

    expect(screen.getByRole("alert").className).toContain("bg-status-info-background");

    rerender(<Toast id="1" title="Title" variant="error" />);
    expect(screen.getByRole("alert").className).toContain("bg-status-error-background");
  });

  it("should have proper aria attributes", () => {
    render(<Toast id="1" title="Title" />);
    // @ts-expect-error - test purposes
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "polite");
  });
});

describe("ToastContainer", () => {
  it("should render children", () => {
    render(
      <ToastContainer>
        <Toast id="1" title="Toast 1" />
        <Toast id="2" title="Toast 2" />
      </ToastContainer>,
    );
    // @ts-expect-error - test purposes
    expect(screen.getByText("Toast 1")).toBeInTheDocument();
    // @ts-expect-error - test purposes
    expect(screen.getByText("Toast 2")).toBeInTheDocument();
  });

  it("should apply position classes", () => {
    const { rerender } = render(
      <ToastContainer position="top-right">
        <Toast id="1" title="Toast" />
      </ToastContainer>,
    );

    expect(screen.getByRole("region").className).toContain("top-4");
    expect(screen.getByRole("region").className).toContain("end-4");

    rerender(
      <ToastContainer position="bottom-left">
        <Toast id="1" title="Toast" />
      </ToastContainer>,
    );
    expect(screen.getByRole("region").className).toContain("bottom-4");
    expect(screen.getByRole("region").className).toContain("start-4");
  });

  it("should have proper aria attributes", () => {
    render(
      <ToastContainer>
        <Toast id="1" title="Toast" />
      </ToastContainer>,
    );
    const container = screen.getByRole("region");

    // @ts-expect-error - test purposes
    expect(container).toHaveAttribute("aria-label", "Notifications");
    // @ts-expect-error - test purposes
    expect(container).toHaveAttribute("aria-live", "polite");
  });
});
