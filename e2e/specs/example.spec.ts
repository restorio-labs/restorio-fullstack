import { test, expect } from "@playwright/test";

test.describe("Restorio Platform E2E Tests", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Restorio/i);
  });

  test("API health check", async ({ request }) => {
    const response = await request.get("http://localhost:8000/health");
    expect(response.ok()).toBeTruthy();
    expect(await response.json()).toMatchObject({ status: "healthy" });
  });
});
