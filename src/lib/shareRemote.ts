import type { ChoreoState, ProjectMedia, Workspace } from "./types";
import type { UiStrings } from "./uiStrings";
import {
  emptyProjectMedia,
  normalizeProjectMedia,
  normalizeShareWorkspace,
  SHARED_VIEW_PROJECT_ID,
} from "./shareUtils";
import { normalizeChoreoState } from "./choreoUtils";
import { getShareBaseUrl } from "./shareUrl";
import { importMediaBlob, type MediaKind } from "./mediaStore";

export interface SharedMediaFile {
  id: string;
  kind: MediaKind;
  name: string;
  mimeType: string;
  url: string;
}

export interface RemoteShareBundle {
  state?: ChoreoState;
  media?: ProjectMedia;
  workspace?: Workspace;
  files: SharedMediaFile[];
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isShareId(value: string | null): value is string {
  return Boolean(value && UUID_RE.test(value));
}

export function buildShareUrlFromId(shareId: string): string {
  const base = getShareBaseUrl();
  return `${base}?mode=view&shareId=${encodeURIComponent(shareId)}`;
}

export function mediaHasLinkOnlyShare(media: ProjectMedia): boolean {
  const m = normalizeProjectMedia(media);
  const hasLinks =
    m.audioTracks.some((t) => t.source !== "file" && t.externalUrl) ||
    m.referenceVideos.some((v) => v.source !== "file" && v.externalUrl);
  const hasFiles =
    m.audioTracks.some((t) => t.source === "file") ||
    m.referenceVideos.some((v) => v.source === "file");
  return hasLinks && !hasFiles;
}

export function mediaHasUnsharedFiles(media: ProjectMedia): boolean {
  const m = normalizeProjectMedia(media);
  return (
    m.audioTracks.some((t) => t.source === "file") ||
    m.referenceVideos.some((v) => v.source === "file")
  );
}

export type CreateRemoteShareResult =
  | { ok: true; shareId: string }
  | { ok: false; reason: "not_configured" | "failed"; error?: string };

/** 配置 + 音源/動画リンク（Linkfire・Apple Music・YouTube 等）を Supabase に保存 */
export async function createRemoteShare(
  state: ChoreoState,
  media: ProjectMedia,
): Promise<CreateRemoteShareResult> {
  const normalizedState = normalizeChoreoState({ ...state, isPlaying: false });
  const normalizedMedia = normalizeProjectMedia(media);

  let res: Response;
  try {
    res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        state: normalizedState,
        media: normalizedMedia,
      }),
    });
  } catch {
    return { ok: false, reason: "failed", error: "network error" };
  }

  if (res.status === 503) {
    return { ok: false, reason: "not_configured" };
  }

  let data: { shareId?: string; error?: string };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    return { ok: false, reason: "failed", error: `HTTP ${res.status}` };
  }

  if (!res.ok || !data.shareId) {
    return {
      ok: false,
      reason: "failed",
      error: data.error ?? `HTTP ${res.status}`,
    };
  }

  return { ok: true, shareId: data.shareId };
}

/** フォルダー単位（複数曲）を Supabase に保存 */
export async function createRemoteShareWorkspace(
  workspace: Workspace,
): Promise<CreateRemoteShareResult> {
  const normalized = normalizeShareWorkspace(workspace);
  if (!normalized) {
    return { ok: false, reason: "failed", error: "invalid workspace" };
  }

  let res: Response;
  try {
    res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace: normalized }),
    });
  } catch {
    return { ok: false, reason: "failed", error: "network error" };
  }

  if (res.status === 503) {
    return { ok: false, reason: "not_configured" };
  }

  let data: { shareId?: string; error?: string };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    return { ok: false, reason: "failed", error: `HTTP ${res.status}` };
  }

  if (!res.ok || !data.shareId) {
    return {
      ok: false,
      reason: "failed",
      error: data.error ?? `HTTP ${res.status}`,
    };
  }

  return { ok: true, shareId: data.shareId };
}

export function shareCopiedToastMessage(lang: UiStrings, media: ProjectMedia): string {
  if (mediaHasUnsharedFiles(media)) {
    return lang.shareLinkCopiedFilesSkipped;
  }
  return lang.shareLinkCopied;
}

export async function fetchRemoteShare(
  shareId: string,
): Promise<RemoteShareBundle | null> {
  try {
    const res = await fetch(`/api/share?id=${encodeURIComponent(shareId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      state?: ChoreoState;
      media?: ProjectMedia;
      workspace?: Workspace;
      files?: SharedMediaFile[];
    };
    const files = Array.isArray(data.files) ? data.files : [];
    if (data.workspace) {
      const workspace = normalizeShareWorkspace(data.workspace);
      if (!workspace) return null;
      const active =
        workspace.projects.find((p) => p.id === workspace.activeProjectId) ??
        workspace.projects[0];
      return {
        workspace,
        state: normalizeChoreoState(active.state),
        media: normalizeProjectMedia(active.media),
        files,
      };
    }
    if (!data.state) return null;
    return {
      state: normalizeChoreoState(data.state),
      media: normalizeProjectMedia(data.media ?? emptyProjectMedia()),
      files,
    };
  } catch {
    return null;
  }
}

export async function importSharedMediaFiles(
  projectId: string,
  files: SharedMediaFile[],
): Promise<void> {
  await Promise.all(
    files.map(async (file) => {
      try {
        const res = await fetch(file.url);
        if (!res.ok) return;
        const blob = await res.blob();
        await importMediaBlob(
          projectId,
          file.id,
          file.kind,
          file.name,
          file.mimeType || blob.type || "application/octet-stream",
          blob,
        );
      } catch {
        /* skip failed file */
      }
    }),
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => window.setTimeout(() => resolve(null), ms)),
  ]);
}

function mediaFileIds(media: ProjectMedia): Set<string> {
  const ids = new Set<string>();
  for (const track of media.audioTracks) {
    if (track.source === "file") ids.add(track.id);
  }
  for (const video of media.referenceVideos) {
    if (video.source === "file") ids.add(video.id);
  }
  return ids;
}

export async function hydrateRemoteShare(
  shareId: string,
): Promise<RemoteShareBundle | null> {
  const bundle = await withTimeout(fetchRemoteShare(shareId), 10_000);
  if (!bundle) return null;
  if (bundle.files.length > 0) {
    if (bundle.workspace) {
      await withTimeout(
        Promise.all(
          bundle.workspace.projects.map(async (project) => {
            const ids = mediaFileIds(project.media);
            const projectFiles = bundle.files.filter((file) => ids.has(file.id));
            if (!projectFiles.length) return;
            await importSharedMediaFiles(project.id, projectFiles);
          }),
        ),
        15_000,
      );
    } else {
      await withTimeout(
        importSharedMediaFiles(SHARED_VIEW_PROJECT_ID, bundle.files),
        15_000,
      );
    }
  }
  return bundle;
}
