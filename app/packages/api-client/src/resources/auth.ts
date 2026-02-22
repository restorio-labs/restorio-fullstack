import type {
  AuthMeData,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
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
    return this.client.post("/auth/login", { email, password }, { signal });
  }

  /**
   * Register a new user and tenant.
   */
  register(data: RegisterRequest, signal?: AbortSignal): Promise<RegisterResponse> {
    return this.client.post("/auth/register", data, { signal });
  }

  /**
   * Activate an account using the activation link id.
   */
  activate(activationId: string, signal?: AbortSignal): Promise<TenantSlugResponse> {
    const url = `/auth/activate?activation_id=${encodeURIComponent(activationId)}`;

    return this.client.post(url, undefined, { signal });
  }

  /**
   * Resend activation email for the given activation link id.
   */
  resendActivation(activationId: string, signal?: AbortSignal): Promise<TenantSlugResponse> {
    const url = `/auth/resend-activation?activation_id=${encodeURIComponent(activationId)}`;

    return this.client.post(url, undefined, { signal });
  }

  /**
   * Refresh access token. New tokens are set in HTTP-only cookies.
   * @returns Success body; tokens are in cookies
   */
  refresh(refreshToken?: string, signal?: AbortSignal): Promise<RefreshResponse> {
    const body = refreshToken ? { refreshToken } : undefined;

    return this.client.post("/auth/refresh", body, { signal });
  }

  /**
   * Get current session (id and tenantId from JWT). Not a full user profile.
   */
  async me(signal?: AbortSignal): Promise<AuthMeData> {
    const { data } = await this.client.get<SuccessResponse<{ sub: string; tenant_id: string }>>("/auth/me", {
      signal,
    });

    return { id: data.sub, tenantId: data.tenant_id ?? "" };
  }
}
