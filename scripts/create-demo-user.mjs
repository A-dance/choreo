#!/usr/bin/env node
/**
 * Creates or updates the demo login user in Supabase.
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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
const email = env.NEXT_PUBLIC_DEMO_EMAIL?.trim() ?? "demo@bamiri.share";
const password = env.NEXT_PUBLIC_DEMO_PASSWORD?.trim() ?? "Demo1234";

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
  `${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
  { headers },
);
const list = await listRes.json();
const users = Array.isArray(list?.users) ? list.users : [];
const existing = users.find(
  (u) => u.email?.trim().toLowerCase() === email.toLowerCase(),
);

const body = {
  email,
  password,
  email_confirm: true,
  user_metadata: {
    full_name: "Demo User",
    display_name: "デモユーザー",
  },
};

let res;
if (existing?.id) {
  res = await fetch(`${url}/auth/v1/admin/users/${existing.id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
} else {
  res = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

const data = await res.json();
if (!res.ok) {
  console.error("Failed:", data);
  process.exit(1);
}

const userId = data.id ?? existing?.id;
if (!userId) {
  console.error("Failed: no user id in response");
  process.exit(1);
}

const profileRes = await fetch(`${url}/rest/v1/profiles`, {
  method: "POST",
  headers: {
    ...headers,
    Prefer: "resolution=merge-duplicates",
  },
  body: JSON.stringify({
    id: userId,
    display_name: "デモユーザー",
    language: "ja",
    plan: "free",
    updated_at: new Date().toISOString(),
  }),
});

if (!profileRes.ok) {
  const profileErr = await profileRes.text();
  console.error("Failed to upsert profile:", profileErr);
  process.exit(1);
}

console.log(`Demo user ready: ${email} (${userId})`);
