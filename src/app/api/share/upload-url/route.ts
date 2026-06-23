import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse } from "@/lib/apiErrors";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return apiErrorResponse(ApiError.NOT_CONFIGURED, 503);
  }

  let body: { shareId?: string; mediaId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiErrorResponse(ApiError.INVALID_BODY, 400);
  }

  const shareId = body.shareId?.trim();
  const mediaId = body.mediaId?.trim();
  if (!shareId || !mediaId) {
    return apiErrorResponse(ApiError.MISSING_SHARE_ID_OR_MEDIA_ID, 400);
  }

  const { data: share, error: shareError } = await admin
    .from("shares")
    .select("id")
    .eq("id", shareId)
    .maybeSingle();
  if (shareError || !share) {
    return apiErrorResponse(ApiError.SHARE_NOT_FOUND, 404);
  }

  const path = `${shareId}/${mediaId}`;
  const { data, error } = await admin.storage
    .from("share-media")
    .createSignedUploadUrl(path, { upsert: true });
  if (error || !data) {
    console.error("[share] signed upload url failed:", path, error?.message);
    return apiErrorResponse(ApiError.SIGNED_URL_FAILED, 500);
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
  });
}
