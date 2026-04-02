export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterCreatedData {
  user_id: string;
  email: string;
}

export interface RegisterResponse {
  message: string;
  data: RegisterCreatedData;
}

export interface TenantSlugData {
  tenant_slug: string | null;
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

export interface CreateStaffUserRequest {
  email: string;
  access_level: "kitchen" | "waiter";
  name?: string;
  surname?: string;
}

export interface BulkCreateStaffUserRequest {
  users: CreateStaffUserRequest[];
}

export interface BulkCreateStaffUserResult {
  email: string;
  status: "created" | "failed";
  error?: string;
  data?: {
    user_id: string;
    tenant_id: string;
    tenant_name: string;
    tenant_slug: string;
  };
}

export interface BulkCreateStaffUserResponse {
  message: string;
  results: BulkCreateStaffUserResult[];
}

export interface StaffUserData {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  is_active: boolean;
  account_type: "kitchen" | "waiter";
}

export interface DeleteUserData {
  deleted_user_id: string;
}

export interface AuthMeData {
  authenticated: boolean;
}

export interface LoginResponse {
  message: string;
  data: Record<string, never>;
}

export interface RefreshResponse {
  message: string;
  data: { refreshed: string };
}
