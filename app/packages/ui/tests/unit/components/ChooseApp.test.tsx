import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChooseApp } from "../../../src/components/ChooseApp";

const labels = {
  adminPanel: "Admin",
  kitchenPanel: "Kitchen",
  waiterPanel: "Waiter",
};

describe("ChooseApp", () => {
  it("renders button variant and calls onSelectApp", async () => {
    const onSelectApp = vi.fn();
    const user = userEvent.setup();

    render(<ChooseApp onSelectApp={onSelectApp} ariaLabel="choose app" />);

    expect(screen.getByText("You’re logged in")).toBeDefined();
    expect(screen.getByText("Choose where you want to go next.")).toBeDefined();

    await user.click(screen.getByText("Admin"));
    await user.click(screen.getByText("Kitchen"));
    await user.click(screen.getByText("Waiter"));

    expect(onSelectApp).toHaveBeenNthCalledWith(1, "admin-panel");
    expect(onSelectApp).toHaveBeenNthCalledWith(2, "kitchen-panel");
    expect(onSelectApp).toHaveBeenNthCalledWith(3, "waiter-panel");
  });

  it("renders dropdown variant and excludes current value from options", async () => {
    const onSelectApp = vi.fn();
    const user = userEvent.setup();

    render(
      <ChooseApp
        variant="dropdown"
        value="admin-panel"
        onSelectApp={onSelectApp}
        ariaLabel="switch app"
        className="custom-wrapper"
      />,
    );

    const trigger = screen.getByRole("button", { name: "switch app" });

    expect(trigger.textContent).toContain("Admin");
    expect(document.querySelector(".custom-wrapper")).not.toBeNull();

    await user.click(trigger);

    const menu = screen.getByRole("menu");
    expect(menu.textContent).not.toContain("Admin");
    await user.click(screen.getByText("Kitchen"));

    expect(onSelectApp).toHaveBeenCalledWith("kitchen-panel");
  });

  it("renders dropdown variant with large subvariant", async () => {
    const onSelectApp = vi.fn();
    const user = userEvent.setup();

    render(
      <ChooseApp
        variant="dropdown"
        subvariant="large"
        value="admin-panel"
        onSelectApp={onSelectApp}
        ariaLabel="switch app"
        className="custom_wrapper"
      />,
    );

    const trigger = screen.getByRole("button", { name: "switch app" });

    expect(trigger.textContent).toContain("Admin");
    expect(document.querySelector(".custom_wrapper")).not.toBeNull();
    expect(trigger.className).toContain("text-sm");
    expect(trigger.className).toContain("px-3");
    expect(trigger.className).toContain("py-2");
    expect(trigger.className).toContain("max-w-[400px]");

    await user.click(trigger);

    const menu = screen.getByRole("menu");
    expect(menu.textContent).not.toContain("Admin");
    await user.click(screen.getByText("Kitchen"));

    expect(onSelectApp).toHaveBeenCalledWith("kitchen-panel");
  });
});
