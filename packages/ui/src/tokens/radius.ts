export const radiusTokens = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.5rem",
  "3xl": "2rem",
  full: "9999px",
} as const;

export const radiusSemantic = {
  button: radiusTokens.md,
  card: radiusTokens.lg,
  modal: radiusTokens.xl,
  input: radiusTokens.md,
  badge: radiusTokens.full,
  tooltip: radiusTokens.md,
} as const;

export type RadiusToken = keyof typeof radiusTokens;
export type RadiusSemantic = keyof typeof radiusSemantic;
