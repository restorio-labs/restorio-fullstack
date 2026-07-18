import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MobileRuntimeRenderer } from "../../src";
import type { MobileRuntimeViewModel } from "../../src";

const landingViewModel: MobileRuntimeViewModel = {
  screen: {
    screen: "landing",
    content: {
      headline: "Restorio Test",
      subtitle: "Choose what you need",
      primaryActionLabel: "Find a table",
      secondaryActionLabel: "Browse menu",
    },
  },
  navigation: {
    ariaLabel: "Quick navigation",
    items: [
      { id: "home", label: "Home", active: true },
      { id: "menu", label: "Menu" },
    ],
  },
  theme: {
    appearance: "light",
    override: {
      colorsLight: {
        background: { primary: "#fefefe" },
      },
    },
  },
};

describe("MobileRuntimeRenderer", () => {
  it("renders a themed landing screen and delegates actions", () => {
    const onPrimaryLandingAction = vi.fn();
    const onNavigate = vi.fn();

    const { container } = render(
      <MobileRuntimeRenderer viewModel={landingViewModel} actions={{ onPrimaryLandingAction, onNavigate }} contained />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Find a table" }));
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));

    expect(onPrimaryLandingAction).toHaveBeenCalledOnce();
    expect(onNavigate).toHaveBeenCalledWith("menu");
    expect(container.querySelector("[data-mobile-screen='landing']")).toHaveStyle({
      "--color-background-primary": "#fefefe",
    });
  });

  it("keeps preview interactions disabled", () => {
    const onPrimaryLandingAction = vi.fn();

    render(
      <MobileRuntimeRenderer viewModel={landingViewModel} actions={{ onPrimaryLandingAction }} disabled contained />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Find a table" }));

    expect(onPrimaryLandingAction).not.toHaveBeenCalled();
  });

  it("disables navigation actions when no navigation handler is provided", () => {
    render(<MobileRuntimeRenderer viewModel={landingViewModel} contained />);

    expect(screen.getByRole("button", { name: "Menu" })).toBeDisabled();
  });

  it("renders menu content from view models without router or API state", () => {
    const onOpenMenuItem = vi.fn();
    const menuViewModel: MobileRuntimeViewModel = {
      ...landingViewModel,
      screen: {
        screen: "menu",
        content: {
          title: "Restorio Test",
          subtitle: "Menu",
          backLabel: "Back",
          emptyTitle: "No items",
          emptyDescription: "Try again later",
          categories: [
            {
              id: "main",
              name: "Main dishes",
              items: [{ id: "pierogi", name: "Pierogi", priceLabel: "24.00 PLN" }],
            },
          ],
        },
      },
    };

    render(<MobileRuntimeRenderer viewModel={menuViewModel} actions={{ onOpenMenuItem }} contained />);
    fireEvent.click(screen.getByRole("button", { name: /Pierogi/ }));

    expect(screen.getByRole("heading", { name: "Main dishes" })).toBeInTheDocument();
    expect(onOpenMenuItem).toHaveBeenCalledWith("pierogi");
  });
});
