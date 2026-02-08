import { API_BASE_URL } from "@/lib/env";

export interface RegisterPayload {
  email: string;
  password: string;
  restaurantName: string;
}

export interface RegisterResult {
  ok: boolean;
  message: string;
  status?: number;
}

export const registerAccount = async ({
  email,
  password,
  restaurantName,
}: RegisterPayload): Promise<RegisterResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        restaurantName,
      }),
    });

    if (response.ok) {
      return {
        ok: true,
        message: "Account has been created, you should receive activation email shortly.",
      };
    }

    let apiMessage = "Unable to create account. Please try again.";
    try {
      const data = (await response.json()) as { message?: string; detail?: string };
      if (typeof data?.detail === "string" && data.detail.trim().length > 0) {
        apiMessage = data.detail;
      } else if (typeof data?.message === "string" && data.message.trim().length > 0) {
        apiMessage = data.message;
      }
    } catch {
    }

    return {
      ok: false,
      message: apiMessage,
      status: response.status,
    };
  } catch {
    return {
      ok: false,
      message: "Unable to create account. Please try again.",
    };
  }
};
