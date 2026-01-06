/* eslint-disable @typescript-eslint/unbound-method */
import type { Table } from "@restorio/types";
import { describe, it, expect, vi, beforeEach } from "vitest";

import type { ApiClient } from "../../src/client";
import { RestorioApi } from "../../src/endpoints";

type ApiClientMock = Pick<ApiClient, "get" | "post" | "put" | "patch" | "delete">;

describe("Endpoints", () => {
  let client: ApiClientMock;
  let api: RestorioApi;

  beforeEach(() => {
    vi.clearAllMocks();

    client = {
      get: vi.fn().mockResolvedValue(undefined),
      post: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      patch: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    api = new RestorioApi(client as ApiClient);
  });

  describe("Auth", () => {
    it("login calls POST /auth/login", async () => {
      await api.auth.login("a@b.com", "pass");
      expect(client.post).toHaveBeenCalledWith("/auth/login", {
        email: "a@b.com",
        password: "pass",
      });
    });

    it("register calls POST /auth/register", async () => {
      const data = {
        email: "new@user.com",
        password: "password",
        firstName: "John",
        lastName: "Doe",
      };

      await api.auth.register(data);
      expect(client.post).toHaveBeenCalledWith("/auth/register", data);
    });

    it("refresh calls POST /auth/refresh", async () => {
      await api.auth.refresh("some-refresh-token");
      expect(client.post).toHaveBeenCalledWith("/auth/refresh", {
        refreshToken: "some-refresh-token",
      });
    });

    it("me calls GET /auth/me", async () => {
      await api.auth.me();
      expect(client.get).toHaveBeenCalledWith("/auth/me");
    });
  });

  describe("Restaurants", () => {
    it("list calls GET /restaurants", async () => {
      await api.restaurants.list();
      expect(client.get).toHaveBeenCalledWith("/restaurants");
    });

    it("get calls GET /restaurants/:id", async () => {
      await api.restaurants.get("123");
      expect(client.get).toHaveBeenCalledWith("/restaurants/123");
    });

    it("create calls POST /restaurants", async () => {
      const payload = { name: "New Resto" };

      await api.restaurants.create(payload);
      expect(client.post).toHaveBeenCalledWith("/restaurants", payload);
    });

    it("update calls PUT /restaurants/:id", async () => {
      const payload = { name: "Updated Name" };

      await api.restaurants.update("123", payload);
      expect(client.put).toHaveBeenCalledWith("/restaurants/123", payload);
    });

    it("delete calls DELETE /restaurants/:id", async () => {
      await api.restaurants.delete("123");
      expect(client.delete).toHaveBeenCalledWith("/restaurants/123");
    });
  });

  describe("Menus", () => {
    it("list calls GET /restaurants/:id/menus", async () => {
      await api.menus.list("r1");
      expect(client.get).toHaveBeenCalledWith("/restaurants/r1/menus");
    });

    it("get calls GET /restaurants/:id/menus/:menuId", async () => {
      await api.menus.get("r1", "m1");
      expect(client.get).toHaveBeenCalledWith("/restaurants/r1/menus/m1");
    });

    it("create calls POST /restaurants/:id/menus", async () => {
      const payload = { name: "Lunch Menu" };

      await api.menus.create("r1", payload);
      expect(client.post).toHaveBeenCalledWith("/restaurants/r1/menus", payload);
    });

    it("update calls PUT /restaurants/:id/menus/:menuId", async () => {
      const payload = { name: "Updated Menu" };

      await api.menus.update("r1", "m1", payload);
      expect(client.put).toHaveBeenCalledWith("/restaurants/r1/menus/m1", payload);
    });

    it("delete calls DELETE /restaurants/:id/menus/:menuId", async () => {
      await api.menus.delete("r1", "m1");
      expect(client.delete).toHaveBeenCalledWith("/restaurants/r1/menus/m1");
    });
  });

  describe("Orders", () => {
    it("list calls GET /restaurants/:id/orders", async () => {
      await api.orders.list("r1");
      expect(client.get).toHaveBeenCalledWith("/restaurants/r1/orders");
    });

    it("get calls GET /restaurants/:id/orders/:orderId", async () => {
      await api.orders.get("r1", "o1");
      expect(client.get).toHaveBeenCalledWith("/restaurants/r1/orders/o1");
    });

    it("create calls POST /restaurants/:id/orders", async () => {
      const payload = { total: 100 };

      await api.orders.create("r1", payload);
      expect(client.post).toHaveBeenCalledWith("/restaurants/r1/orders", payload);
    });

    it("updateStatus calls PATCH /restaurants/:id/orders/:id/status", async () => {
      await api.orders.updateStatus("r1", "o1", "DONE");
      expect(client.patch).toHaveBeenCalledWith("/restaurants/r1/orders/o1/status", { status: "DONE" });
    });
  });

  describe("Tables", () => {
    const payload: Partial<Table> = { number: "5", capacity: 5 };

    it("list calls GET /restaurants/:id/tables", async () => {
      await api.tables.list("r1");
      expect(client.get).toHaveBeenCalledWith("/restaurants/r1/tables");
    });

    it("create calls POST /restaurants/:id/tables", async () => {
      await api.tables.create("r1", payload);
      expect(client.post).toHaveBeenCalledWith("/restaurants/r1/tables", payload);
    });

    it("update calls PUT /restaurants/:id/tables/:tableId", async () => {
      await api.tables.update("r1", "t1", payload);
      expect(client.put).toHaveBeenCalledWith("/restaurants/r1/tables/t1", payload);
    });

    it("delete calls DELETE /restaurants/:id/tables/:id", async () => {
      await api.tables.delete("r1", "t1");
      expect(client.delete).toHaveBeenCalledWith("/restaurants/r1/tables/t1");
    });
  });
});
