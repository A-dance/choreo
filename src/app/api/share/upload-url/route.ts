import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body: { shareId?: string; mediaId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const shareId = body.shareId?.trim();
  const mediaId = body.mediaId?.trim();
  if (!shareId || !mediaId) {
    return NextResponse.json({ error: "missing shareId or mediaId" }, { status: 400 });
  }

  const { data: share, error: shareError } = await admin
    .from("shares")
    .select("id")
    .eq("id", shareId)
    .maybeSingle();
  if (shareError || !share) {
    return NextResponse.json({ error: "share not found" }, { status: 404 });
  }

  const path = `${shareId}/${mediaId}`;
  const { data, error } = await admin.storage
    .from("share-media")
    .createSignedUploadUrl(path, { upsert: true });
  if (error || !data) {
    console.error("[share] signed upload url failed:", path, error?.message);
    return NextResponse.json(
      { error: error?.message ?? "signed url failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
  });
}
