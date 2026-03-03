import type {
  CreateStaffUserRequest,
  DeleteUserData,
  RegisterResponse,
  StaffUserData,
  SuccessResponse,
} from "@restorio/types";

import { BaseResource } from "./base";

export class UserResource extends BaseResource {
  /**
   * Create staff user (kitchen/waiter).
   */
  create(data: CreateStaffUserRequest, signal?: AbortSignal): Promise<RegisterResponse> {
    return this.client.post("create/create", data, { signal });
  }

  /**
   * List current tenant staff users.
   */
  async list(signal?: AbortSignal): Promise<StaffUserData[]> {
    const { data } = await this.client.get<SuccessResponse<StaffUserData[]>>("create/users", { signal });

    return data;
  }

  /**
   * Delete staff user by id.
   */
  async delete(userId: string, signal?: AbortSignal): Promise<DeleteUserData> {
    const { data } = await this.client.delete<SuccessResponse<DeleteUserData>>(
      `create/delete-user/${encodeURIComponent(userId)}`,
      {
        signal,
      },
    );

    return data;
  }
}
