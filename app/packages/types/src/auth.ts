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
  requires_password_change?: boolean;
}

export interface TenantSlugResponse {
  message: string;
  data: TenantSlugData;
}

export interface SetActivationPasswordRequest {
  activation_id: string;
  password: string;
}

export interface AuthMeData {
  id: string;
  tenantId: string;
  accountType: string;
}

export interface LoginResponse {
  message: string;
  data: { at: string };
}

export interface RefreshResponse {
  message: string;
  data: { refreshed: string };
}
