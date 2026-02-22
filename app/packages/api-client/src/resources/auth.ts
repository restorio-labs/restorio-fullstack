import type { User, AuthTokens } from "@restorio/types";

import { BaseResource } from "./base";

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

export class AuthResource extends BaseResource {
  /**
   * Authenticate a user with email and password.
   * @returns Access and refresh tokens
   */
  login(email: string, password: string, signal?: AbortSignal): Promise<AuthTokens> {
    return this.client.post("/auth/login", { email, password }, { signal });
  }

  /**
   * Register a new user and tenant.
   * @returns Created user and tenant data
   */
  register(data: RegisterRequest, signal?: AbortSignal): Promise<RegisterResponse> {
    return this.client.post("/auth/register", data, { signal });
  }
  /**
   * Refresh an expired access token.
   * When HttpOnly cookies are enabled, refresh token is read server-side from cookie.
   * @returns New access and refresh tokens
   */
  refresh(refreshToken?: string, signal?: AbortSignal): Promise<AuthTokens> {
    const body = refreshToken ? { refreshToken } : undefined;

    return this.client.post("/auth/refresh", body, { signal });
  }

  /**
   * Get the currently authenticated user.
   * @returns User profile information
   */
  me(signal?: AbortSignal): Promise<User> {
    return this.client.get("/auth/me", { signal });
  }
}
