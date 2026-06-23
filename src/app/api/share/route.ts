import { NextResponse } from "next/server";
import { normalizeChoreoState } from "@/lib/choreoUtils";
import { ApiError, apiErrorResponse } from "@/lib/apiErrors";
import {
  getShareMediaPublicUrl,
  getSupabaseAdmin,
  isShareBackendConfigured,
} from "@/lib/supabaseAdmin";
import { normalizeProjectMedia, normalizeShareWorkspace } from "@/lib/shareUtils";
import type { ChoreoState, ProjectMedia, Workspace } from "@/lib/types";

export const maxDuration = 60;

/** Supabase Free プランのグローバル上限（50MB） */
export const SHARE_FILE_MAX_BYTES = 52_428_800;

interface SharePayloadV1 {
  v: 1;
  state: ChoreoState;
  media: ProjectMedia;
}

interface SharePayloadV2 {
  v: 2;
  workspace: Workspace;
}

type SharePayload = SharePayloadV1 | SharePayloadV2;

/** 共有タイトル: 単一フォルダ共有ならフォルダ名、それ以外はアクティブ曲名 */
function shareTitleForWorkspace(workspace: Workspace): string {
  if (workspace.folders.length === 1) return workspace.folders[0].name;
  const active =
    workspace.projects.find((p) => p.id === workspace.activeProjectId) ??
    workspace.projects[0];
  return active?.state.songTitle ?? "Share";
}

function collectShareFiles(
  shareId: string,
  media: ProjectMedia,
): Array<{
  id: string;
  kind: "audio" | "video";
  name: string;
  mimeType: string;
  url: string;
}> {
  const files: Array<{
    id: string;
    kind: "audio" | "video";
    name: string;
    mimeType: string;
    url: string;
  }> = [];

  for (const track of media.audioTracks) {
    if (track.source !== "file") continue;
    const url = getShareMediaPublicUrl(shareId, track.id);
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
    const url = getShareMediaPublicUrl(shareId, video.id);
    if (!url) continue;
    files.push({
      id: video.id,
      kind: "video",
      name: video.name,
      mimeType: "video/mp4",
      url,
    });
  }

  return files;
}

export async function POST(request: Request) {
  // JSON: v2 workspace または v1 state+media / multipart: v1 + ファイル（50MB 超は skippedFiles）
  const admin = getSupabaseAdmin();
  if (!admin) {
    return apiErrorResponse(ApiError.NOT_CONFIGURED, 503);
  }

  const contentType = request.headers.get("content-type") ?? "";
  let payload: SharePayload;
  let songTitle: string;
  const fileEntries: Array<{ mediaId: string; blob: Blob }> = [];

  if (contentType.includes("application/json")) {
    let body: {
      state?: ChoreoState;
      media?: ProjectMedia;
      workspace?: Workspace;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return apiErrorResponse(ApiError.INVALID_BODY, 400);
    }

    if (body.workspace) {
      const workspace = normalizeShareWorkspace(body.workspace);
      if (!workspace) {
        return apiErrorResponse(ApiError.INVALID_WORKSPACE, 400);
      }
      payload = { v: 2, workspace };
      songTitle = shareTitleForWorkspace(workspace);
    } else if (body.state) {
      const state = normalizeChoreoState({ ...body.state, isPlaying: false });
      const media = normalizeProjectMedia(body.media);
      payload = { v: 1, state, media };
      songTitle = state.songTitle;
    } else {
      return apiErrorResponse(ApiError.MISSING_STATE, 400);
    }
  } else {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return apiErrorResponse(ApiError.INVALID_BODY, 400);
    }

    const manifestRaw = formData.get("manifest");
    if (typeof manifestRaw !== "string") {
      return apiErrorResponse(ApiError.MISSING_MANIFEST, 400);
    }

    let manifest: { state: ChoreoState; media: ProjectMedia };
    try {
      manifest = JSON.parse(manifestRaw) as {
        state: ChoreoState;
        media: ProjectMedia;
      };
    } catch {
      return apiErrorResponse(ApiError.INVALID_MANIFEST, 400);
    }

    const state = normalizeChoreoState({ ...manifest.state, isPlaying: false });
    const media = normalizeProjectMedia(manifest.media);
    payload = { v: 1, state, media };
    songTitle = state.songTitle;

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
    const { error } = await admin.storage
      .from("share-media")
      .upload(`${shareId}/${mediaId}`, buffer, {
        contentType: blob.type || "application/octet-stream",
        upsert: true,
      });
    if (error) {
      console.error("[share] storage upload failed:", mediaId, error.message);
      skippedFiles.push(mediaId);
      continue;
    }
  }

  const payloadToStore: SharePayload = payload;
  const { error: dbError } = await admin.from("shares").insert({
    id: shareId,
    song_title: songTitle,
    payload: payloadToStore,
  });
  if (dbError) {
    console.error("[share] db insert failed:", dbError.message);
    return apiErrorResponse(ApiError.SERVER_ERROR, 500);
  }

  return NextResponse.json({
    shareId,
    skippedFiles: skippedFiles.length ? skippedFiles : undefined,
  });
}

export async function GET(request: Request) {
  if (!isShareBackendConfigured()) {
    return apiErrorResponse(ApiError.NOT_CONFIGURED, 503);
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return apiErrorResponse(ApiError.MISSING_ID, 400);
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return apiErrorResponse(ApiError.NOT_CONFIGURED, 503);
  }

  const { data, error } = await admin
    .from("shares")
    .select("payload")
    .eq("id", id)
    .maybeSingle();

  if (error || !data?.payload) {
    return apiErrorResponse(ApiError.NOT_FOUND, 404);
  }

  const payload = data.payload as SharePayload;
  if (payload.v === 2) {
    const workspace = normalizeShareWorkspace(payload.workspace);
    if (!workspace) {
      return apiErrorResponse(ApiError.INVALID_PAYLOAD, 500);
    }
    const active =
      workspace.projects.find((p) => p.id === workspace.activeProjectId) ??
      workspace.projects[0];
    const state = normalizeChoreoState(active.state);
    const media = normalizeProjectMedia(active.media);
    const files = workspace.projects.flatMap((project) =>
      collectShareFiles(id, normalizeProjectMedia(project.media)),
    );
    return NextResponse.json({ workspace, state, media, files });
  }

  const state = normalizeChoreoState(payload.state);
  const media = normalizeProjectMedia(payload.media);
  const files = collectShareFiles(id, media);

  return NextResponse.json({ state, media, files });
}
