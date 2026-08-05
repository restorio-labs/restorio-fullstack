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

export type StaffInviteNotification = "activation" | "existing_waiter_notice" | "existing_account_linked";

export interface CreateStaffUserData {
  user_id: string;
  email: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  notification: StaffInviteNotification;
}

export interface CreateStaffUserResponse {
  message: string;
  data: CreateStaffUserData;
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

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  reset_token_id: string;
  password: string;
}

export type EmptyAuthActionData = Record<string, never>;

export interface ForgotPasswordResponse {
  message: string;
  data: EmptyAuthActionData;
}

export interface ResetPasswordResponse {
  message: string;
  data: EmptyAuthActionData;
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
  notification?: StaffInviteNotification;
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

export const AuthorizationActions = {
  APP_ADMIN_ACCESS: "app.admin.access",
  APP_WAITER_ACCESS: "app.waiter.access",
  APP_KITCHEN_ACCESS: "app.kitchen.access",
  TENANT_VIEW: "tenant.view",
  TENANT_UPDATE: "tenant.update",
  TENANT_DELETE: "tenant.delete",
  TENANT_LIST: "tenant.list",
  TENANT_CREATE: "tenant.create",
  PROFILE_VIEW: "profile.view",
  PROFILE_UPDATE: "profile.update",
  PROFILE_LOGO_READ: "profile.logo.read",
  PROFILE_LOGO_WRITE: "profile.logo.write",
  MOBILE_CONFIG_READ: "mobile_config.read",
  MOBILE_CONFIG_WRITE: "mobile_config.write",
  MENU_READ: "menu.read",
  MENU_WRITE: "menu.write",
  MENU_AVAILABILITY_UPDATE: "menu.availability.update",
  MENU_ASSET_WRITE: "menu.asset.write",
  FLOOR_CANVAS_READ: "floor_canvas.read",
  FLOOR_CANVAS_WRITE: "floor_canvas.write",
  FLOOR_CANVAS_VERSION_READ: "floor_canvas.version.read",
  ORDER_READ: "order.read",
  ORDER_CREATE: "order.create",
  ORDER_UPDATE: "order.update",
  ORDER_TRANSITION: "order.transition",
  ORDER_DELETE: "order.delete",
  ORDER_ARCHIVE: "order.archive",
  ORDER_REFUND: "order.refund",
  TABLE_SESSION_READ: "table_session.read",
  TABLE_SESSION_UNLOCK: "table_session.unlock",
  PAYMENT_CREATE: "payment.create",
  KITCHEN_CONFIG_READ: "kitchen_config.read",
  KITCHEN_CONFIG_WRITE: "kitchen_config.write",
  PAYMENT_CONFIG_READ: "payment.config.read",
  PAYMENT_CONFIG_WRITE: "payment.config.write",
  PAYMENT_VERIFY: "payment.verify",
  PAYMENT_TRANSACTION_READ: "payment.transaction.read",
  PAYMENT_RECONCILE: "payment.reconcile",
  STAFF_READ: "staff.read",
  STAFF_CREATE: "staff.create",
  STAFF_DELETE: "staff.delete",
  ACCESS_GROUP_READ: "access_group.read",
  ACCESS_GROUP_WRITE: "access_group.write",
  ACCESS_GROUP_ASSIGN: "access_group.assign",
} as const;

export type AuthorizationAction = (typeof AuthorizationActions)[keyof typeof AuthorizationActions];

export interface TenantCapabilitiesData {
  tenant_id: string;
  policy_version: string;
  capabilities: AuthorizationAction[];
}

export interface LoginResponse {
  message: string;
  data: Record<string, never>;
}

export interface RefreshResponse {
  message: string;
  data: { refreshed: string };
}
