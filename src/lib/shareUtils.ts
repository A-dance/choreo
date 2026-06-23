import type {
  AudioTrackMeta,
  ChoreoState,
  MusicSource,
  ProjectFolder,
  ProjectMedia,
  ProjectRecord,
  ReferenceVideoMeta,
  ReferenceVideoSource,
  Workspace,
} from "./types";
import { normalizeChoreoState } from "./choreoUtils";
import { getShareBaseUrl } from "./shareUrl";

export const SHARE_URL_MAX = 12_000;

export function emptyProjectMedia(): ProjectMedia {
  return {
    audioTracks: [],
    referenceVideos: [],
  };
}

function normalizeAudioTracks(tracks: unknown): AudioTrackMeta[] {
  if (!Array.isArray(tracks)) return [];
  const result: AudioTrackMeta[] = [];
  for (const raw of tracks) {
    if (!raw || typeof raw !== "object") continue;
    const t = raw as Partial<AudioTrackMeta>;
    if (typeof t.id !== "string" || typeof t.name !== "string") continue;
    const source: MusicSource =
      t.source === "file" ||
      t.source === "smart_link" ||
      t.source === "spotify" ||
      t.source === "apple_music" ||
      t.source === "youtube_music"
        ? t.source
        : typeof t.externalUrl === "string" && t.externalUrl
          ? "smart_link"
          : "file";
    if (source === "file") {
      result.push({
        id: t.id,
        name: t.name,
        createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.now(),
        source: "file",
      });
      continue;
    }
    if (typeof t.externalUrl !== "string" || !t.externalUrl) continue;
    result.push({
      id: t.id,
      name: t.name,
      createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.now(),
      source,
      externalUrl: t.externalUrl,
      thumbnailUrl: typeof t.thumbnailUrl === "string" ? t.thumbnailUrl : undefined,
    });
  }
  return result;
}

function normalizeReferenceVideos(videos: unknown): ReferenceVideoMeta[] {
  if (!Array.isArray(videos)) return [];
  const result: ReferenceVideoMeta[] = [];
  for (const raw of videos) {
    if (!raw || typeof raw !== "object") continue;
    const v = raw as Partial<ReferenceVideoMeta>;
    if (typeof v.id !== "string" || typeof v.name !== "string") continue;
    const source: ReferenceVideoSource =
      v.source === "youtube" || v.source === "vimeo" || v.source === "file"
        ? v.source
        : v.externalUrl
          ? "youtube"
          : "file";
    result.push({
      id: v.id,
      name: v.name,
      createdAt: typeof v.createdAt === "number" ? v.createdAt : Date.now(),
      message: typeof v.message === "string" ? v.message : "",
      source,
      externalUrl: typeof v.externalUrl === "string" ? v.externalUrl : undefined,
    });
  }
  return result;
}

/** localStorage 等から読んだ不完全な media を安全に正規化 */
export function normalizeProjectMedia(
  media: Partial<ProjectMedia> | null | undefined,
): ProjectMedia {
  if (!media) return emptyProjectMedia();
  return {
    audioTracks: normalizeAudioTracks(media.audioTracks),
    referenceVideos: normalizeReferenceVideos(media.referenceVideos),
  };
}

