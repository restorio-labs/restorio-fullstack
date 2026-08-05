import type { ReactElement } from "react";

const migrationMessage = "RoleGuard was removed; use CapabilityGuard with an explicit action";

export const RoleGuard = (): ReactElement => {
  throw new Error(migrationMessage);
};

export const useCurrentRole = (): never => {
  throw new Error(migrationMessage);
};
