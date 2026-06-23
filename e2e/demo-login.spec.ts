import { expect, test } from "@playwright/test";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  isDemoLoginE2eEnabled,
  restoreDemoWorkspace,
} from "./helpers";

/**
 * デモアカウントでログイン → エディタ表示を確認。
 * 実行後は必ず `demo:workspace` 相当でワークスペースを復元する。
 *
 * ローカル: E2E_DEMO_LOGIN=1 npm run test:e2e
 * CI（プレースホルダ鍵）ではスキップ。
 */
test.describe("demo login", () => {
  test.describe.configure({ mode: "serial" });

  test.afterEach(() => {
    if (!isDemoLoginE2eEnabled()) return;
    restoreDemoWorkspace();
  });

  test("demo account opens editor", async ({ page }) => {
    test.skip(
      !isDemoLoginE2eEnabled(),
      "Set E2E_DEMO_LOGIN=1 with real Supabase in .env.local",
    );

    await page.goto("/login");
    await page.getByRole("textbox", { name: /email/i }).fill(DEMO_EMAIL);
    await page.locator('input[type="password"]').first().fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 30_000,
    });
    await expect(page.getByRole("textbox", { name: /song|曲名/i })).toBeVisible({
      timeout: 30_000,
    });
  });
});