function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(encoded: string): string {
  let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export interface LegacyShareBundle {
  state: ChoreoState;
  media: ProjectMedia;
}

/** URL 埋め込み用（Supabase 未設定時のフォールバック — ファイルは含めない） */
export function encodeLegacyShareToken(
  state: ChoreoState,
  media: ProjectMedia,
): string {
  const payload = JSON.stringify({
    v: 2 as const,
    state: normalizeChoreoState({ ...state, isPlaying: false }),
    media: normalizeProjectMedia(media),
  });
  return toBase64Url(payload);
}

export function decodeLegacyShareToken(token: string): LegacyShareBundle | null {
  try {
    const raw = JSON.parse(fromBase64Url(token)) as {
      v?: number;
      state?: ChoreoState;
      media?: ProjectMedia;
    };
    if (!raw.state) return null;
    if (raw.v === 2) {
      return {
        state: normalizeChoreoState(raw.state),
        media: normalizeProjectMedia(raw.media),
      };
    }
    if (raw.v === 1) {
      return {
        state: normalizeChoreoState(raw.state),
        media: emptyProjectMedia(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function buildLegacyShareUrl(
  state: ChoreoState,
  media: ProjectMedia,
): string | null {
  const token = encodeLegacyShareToken(state, media);
  const url = `${getShareBaseUrl()}?mode=view&share=${token}`;
  if (url.length > SHARE_URL_MAX) return null;
  return url;
}

export function parseShareFromLocation(search: string): {
  viewOnly: boolean;
  shareId: string | null;
  legacyToken: string | null;
} {
  const params = new URLSearchParams(search);
  const viewOnly = params.get("mode") === "view";
  return {
    viewOnly,
    shareId: params.get("shareId")?.trim() || null,
    legacyToken: params.get("share")?.trim() || null,
  };
}

export function isPublicShareUrl(search: string): boolean {
  const { shareId, legacyToken } = parseShareFromLocation(search);
  return Boolean(shareId || legacyToken);
}

export const SHARED_VIEW_PROJECT_ID = "__shared_view__";

export function buildSharedViewWorkspace(
  state: ChoreoState,
  media: ProjectMedia = emptyProjectMedia(),
): Workspace {
  const normalized = normalizeChoreoState({ ...state, isPlaying: false });
  const normalizedMedia = normalizeProjectMedia(media);
  const now = Date.now();
  return {
    version: 2,
    activeProjectId: SHARED_VIEW_PROJECT_ID,
    folders: [],
    projects: [
      {
        id: SHARED_VIEW_PROJECT_ID,
        createdAt: now,
        updatedAt: now,
        state: normalized,
        media: normalizedMedia,
      },
    ],
  };
}

export function isSharedViewUrl(search: string): boolean {
  const params = new URLSearchParams(search);
  return (
    params.get("mode") === "view" ||
    Boolean(params.get("share")) ||
    Boolean(params.get("shareId"))
  );
}

export function applySharedViewBundle(
  bundle: LegacyShareBundle,
  viewOnly: boolean,
): {
  workspace: Workspace;
  state: ChoreoState;
  media: ProjectMedia;
  appMode: "edit" | "view";
} {
  const workspace = buildSharedViewWorkspace(bundle.state, bundle.media);
  return {
    workspace,
    state: bundle.state,
    media: bundle.media,
    appMode: viewOnly ? "view" : "edit",
  };
}

function normalizeProjectRecord(record: unknown): ProjectRecord | null {
  if (!record || typeof record !== "object") return null;
  const raw = record as Partial<ProjectRecord>;
  if (typeof raw.id !== "string" || !raw.state) return null;
  return {
    id: raw.id,
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : Date.now(),
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : Date.now(),
    folderId:
      typeof raw.folderId === "string"
        ? raw.folderId
        : raw.folderId === null
          ? null
          : undefined,
    bookmarked: Boolean(raw.bookmarked),
    state: normalizeChoreoState({ ...raw.state, isPlaying: false }),
    media: normalizeProjectMedia(raw.media),
  };
}

function normalizeProjectFolder(folder: unknown): ProjectFolder | null {
  if (!folder || typeof folder !== "object") return null;
  const raw = folder as Partial<ProjectFolder>;
  if (typeof raw.id !== "string" || typeof raw.name !== "string") return null;
  return {
    id: raw.id,
    name: raw.name,
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : Date.now(),
    collapsed: Boolean(raw.collapsed),
    bookmarked: Boolean(raw.bookmarked),
  };
}

/** 共有用ワークスペース（複数曲・フォルダー構造）を正規化 */
export function normalizeShareWorkspace(workspace: unknown): Workspace | null {
  if (!workspace || typeof workspace !== "object") return null;
  const raw = workspace as Partial<Workspace>;
  const projects = Array.isArray(raw.projects)
    ? raw.projects
        .map(normalizeProjectRecord)
        .filter((p): p is ProjectRecord => p !== null)
    : [];
  if (!projects.length) return null;
  const folders = Array.isArray(raw.folders)
    ? raw.folders
        .map(normalizeProjectFolder)
        .filter((f): f is ProjectFolder => f !== null)
    : [];
  const activeProjectId =
    typeof raw.activeProjectId === "string" &&
    projects.some((p) => p.id === raw.activeProjectId)
      ? raw.activeProjectId
      : projects[0].id;
  return {
    version: 2,
    activeProjectId,
    folders,
    projects,
  };
}

export function applySharedWorkspaceBundle(
  workspace: Workspace,
  viewOnly: boolean,
): {
  workspace: Workspace;
  state: ChoreoState;
  media: ProjectMedia;
  appMode: "edit" | "view";
} {
  const normalized = normalizeShareWorkspace(workspace);
  if (!normalized) {
    throw new Error("invalid shared workspace");
  }
  const record =
    normalized.projects.find((p) => p.id === normalized.activeProjectId) ??
    normalized.projects[0];
  const state = normalizeChoreoState({ ...record.state, isPlaying: false });
  const media = normalizeProjectMedia(record.media);
  return {
    workspace: { ...normalized, activeProjectId: record.id },
    state,
    media,
    appMode: viewOnly ? "view" : "edit",
  };
}

export type FolderShareKey = "uncategorized" | string;

/**
 * フォルダ単位共有用にワークスペースを切り出す。
 * activeProjectId の編集中 state/media を live 値で上書きしてから共有ペイロードに載せる。
 */
export function buildFolderShareWorkspace(
  workspace: Workspace,
  folderKey: FolderShareKey,
  activeProjectId: string,
  liveState?: ChoreoState,
  liveMedia?: ProjectMedia,
): Workspace | null {
  let projects: ProjectRecord[];
  let folders: ProjectFolder[];

  if (folderKey === "uncategorized") {
    projects = workspace.projects.filter((p) => !p.folderId);
    folders = [];
  } else {
    projects = workspace.projects.filter((p) => p.folderId === folderKey);
    folders = workspace.folders.filter((f) => f.id === folderKey);
  }

  if (!projects.length) return null;

  const patchedProjects = projects.map((project) => {
    if (project.id !== activeProjectId || !liveState) {
      return {
        ...project,
        state: normalizeChoreoState({ ...project.state, isPlaying: false }),
      };
    }
    return {
      ...project,
      state: normalizeChoreoState({ ...liveState, isPlaying: false }),
      media: normalizeProjectMedia(liveMedia ?? project.media),
    };
  });

  const nextActiveId = patchedProjects.some((p) => p.id === activeProjectId)
    ? activeProjectId
    : patchedProjects[0].id;

  return {
    version: 2,
    activeProjectId: nextActiveId,
    folders,
    projects: patchedProjects,
  };
}
