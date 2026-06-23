#!/usr/bin/env node
/**
 * README 用のスクリーンショット・デモ GIF を本番 URL から取得する。
 * デモログイン後はワークスペースを seed スクリプト相当の内容に戻す（.env.local がある場合）。
 *
 *   npm run docs:capture
 *   CAPTURE_BASE_URL=http://127.0.0.1:3000 npm run docs:capture
 */
import { execSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
import ffmpegPath from "ffmpeg-static";

const ROOT = process.cwd();
const OUT_DIR = resolve(ROOT, "docs/images");
const BASE = (process.env.CAPTURE_BASE_URL ?? "https://choreo-ten.vercel.app").replace(
  /\/$/,
  "",
);
const DEMO_EMAIL = "demo@bamiri.share";
const DEMO_PASSWORD = "Demo1234";

function restoreDemoWorkspaceIfPossible() {
  const envPath = resolve(ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  try {
    execSync("node scripts/seed-demo-workspace.mjs", { cwd: ROOT, stdio: "inherit" });
  } catch {
    console.warn("[docs:capture] demo workspace restore skipped (seed failed)");
  }
}

function webmToGif(webmPath, gifPath) {
  const ffmpeg = ffmpegPath ?? "ffmpeg";
  const result = spawnSync(
    ffmpeg,
    [
      "-y",
      "-i",
      webmPath,
      "-vf",
      "fps=10,scale=640:-1:flags=lanczos",
      "-loop",
      "0",
      gifPath,
    ],
    { stdio: "pipe" },
  );
  if (result.status !== 0) {
    console.warn("[docs:capture] ffmpeg not available — GIF skipped");
    return false;
  }
  return true;
}

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
let editorCaptured = false;

try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: resolve(OUT_DIR, "screenshot-login.png"),
    fullPage: false,
  });
  console.log("Wrote docs/images/screenshot-login.png");

  await page.getByRole("textbox", { name: /email/i }).fill(DEMO_EMAIL);
  await page.locator('input[type="password"]').first().fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 45_000 });
  await page.getByRole("textbox", { name: /song|曲名/i }).waitFor({ timeout: 45_000 });
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: resolve(OUT_DIR, "screenshot-editor.png"),
    fullPage: false,
  });
  console.log("Wrote docs/images/screenshot-editor.png");
  editorCaptured = true;

  const videoContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 720 } },
  });
  const videoPage = await videoContext.newPage();
  await videoPage.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await videoPage.waitForTimeout(500);
  await videoPage.getByRole("textbox", { name: /email/i }).fill(DEMO_EMAIL);
  await videoPage.locator('input[type="password"]').first().fill(DEMO_PASSWORD);
  await videoPage.getByRole("button", { name: /sign in/i }).click();
  await videoPage.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 45_000,
  });
  await videoPage
    .getByRole("textbox", { name: /song|曲名/i })
    .waitFor({ timeout: 45_000 });
  const playBtn = videoPage.getByRole("button", { name: /^play$|再生/i }).first();
  if (await playBtn.isVisible().catch(() => false)) {
    await playBtn.click();
  } else {
    await videoPage.keyboard.press("Space");
  }
  await videoPage.waitForTimeout(3500);
  const video = videoPage.video();
  await videoContext.close();
  if (video) {
    const webmPath = await video.path();
    if (webmPath) {
      const gifPath = resolve(OUT_DIR, "demo-playback.gif");
      if (webmToGif(webmPath, gifPath)) {
        console.log("Wrote docs/images/demo-playback.gif");
        try {
          unlinkSync(webmPath);
        } catch {
          /* ignore */
        }
      }
    }
  }
} finally {
  await browser.close();
  if (editorCaptured) {
    restoreDemoWorkspaceIfPossible();
  }
}

// 一時 webm が残っていれば削除
for (const name of readdirSync(OUT_DIR)) {
  if (name.endsWith(".webm")) {
    try {
      unlinkSync(resolve(OUT_DIR, name));
    } catch {
      /* ignore */
    }
  }
}
