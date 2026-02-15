import { ApiClient, RestorioApi, type RegisterPayload } from "@restorio/api-client";

import { API_BASE_URL } from "@/lib/env";

export interface RegisterResult {
  ok: boolean;
  message: string;
  status?: number;
}

const api = new RestorioApi(
  new ApiClient({
    baseURL: API_BASE_URL,
  }),
);

const fallbackMessage = "Unable to create account. Please try again.";

const parseError = (error: unknown): { message: string; status?: number } => {
  if (!error || typeof error !== "object") {
    return { message: fallbackMessage };
  }

  const response = "response" in error ? error.response : undefined;

  if (!response || typeof response !== "object") {
    return { message: fallbackMessage };
  }

  const status = "status" in response && typeof response.status === "number" ? response.status : undefined;
  const data = "data" in response ? response.data : undefined;

  if (data && typeof data === "object") {
    if ("detail" in data && typeof data.detail === "string" && data.detail.trim().length > 0) {
      return { message: data.detail, status };
    }

    if ("message" in data && typeof data.message === "string" && data.message.trim().length > 0) {
      return { message: data.message, status };
    }
  }

  return { message: fallbackMessage, status };
};

export const registerAccount = async (data: RegisterPayload): Promise<RegisterResult> => {
  try {
    const response = await api.auth.register(data);

    return {
      ok: true,
      message: response.message || "Account has been created, you should receive activation email shortly.",
    };
  } catch (error: unknown) {
    const parsedError = parseError(error);

    return {
      ok: false,
      message: parsedError.message,
      status: parsedError.status,
    };
  }
};
