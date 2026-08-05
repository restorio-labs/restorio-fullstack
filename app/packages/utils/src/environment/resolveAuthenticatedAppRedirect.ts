import { APP_SLUGS, type AppSlug } from "@restorio/types";

const APP_REQUIRED_CAPABILITY: Partial<Record<AppSlug, string>> = {
  "admin-panel": "app.admin.access",
  "waiter-panel": "app.waiter.access",
  "kitchen-panel": "app.kitchen.access",
};

const isAppSlug = (value: string): value is AppSlug => {
  return (APP_SLUGS as readonly string[]).includes(value);
};

export const canAccessApp = (capabilities: Iterable<string>, appSlug: AppSlug): boolean => {
  const required = APP_REQUIRED_CAPABILITY[appSlug];

  return required !== undefined && new Set(capabilities).has(required);
};

export const resolveDefaultAppForCapabilities = (capabilities: Iterable<string>): AppSlug => {
  const granted = new Set(capabilities);

  if (canAccessApp(granted, "admin-panel")) {
    return "admin-panel";
  }

  if (canAccessApp(granted, "waiter-panel")) {
    return "waiter-panel";
  }

  if (canAccessApp(granted, "kitchen-panel")) {
    return "kitchen-panel";
  }

  return "admin-panel";
};

export const resolveAuthenticatedAppRedirect = (
  capabilities: Iterable<string>,
  lastVisitedApp?: string | null,
): AppSlug => {
  const granted = new Set(capabilities);

  if (
    typeof lastVisitedApp === "string" &&
    isAppSlug(lastVisitedApp) &&
    lastVisitedApp !== "public-web" &&
    canAccessApp(granted, lastVisitedApp)
  ) {
    return lastVisitedApp;
  }

  return resolveDefaultAppForCapabilities(granted);
};
