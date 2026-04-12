import { renderHook, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it } from "vitest";

import { ToastProvider } from "../../../src/providers/ToastProvider";
import { useToast } from "../../../src/hooks/useToast";

describe("useToast", () => {
  it("throws when used outside ToastProvider", () => {
    const { result } = renderHook(() => useToast());

    expect(result.error?.message).toBe("useToast must be used within a ToastProvider");
  });

  it("shows and auto-dismisses a toast", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <ToastProvider>{children}</ToastProvider>;
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast("success", "Saved", "All done", 10);
    });

    expect(screen.getByText("Saved")).toBeDefined();
    expect(screen.getByText("All done")).toBeDefined();

    await waitFor(
      () => {
        expect(screen.queryByText("Saved")).toBeNull();
      },
      { timeout: 2000 },
    );
  });
});
