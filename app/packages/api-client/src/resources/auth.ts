import type { User, AuthTokens } from "@restorio/types";

import { BaseResource } from "./base";

export class AuthResource extends BaseResource {
  /**
   * Authenticate a user with email and password.
   * @returns Access and refresh tokens
   */
  login(email: string, password: string, signal?: AbortSignal): Promise<AuthTokens> {
    return this.client.post("/auth/login", { email, password }, { signal });
  }

  /**
   * Register a new user account.
   * @returns Access and refresh tokens for the new user
   */
  register(
    data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    },
    signal?: AbortSignal,
  ): Promise<AuthTokens> {
    return this.client.post("/auth/register", data, { signal });
  }
  /**
   * Refresh an expired access token.
   * @param refreshToken - The refresh token
   * @returns New access and refresh tokens
   */
  refresh(refreshToken: string, signal?: AbortSignal): Promise<AuthTokens> {
    return this.client.post("/auth/refresh", { refreshToken }, { signal });
  }

  /**
   * Get the currently authenticated user.
   * @returns User profile information
   */
  me(signal?: AbortSignal): Promise<User> {
    return this.client.get("/auth/me", { signal });
  }
}
