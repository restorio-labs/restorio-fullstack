import { getAppBaseUrl } from "@restorio/utils";

export const buildInvalidKitchenTenantRedirectUrl = (): string => {
  return getAppBaseUrl("kitchen-panel");
};
