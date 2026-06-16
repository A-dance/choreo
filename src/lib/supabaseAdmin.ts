import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) return null;
  adminClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return adminClient;
}

export function isShareBackendConfigured(): boolean {
  return getSupabaseAdmin() !== null;
}

export function getShareMediaPublicUrl(
  shareId: string,
  mediaId: string,
): string | null {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = admin.storage
    .from("share-media")
    .getPublicUrl(`${shareId}/${mediaId}`);
  return data.publicUrl;
}
