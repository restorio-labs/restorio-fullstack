import type {
  AuthMeData,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
  SetActivationPasswordRequest,
  SuccessResponse,
  TenantSlugResponse,
} from "@restorio/types";

import { BaseResource } from "./base";

export class AuthResource extends BaseResource {
  /**
   * Authenticate with email and password. Tokens are set in HTTP-only cookies.
   * @returns Success body; tokens are in cookies
   */
  login(email: string, password: string, signal?: AbortSignal): Promise<LoginResponse> {
    return this.client.post("auth/login", { email, password }, { signal });
  }

  /**
   * Register a new user and tenant.
   */
  register(data: RegisterRequest, signal?: AbortSignal): Promise<RegisterResponse> {
    return this.client.post("auth/register", data, { signal });
  }

  /**
   * Activate an account using the activation link id.
   */
  activate(activationId: string, signal?: AbortSignal): Promise<TenantSlugResponse> {
    const url = `auth/activate?activation_id=${encodeURIComponent(activationId)}`;

    return this.client.post(url, undefined, { signal });
  }

  /**
   * Set activation password and complete account activation.
   */
  setActivationPassword(data: SetActivationPasswordRequest, signal?: AbortSignal): Promise<TenantSlugResponse> {
    return this.client.post("auth/set-password", data, { signal });
  }

  /**
   * Resend activation email for the given activation link id.
   */
  resendActivation(activationId: string, signal?: AbortSignal): Promise<TenantSlugResponse> {
    const url = `auth/resend-activation?activation_id=${encodeURIComponent(activationId)}`;

    return this.client.post(url, undefined, { signal });
  }

  /**
   * Refresh access token. New tokens are set in HTTP-only cookies.
   * API reads refresh token from cookie only (no body).
   * @returns Success body; tokens are in cookies
   */
  refresh(signal?: AbortSignal): Promise<RefreshResponse> {
    return this.client.post("auth/refresh", undefined, { signal });
  }

  /**
   * Get current session (id and tenantId from JWT). Not a full user profile.
   * Pass accessToken when calling immediately after login so the request is authenticated
   * without relying on cookies (e.g. cross-origin).
   */
  async me(signal?: AbortSignal, accessToken?: string | null): Promise<AuthMeData> {
    const headers = accessToken != null && accessToken !== "" ? { Authorization: `Bearer ${accessToken}` } : undefined;

    const { data } = await this.client.get<SuccessResponse<{ sub: string; tenant_id: string; account_type: string }>>(
      "auth/me",
      { signal, withCredentials: true, ...(headers ? { headers } : {}) },
    );

    return { id: data.sub, tenantId: data.tenant_id, accountType: data.account_type };
  }
}
