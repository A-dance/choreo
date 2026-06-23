#!/usr/bin/env node
/**
 * Seeds the demo account with one reference project in user_workspaces.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildDemoReferenceWorkspace } from "./demoWorkspacePayload.mjs";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  const text = readFileSync(path, "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    env[trimmed.slice(0, i)] = trimmed.slice(i + 1);
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const demoEmail = "demo@bamiri.share";

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

const listRes = await fetch(
  `${url}/auth/v1/admin/users?email=${encodeURIComponent(demoEmail)}`,
  { headers },
);
const list = await listRes.json();
const users = Array.isArray(list?.users) ? list.users : [];
const user = users.find(
  (u) => u.email?.trim().toLowerCase() === demoEmail.toLowerCase(),
);
if (!user?.id) {
  console.error(`Demo user not found: ${demoEmail}. Run npm run demo:user first.`);
  process.exit(1);
}

const workspace = buildDemoReferenceWorkspace();

const upsertRes = await fetch(`${url}/rest/v1/user_workspaces?on_conflict=user_id`, {
  method: "POST",
  headers: {
    ...headers,
    Prefer: "resolution=merge-duplicates",
  },
  body: JSON.stringify({
    user_id: user.id,
    payload: workspace,
    updated_at: new Date().toISOString(),
  }),
});

if (!upsertRes.ok) {
  const err = await upsertRes.text();
  console.error("Failed to seed demo workspace:", err);
  process.exit(1);
}

console.log(`Demo workspace seeded for ${demoEmail}`);
