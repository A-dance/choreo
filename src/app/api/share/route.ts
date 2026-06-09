import { NextResponse } from "next/server";
import { normalizeChoreoState } from "@/lib/choreoUtils";
import {
  getShareMediaPublicUrl,
  getSupabaseAdmin,
  isShareBackendConfigured,
} from "@/lib/supabaseAdmin";
import { normalizeProjectMedia } from "@/lib/shareUtils";
import type { ChoreoState, ProjectMedia } from "@/lib/types";

export const maxDuration = 60;

/** Supabase Free プランのグローバル上限（50MB） */
export const SHARE_FILE_MAX_BYTES = 52_428_800;

interface SharePayload {
  v: 1;
  state: ChoreoState;
  media: ProjectMedia;
}

export async function POST(request: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let state: ChoreoState;
  let media: ProjectMedia;
  const fileEntries: Array<{ mediaId: string; blob: Blob }> = [];

  if (contentType.includes("application/json")) {
    let body: { state?: ChoreoState; media?: ProjectMedia };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "invalid body" }, { status: 400 });
    }
    if (!body.state) {
      return NextResponse.json({ error: "missing state" }, { status: 400 });
    }
    state = normalizeChoreoState({ ...body.state, isPlaying: false });
    media = normalizeProjectMedia(body.media);
  } else {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "invalid body" }, { status: 400 });
    }

    const manifestRaw = formData.get("manifest");
    if (typeof manifestRaw !== "string") {
      return NextResponse.json({ error: "missing manifest" }, { status: 400 });
    }

    let manifest: { state: ChoreoState; media: ProjectMedia };
    try {
      manifest = JSON.parse(manifestRaw) as {
        state: ChoreoState;
        media: ProjectMedia;
      };
    } catch {
      return NextResponse.json({ error: "invalid manifest" }, { status: 400 });
    }

    state = normalizeChoreoState({ ...manifest.state, isPlaying: false });
    media = normalizeProjectMedia(manifest.media);

    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("file:") || !(value instanceof Blob)) continue;
      const mediaId = key.slice("file:".length);
      if (!mediaId) continue;
      fileEntries.push({ mediaId, blob: value });
    }
  }

  const shareId = crypto.randomUUID();

  const skippedFiles: string[] = [];
  for (const { mediaId, blob } of fileEntries) {
    if (blob.size > SHARE_FILE_MAX_BYTES) {
      skippedFiles.push(mediaId);
      continue;
    }
    const buffer = await blob.arrayBuffer();
    const { error } = await admin.storage.from("share-media").upload(
      `${shareId}/${mediaId}`,
      buffer,
      {
        contentType: blob.type || "application/octet-stream",
        upsert: true,
      },
    );
    if (error) {
      console.error("[share] storage upload failed:", mediaId, error.message);
      skippedFiles.push(mediaId);
      continue;
    }
  }

  const payload: SharePayload = { v: 1, state, media };
  const { error: dbError } = await admin.from("shares").insert({
    id: shareId,
    song_title: state.songTitle,
    payload,
  });
  if (dbError) {
    console.error("[share] db insert failed:", dbError.message);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({
    shareId,
    skippedFiles: skippedFiles.length ? skippedFiles : undefined,
  });
}

export async function GET(request: Request) {
  if (!isShareBackendConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const { data, error } = await admin
    .from("shares")
    .select("payload")
    .eq("id", id)
    .maybeSingle();

  if (error || !data?.payload) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const payload = data.payload as SharePayload;
  const state = normalizeChoreoState(payload.state);
  const media = normalizeProjectMedia(payload.media);

  const files: Array<{
    id: string;
    kind: "audio" | "video";
    name: string;
    mimeType: string;
    url: string;
  }> = [];

  for (const track of media.audioTracks) {
    if (track.source !== "file") continue;
    const url = getShareMediaPublicUrl(id, track.id);
    if (!url) continue;
    files.push({
      id: track.id,
      kind: "audio",
      name: track.name,
      mimeType: "audio/mpeg",
      url,
    });
  }
  for (const video of media.referenceVideos) {
    if (video.source !== "file") continue;
    const url = getShareMediaPublicUrl(id, video.id);
    if (!url) continue;
    files.push({
      id: video.id,
      kind: "video",
      name: video.name,
      mimeType: "video/mp4",
      url,
    });
  }

  return NextResponse.json({ state, media, files });
}
