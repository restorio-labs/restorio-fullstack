import type { AuthorizationAction } from "@restorio/types";

export const hasCapability = (capabilities: Iterable<string>, capability: AuthorizationAction): boolean => {
  return new Set(capabilities).has(capability);
};

export const hasAnyCapability = (capabilities: Iterable<string>, required: readonly AuthorizationAction[]): boolean => {
  const granted = new Set(capabilities);

  return required.some((capability) => granted.has(capability));
};

export const hasAllCapabilities = (
  capabilities: Iterable<string>,
  required: readonly AuthorizationAction[],
): boolean => {
  const granted = new Set(capabilities);

  return required.every((capability) => granted.has(capability));
};
