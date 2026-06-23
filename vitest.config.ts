import path from "node:path";
import { defineConfig } from "vitest/config";

/** 純粋ロジック（src/lib）の UT とカバレッジ閾値（評価用 70% 目安） */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/apiErrors.ts",
        "src/lib/passwordPolicy.ts",
        "src/lib/subscription.ts",
        "src/lib/projectOrganize.ts",
        "src/lib/shareUtils.ts",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
