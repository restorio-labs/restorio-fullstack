import type { UserRole } from "./user";

export interface RegisterRequest {
  email: string;
  password: string;
  restaurant_name: string;
}

export interface RegisterCreatedData {
  user_id: string;
  email: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
}

export interface RegisterResponse {
  message: string;
  data: RegisterCreatedData;
}

export interface TenantSlugData {
  tenant_slug: string;
}

export interface TenantSlugResponse {
  message: string;
  data: TenantSlugData;
}

export interface AuthMeData {
  id: string;
  tenantId: string;
  role: UserRole;
}

export interface LoginResponse {
  message: string;
  data: { at: string };
}

export interface RefreshResponse {
  message: string;
  data: { refreshed: string };
}
