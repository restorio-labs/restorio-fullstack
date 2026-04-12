export interface TenantMobileConfig {
  pageTitle: string | null;
  themeOverride: Record<string, unknown> | null;
  hasFavicon: boolean;
}

export interface UpdateTenantMobileConfigPayload {
  pageTitle?: string | null;
  themeOverride?: Record<string, unknown> | null;
}
