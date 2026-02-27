import type {
  ElementToAdd,
  FloorLayoutEditorState,
  LayoutHistoryAction,
  FloorCanvas,
  FloorElement,
} from "@restorio/types";

const nextId = (): string => `el-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const cloneFloorElement = (element: FloorElement): FloorElement => ({
  ...element,
  id: nextId(),
});

export const createElementFromToAdd = (toAdd: ElementToAdd, _tenantId?: string): FloorElement => {
  const id = nextId();
  const base = { id, x: 0, y: 0, w: 80, h: 80, zoneId: undefined };

  switch (toAdd.type) {
    case "table":
      return {
        ...base,
        type: "table",
        tableNumber: toAdd.tableNumber ?? 0,
        seats: toAdd.seats,
      };
    case "tableGroup":
      return {
        ...base,
        type: "tableGroup",
        tableNumbers: toAdd.tableNumbers,
        seats: toAdd.seats,
      };
    case "bar":
      return { ...base, type: "bar", label: toAdd.label ?? "Bar", w: 120, h: 60 };
    case "zone":
      return {
        ...base,
        type: "zone",
        name: toAdd.name,
        color: toAdd.color,
        w: 200,
        h: 120,
      };
    case "wall":
      return { ...base, type: "wall", w: 60, h: 20 };
    case "entrance":
      return { ...base, type: "entrance", label: toAdd.label ?? "Entrance", w: 80, h: 40 };
    default:
      return { ...base, type: "wall", w: 60, h: 20 };
  }
};

export const layoutHistoryReducer = (
  state: FloorLayoutEditorState,
  action: LayoutHistoryAction,
): FloorLayoutEditorState => {
  const maxHistory = 50;
  const pushHistory = (layout: FloorCanvas): FloorCanvas[] => {
    const next = [...state.history.slice(0, state.historyIndex + 1), layout];

    return next.length > maxHistory ? next.slice(-maxHistory) : next;
  };

  switch (action.type) {
    case "SET_LAYOUT": {
      return {
        layout: action.payload,
        history: [action.payload],
        historyIndex: 0,
      };
    }
    case "UPDATE_ELEMENT": {
      const { id, bounds, ...rest } = action.payload;
      const elements = state.layout.elements.map((el) => (el.id === id ? { ...el, ...(bounds ?? {}), ...rest } : el));
      const nextLayout = { ...state.layout, elements };
      const history = pushHistory(nextLayout);

      return {
        layout: nextLayout,
        history,
        historyIndex: history.length - 1,
      };
    }
    case "ADD_ELEMENT": {
      const { element, x, y } = action.payload;
      const maxZIndex = state.layout.elements.reduce((max, el) => Math.max(max, Number(el.zIndex ?? 0)), 0);
      const placed = {
        ...element,
        x,
        y,
        w: element.w || 80,
        h: element.h || 80,
        zIndex: Number(element.zIndex ?? maxZIndex + 1),
      };
      const elements = [...state.layout.elements, placed];
      const nextLayout = { ...state.layout, elements };
      const history = pushHistory(nextLayout);

      return {
        layout: nextLayout,
        history,
        historyIndex: history.length - 1,
      };
    }
    case "REMOVE_ELEMENT": {
      const elements = state.layout.elements.filter((el) => el.id !== action.payload.id);
      const nextLayout = { ...state.layout, elements };
      const history = pushHistory(nextLayout);

      return {
        layout: nextLayout,
        history,
        historyIndex: history.length - 1,
      };
    }
    case "UNDO": {
      if (state.historyIndex <= 0) {
        return state;
      }
      const nextIndex = state.historyIndex - 1;

      return {
        ...state,
        layout: state.history[nextIndex],
        historyIndex: nextIndex,
      };
    }
    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) {
        return state;
      }
      const nextIndex = state.historyIndex + 1;

      return {
        ...state,
        layout: state.history[nextIndex],
        historyIndex: nextIndex,
      };
    }
    default:
      return state;
  }
};
