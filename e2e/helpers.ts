import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

export const DEMO_EMAIL = "demo@bamiri.share";
export const DEMO_PASSWORD = "Demo1234";

function loadEnvLocal(): Record<string, string> {
  const merged = { ...process.env } as Record<string, string>;
  const path = resolve(ROOT, ".env.local");
  if (!existsSync(path)) return merged;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    merged[trimmed.slice(0, i)] = trimmed.slice(i + 1);
  }
  return merged;
}

export function isDemoLoginE2eEnabled(): boolean {
  if (process.env.E2E_DEMO_LOGIN !== "1") return false;
  const env = loadEnvLocal();
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  return Boolean(anon && !anon.includes("placeholder"));
}

export function restoreDemoWorkspace(): void {
  execSync("node scripts/seed-demo-workspace.mjs", {
    cwd: ROOT,
    stdio: "inherit",
  });
}
