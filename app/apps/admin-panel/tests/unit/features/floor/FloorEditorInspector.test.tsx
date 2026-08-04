import type { FloorCanvas, FloorElement } from "@restorio/types";
import { I18nProvider } from "@restorio/ui";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FloorEditorInspector } from "../../../../src/features/floor/components/FloorEditorInspector";
import { fallbackMessages, getMessages } from "../../../../src/i18n/messages";

const selectedTable: FloorElement = {
  id: "table-1",
  type: "table",
  tableNumber: 1,
  seats: 4,
  x: 0,
  y: 0,
  w: 80,
  h: 80,
};

const layout: FloorCanvas = {
  id: "floor-1",
  tenantId: "tenant-1",
  name: "Main room",
  width: 800,
  height: 600,
  elements: [selectedTable],
  version: 1,
};

const renderInspector = (selectedElement: FloorElement | null, selectedIds: string[]) =>
  render(
    <I18nProvider locale="pl" messages={getMessages("pl")} fallbackMessages={fallbackMessages}>
      <FloorEditorInspector
        layout={layout}
        selectedElement={selectedElement}
        selectedIds={selectedIds}
        zoneColors={[]}
        dispatch={vi.fn()}
        onRemoveSelected={vi.fn()}
      />
    </I18nProvider>,
  );

describe("FloorEditorInspector", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe(): void {}
        disconnect(): void {}
      },
    );
  });

  it("replaces the empty-state copy with editing controls after selecting an element", () => {
    const { rerender } = renderInspector(null, []);

    expect(screen.getByRole("heading", { name: "Dostosuj" })).toBeInTheDocument();
    expect(screen.getByText("Tryb kontroli: tylko zaznaczanie i przesuwanie.")).toBeInTheDocument();

    rerender(
      <I18nProvider locale="pl" messages={getMessages("pl")} fallbackMessages={fallbackMessages}>
        <FloorEditorInspector
          layout={layout}
          selectedElement={selectedTable}
          selectedIds={[selectedTable.id]}
          zoneColors={[]}
          dispatch={vi.fn()}
          onRemoveSelected={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(screen.queryByRole("heading", { name: "Dostosuj" })).not.toBeInTheDocument();
    expect(screen.queryByText("Tryb kontroli: tylko zaznaczanie i przesuwanie.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Przesuń" }));

    expect(screen.getByText("Warstwa")).toBeInTheDocument();
    expect(screen.getByText("Przesuń na wierzch")).toBeInTheDocument();
    expect(screen.getByText("Przesuń na spód")).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem", { hidden: true })).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Usuń" })).toBeInTheDocument();
  });
});
