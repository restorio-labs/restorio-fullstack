import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PreviewEnvironmentNotice } from "../../../../src/components/feedback/PreviewEnvironmentNotice";

describe("PreviewEnvironmentNotice", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders only on a preview hostname", async () => {
    vi.stubGlobal("window", { location: { hostname: "preview-admin.restorio.org" } });

    render(<PreviewEnvironmentNotice />);

    expect(await screen.findByRole("status", { name: "Środowisko podglądowe" })).toHaveTextContent(
      "Preview - środowisko testowe",
    );
  });

  it("does not render outside preview", () => {
    vi.stubGlobal("window", { location: { hostname: "localhost" } });

    render(<PreviewEnvironmentNotice />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
