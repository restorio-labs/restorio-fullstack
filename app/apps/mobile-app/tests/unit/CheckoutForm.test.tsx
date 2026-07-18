// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { I18nProvider } from "@restorio/ui";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CheckoutForm } from "../../src/features/order/components/CheckoutForm";
import messages from "../../src/locales/en.json";

afterEach(cleanup);

const renderForm = (onSubmit = vi.fn()) => {
  render(
    <I18nProvider locale="en" messages={messages}>
      <CheckoutForm totalAmount={42} disabled={false} isSubmitting={false} onSubmit={onSubmit} />
    </I18nProvider>,
  );

  return onSubmit;
};

describe("CheckoutForm", () => {
  it("submits normalized values through React Hook Form", async () => {
    const onSubmit = renderForm();

    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: " guest@example.com " } });
    fireEvent.change(screen.getByLabelText("Order notes (optional)"), { target: { value: "  No onions  " } });
    fireEvent.click(screen.getByRole("button", { name: "Pay 42.00 PLN" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("guest@example.com", "No onions", undefined);
    });
  });

  it("validates conditional invoice fields", async () => {
    const onSubmit = renderForm();

    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "guest@example.com" } });
    fireEvent.click(screen.getByLabelText("I need a VAT invoice (Faktura)"));
    fireEvent.click(screen.getByRole("button", { name: "Pay 42.00 PLN" }));

    expect(await screen.findByText("Company name is required")).toBeInTheDocument();
    expect(screen.getByText("NIP is required")).toBeInTheDocument();
    expect(screen.getByText("Street address is required")).toBeInTheDocument();
    expect(screen.getByText("Postal code is required")).toBeInTheDocument();
    expect(screen.getByText("City is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
