import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("login page shows sign-in form", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/bamiri/i);
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in|ログイン/i })).toBeVisible();
  });

  test("unauthenticated home redirects to login", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/login**");
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
  });

  test("music-metadata API returns validation error without url", async ({
    request,
  }) => {
    const res = await request.get("/api/music-metadata");
    expect(res.status()).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "missing_url" });
  });
});
