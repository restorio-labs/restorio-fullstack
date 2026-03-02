/* eslint-disable @typescript-eslint/unbound-method */
import axios, { type AxiosResponse, type AxiosError, type AxiosRequestConfig } from "axios";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { ApiClient } from "../../src/client";
import { setupAxiosMock, type AxiosTestContext } from "../helpers/axiosTestInstance";

vi.mock("axios");

describe("Api Client", () => {
  let ctx: AxiosTestContext;

  beforeEach(() => {
    vi.clearAllMocks();

    ctx = setupAxiosMock();

    vi.mocked(axios.create).mockReturnValue(ctx.instance);
  });

  it("creates axios client with baseURL and JSON headers", () => {
    new ApiClient({ baseURL: "http://localhost:8000" });

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: "http://localhost:8000",
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });
  });

  it("adds Authorization header when access token exists", () => {
    new ApiClient({
      baseURL: "x",
      getAccessToken: (): string | null => "token",
    });

    const config = { headers: {} } as AxiosRequestConfig;

    const result = ctx.requestInterceptor?.(config) ?? config;

    expect(result.headers?.Authorization).toBe("Bearer token");
  });

  it("does not override existing Authorization header", () => {
    new ApiClient({
      baseURL: "x",
      getAccessToken: (): string | null => "token",
    });

    const config = {
      headers: { Authorization: "Bearer existing" },
    } as AxiosRequestConfig;

    const result = ctx.requestInterceptor?.(config) ?? config;

    expect(result.headers?.Authorization).toBe("Bearer existing");
  });

  it("calls onUnauthorized on 401 response", async () => {
    const onUnauthorized = vi.fn();

    new ApiClient({
      baseURL: "x",
      onUnauthorized,
    });

    const error = { response: { status: 401 } };

    await expect(ctx.responseError!(error as AxiosError)).rejects.toBe(error);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("does not call onUnauthorized for non-401 response", async () => {
    const onUnauthorized = vi.fn();

    new ApiClient({
      baseURL: "x",
      onUnauthorized,
    });

    const error = { response: { status: 403 } };

    await expect(ctx.responseError!(error as AxiosError)).rejects.toBe(error);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("get returns response.data", async () => {
    vi.mocked(ctx.instance.get).mockResolvedValue({ data: { ok: true } });

    const client = new ApiClient({ baseURL: "x" });
    const result = await client.get("/test");

    expect(result).toEqual({ ok: true });

    expect(ctx.instance.get).toHaveBeenCalledWith("/test", undefined);
  });

  it("post returns response.data", async () => {
    vi.mocked(ctx.instance.post).mockResolvedValue({ data: { id: 1 } });

    const client = new ApiClient({ baseURL: "x" });
    const result = await client.post("/test", { a: 1 });

    expect(result).toEqual({ id: 1 });
  });

  it("put returns response.data", async () => {
    vi.mocked(ctx.instance.put).mockResolvedValue({ data: { updated: true } });

    const client = new ApiClient({ baseURL: "x" });
    const result = await client.put("/test", {});

    expect(result).toEqual({ updated: true });
  });

  it("patch returns response.data", async () => {
    vi.mocked(ctx.instance.patch).mockResolvedValue({ data: { patched: true } });

    const client = new ApiClient({ baseURL: "x" });
    const result = await client.patch("/test", {});

    expect(result).toEqual({ patched: true });
  });

  it("delete returns response.data", async () => {
    vi.mocked(ctx.instance.delete).mockResolvedValue({ data: undefined });

    const client = new ApiClient({ baseURL: "x" });
    const result = await client.delete("/test");

    expect(result).toBeUndefined();
  });

  it("passes through successful response in interceptor", () => {
    new ApiClient({ baseURL: "x" });

    const mockResponse = {
      data: "success",
      status: 200,
      headers: {},
      config: {},
    };

    const result = ctx.responseSuccess?.(mockResponse as unknown as AxiosResponse);

    expect(result).toBe(mockResponse);
  });

  it("on 401 with refreshPath set and non-refresh request, calls refresh then retries request", async () => {
    const onUnauthorized = vi.fn();

    vi.mocked(ctx.instance.post).mockResolvedValueOnce({ data: {} });
    vi.mocked(ctx.instance.request).mockResolvedValueOnce({ data: { ok: true } });

    new ApiClient({
      baseURL: "x",
      refreshPath: "auth/refresh",
      onUnauthorized,
    });

    const error = {
      response: { status: 401 },
      config: { url: "items", method: "get" },
    };

    const result = await ctx.responseError!(error as AxiosError);

    expect(onUnauthorized).not.toHaveBeenCalled();
    expect(ctx.instance.post).toHaveBeenCalledWith("auth/refresh", undefined, { withCredentials: true });
    expect(ctx.instance.request).toHaveBeenCalledWith(expect.objectContaining({ _retry: true, url: "items" }));
    expect(result).toEqual({ data: { ok: true } });
  });

  it("on 401 with refreshPath when refresh fails calls onUnauthorized", async () => {
    const onUnauthorized = vi.fn();

    vi.mocked(ctx.instance.post).mockRejectedValueOnce(new Error("refresh failed"));

    new ApiClient({
      baseURL: "x",
      refreshPath: "auth/refresh",
      onUnauthorized,
    });

    const error = {
      response: { status: 401 },
      config: { url: "items" },
    };

    await expect(ctx.responseError!(error as AxiosError)).rejects.toBe(error);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("on 401 for refresh path url calls onUnauthorized without retry", async () => {
    const onUnauthorized = vi.fn();

    new ApiClient({
      baseURL: "x",
      refreshPath: "auth/refresh",
      onUnauthorized,
    });

    const error = {
      response: { status: 401 },
      config: { url: "auth/refresh" },
    };

    await expect(ctx.responseError!(error as AxiosError)).rejects.toBe(error);
    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(ctx.instance.post).not.toHaveBeenCalled();
  });

  it("on 401 without refreshPath calls onUnauthorized", async () => {
    const onUnauthorized = vi.fn();

    new ApiClient({
      baseURL: "x",
      onUnauthorized,
    });

    const error = {
      response: { status: 401 },
      config: { url: "items" },
    };

    await expect(ctx.responseError!(error as AxiosError)).rejects.toBe(error);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});
