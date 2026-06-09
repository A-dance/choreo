import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  const path = resolve(root, ".env.local");
  try {
    const text = readFileSync(path, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      const hash = value.indexOf(" #");
      if (hash !== -1) value = value.slice(0, hash).trim();
      if (value.includes(" ")) value = value.split(/\s+/)[0] ?? value;
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* optional */
  }
}

loadEnvLocal();

const connectionString = process.env.SUPABASE_DB_URL?.trim();
if (!connectionString) {
  console.error(
    [
      "SUPABASE_DB_URL が .env.local にありません。",
      "",
      "Safari 等で Supabase を開き:",
      "  Project Settings → Database → Connection string → URI",
      "をコピーして .env.local に追加してください。",
      "",
      "例:",
      "SUPABASE_DB_URL=postgresql://postgres.xxxx:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres",
    ].join("\n"),
  );
  process.exit(1);
}

const sql = readFileSync(resolve(root, "supabase/schema.sql"), "utf8");
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("OK — supabase/schema.sql を適用しました。");
} catch (err) {
  console.error("失敗:", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await client.end();
}
