export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  trialEndsAt?: Date;
}

export interface TenantSettings {
  tenantId: string;
  currency: string;
  timezone: string;
  language: string;
  theme?: Record<string, string>;
}

