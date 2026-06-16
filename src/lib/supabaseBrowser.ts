import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function isSupabaseAuthConfigured(): boolean {
  return getSupabaseAuthSetupIssue() === "ok";
}

export type SupabaseAuthSetupIssue = "ok" | "anon_key" | "url" | "both";

export function getSupabaseAuthSetupIssue(): SupabaseAuthSetupIssue {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (url && anonKey) return "ok";
  if (url && !anonKey) return "anon_key";
  if (!url && anonKey) return "url";
  return "both";
}

export function getSupabaseBrowser(): SupabaseClient | null {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return browserClient;
}
