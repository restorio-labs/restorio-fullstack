import axios, { type AxiosInstance } from "axios";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { ApiClient } from "../../src/client";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

describe("ApiClient", () => {
  beforeEach(() => {
    const mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    } as unknown as AxiosInstance;

    vi.mocked(mockedAxios.create).mockReturnValue(mockAxiosInstance);

    new ApiClient({
      baseURL: "http://localhost:8000",
    });
  });

  it("should create client with baseURL", () => {
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: "http://localhost:8000",
      headers: {
        "Content-Type": "application/json",
      },
    });
  });
});

