export const colorTokens = {
  light: {
    background: {
      primary: "#ffffff",
      secondary: "#f8f9fa",
      tertiary: "#f1f3f5",
      inverse: "#1a1a1a",
    },
    surface: {
      primary: "#ffffff",
      secondary: "#f8f9fa",
      elevated: "#ffffff",
      overlay: "rgba(0, 0, 0, 0.5)",
    },
    border: {
      default: "#e9ecef",
      muted: "#f1f3f5",
      strong: "#ced4da",
      focus: "#0066cc",
    },
    text: {
      primary: "#1a1a1a",
      secondary: "#495057",
      tertiary: "#6c757d",
      inverse: "#ffffff",
      disabled: "#adb5bd",
      error: "#dc3545",
      success: "#28a745",
      warning: "#ffc107",
      info: "#17a2b8",
    },
    interactive: {
      primary: "#0066cc",
      primaryHover: "#0052a3",
      primaryActive: "#003d7a",
      secondary: "#6c757d",
      secondaryHover: "#5a6268",
      secondaryActive: "#495057",
      danger: "#dc3545",
      dangerHover: "#c82333",
      dangerActive: "#bd2130",
      success: "#28a745",
      successHover: "#218838",
      successActive: "#1e7e34",
      disabled: "#e9ecef",
    },
    status: {
      error: {
        background: "#f8d7da",
        border: "#f5c6cb",
        text: "#721c24",
      },
      success: {
        background: "#d4edda",
        border: "#c3e6cb",
        text: "#155724",
      },
      warning: {
        background: "#fff3cd",
        border: "#ffeaa7",
        text: "#856404",
      },
      info: {
        background: "#d1ecf1",
        border: "#bee5eb",
        text: "#0c5460",
      },
    },
  },
  dark: {
    background: {
      primary: "#1a1a1a",
      secondary: "#2d2d2d",
      tertiary: "#3d3d3d",
      inverse: "#ffffff",
    },
    surface: {
      primary: "#2d2d2d",
      secondary: "#3d3d3d",
      elevated: "#4d4d4d",
      overlay: "rgba(0, 0, 0, 0.7)",
    },
    border: {
      default: "#404040",
      muted: "#3d3d3d",
      strong: "#525252",
      focus: "#4da6ff",
    },
    text: {
      primary: "#ffffff",
      secondary: "#d1d1d1",
      tertiary: "#a8a8a8",
      inverse: "#1a1a1a",
      disabled: "#6c757d",
      error: "#ff6b6b",
      success: "#51cf66",
      warning: "#ffd43b",
      info: "#74c0fc",
    },
    interactive: {
      primary: "#4da6ff",
      primaryHover: "#3399ff",
      primaryActive: "#1a8cff",
      secondary: "#a8a8a8",
      secondaryHover: "#8f8f8f",
      secondaryActive: "#767676",
      danger: "#ff6b6b",
      dangerHover: "#ff5252",
      dangerActive: "#ff3838",
      success: "#51cf66",
      successHover: "#40c057",
      successActive: "#37b24d",
      disabled: "#404040",
    },
    status: {
      error: {
        background: "#3d1f1f",
        border: "#4d2525",
        text: "#ff6b6b",
      },
      success: {
        background: "#1f3d1f",
        border: "#254d25",
        text: "#51cf66",
      },
      warning: {
        background: "#3d3d1f",
        border: "#4d4d25",
        text: "#ffd43b",
      },
      info: {
        background: "#1f2d3d",
        border: "#253d4d",
        text: "#74c0fc",
      },
    },
  },
} as const;

export type ColorTheme = keyof typeof colorTokens;

export type ColorTokenPath = {
  [K in ColorTheme]: {
    [Category in keyof (typeof colorTokens)[K]]: {
      [Token in keyof (typeof colorTokens)[K][Category]]: string;
    };
  };
};
