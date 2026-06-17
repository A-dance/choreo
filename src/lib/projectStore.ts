import {
  LEGACY_STORAGE_KEY,
  WORKSPACE_STORAGE_KEY,
} from "./constants";
import {
  createBlankEditorState,
  createInitialState,
  createProjectState,
  deserializeState,
  normalizeChoreoState,
  serializeState,
} from "./choreoUtils";
import type {
  ChoreoState,
  NewProjectParams,
  ProjectFolder,
  ProjectMedia,
  ProjectRecord,
  ProjectSummary,
  Workspace,
} from "./types";
import { emptyProjectMedia, normalizeProjectMedia } from "./shareUtils";

function newProjectId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function newFolderId(): string {
  return `folder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeProjectRecord(item: Partial<ProjectRecord> & { id: string; state: ChoreoState }): ProjectRecord {
  return {
    id: item.id,
    createdAt: item.createdAt ?? Date.now(),
    updatedAt: item.updatedAt ?? Date.now(),
    state: stripPlayback(item.state),
    media: normalizeProjectMedia(item.media),
    folderId: item.folderId ?? null,
    bookmarked: Boolean(item.bookmarked),
  };
}

function normalizeFolder(item: Partial<ProjectFolder> & { id: string; name: string }): ProjectFolder {
  return {
    id: item.id,
    name: item.name.trim() || "Folder",
    createdAt: item.createdAt ?? Date.now(),
    collapsed: Boolean(item.collapsed),
    bookmarked: Boolean(item.bookmarked),
  };
}

function stripPlayback(state: ChoreoState): ChoreoState {
  return normalizeChoreoState(state);
}

export function createEmptyWorkspace(): Workspace {
  return { version: 2, activeProjectId: "", projects: [], folders: [] };
}

export function workspaceHasActiveProject(workspace: Workspace): boolean {
  if (!workspace.activeProjectId || !workspace.projects.length) return false;
  return workspace.projects.some((project) => project.id === workspace.activeProjectId);
}

export function createProjectRecord(
  state: ChoreoState,
  id = newProjectId(),
  media: ProjectMedia = emptyProjectMedia(),
): ProjectRecord {
  const now = Date.now();
  return {
    id,
    createdAt: now,
    updatedAt: now,
    state: stripPlayback(state),
    media,
  };
}

export function projectToSummary(record: ProjectRecord): ProjectSummary {
  const media = normalizeProjectMedia(record.media);
  return {
    id: record.id,
    songTitle: record.state.songTitle,
    bpm: record.state.bpm,
    updatedAt: record.updatedAt,
    audioCount: media.audioTracks.length,
    videoCount: media.referenceVideos.length,
    folderId: record.folderId ?? null,
    bookmarked: Boolean(record.bookmarked),
  };
}

export function patchActiveProject(
  workspace: Workspace,
  activeProjectId: string,
  state: ChoreoState,
  media?: ProjectMedia,
): Workspace {
  const now = Date.now();
  return {
    ...workspace,
    projects: workspace.projects.map((p) =>
      p.id === activeProjectId
        ? {
            ...p,
            updatedAt: now,
            state: stripPlayback(state),
            ...(media ? { media } : {}),
          }
        : p,
    ),
  };
}

function parseWorkspace(json: string): Workspace | null {
  try {
    return normalizeWorkspacePayload(JSON.parse(json));
  } catch {
    return null;
  }
}

export function normalizeWorkspacePayload(raw: unknown): Workspace | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as {
    version?: number;
    activeProjectId?: string;
    projects?: unknown[];
    folders?: unknown[];
  };
  if (!data.activeProjectId || !Array.isArray(data.projects)) return null;

  const projects: ProjectRecord[] = [];
  for (const item of data.projects) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ProjectRecord> & { state?: ChoreoState };
    if (!row.id || !row.state) continue;
    projects.push(normalizeProjectRecord({ ...row, id: row.id, state: row.state }));
  }

  const folders: ProjectFolder[] = [];
  if (Array.isArray(data.folders)) {
    for (const item of data.folders) {
      if (!item || typeof item !== "object") continue;
      const row = item as Partial<ProjectFolder>;
      if (!row.id || typeof row.name !== "string") continue;
      folders.push(normalizeFolder({ ...row, id: row.id, name: row.name }));
    }
  }

  if (!projects.length) {
    return {
      version: 2,
      activeProjectId: typeof data.activeProjectId === "string" ? data.activeProjectId : "",
      projects: [],
      folders,
    };
  }

  const validFolderIds = new Set(folders.map((f) => f.id));
  const normalizedProjects = projects.map((p) => ({
    ...p,
    folderId: p.folderId && validFolderIds.has(p.folderId) ? p.folderId : null,
  }));

  const activeProjectId = normalizedProjects.some((p) => p.id === data.activeProjectId)
    ? data.activeProjectId
    : normalizedProjects[0].id;

  return {
    version: 2,
    activeProjectId,
    projects: normalizedProjects,
    folders,
  };
}

function migrateLegacyWorkspace(state: ChoreoState): Workspace {
  const record = createProjectRecord(state);
  return {
    version: 2,
    activeProjectId: record.id,
    projects: [record],
    folders: [],
  };
}

export function saveWorkspace(workspace: Workspace): boolean {
  try {
    const payload: Workspace = {
      version: 2,
      activeProjectId: workspace.activeProjectId,
      folders: workspace.folders.map((f) => ({
        id: f.id,
        name: f.name,
        createdAt: f.createdAt,
        collapsed: Boolean(f.collapsed),
        bookmarked: Boolean(f.bookmarked),
      })),
      projects: workspace.projects.map((p) => ({
        id: p.id,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        state: stripPlayback(p.state),
        media: normalizeProjectMedia(p.media),
        folderId: p.folderId ?? null,
        bookmarked: Boolean(p.bookmarked),
      })),
    };
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export interface LoadedWorkspace {
  workspace: Workspace;
  activeState: ChoreoState;
  activeMedia: ProjectMedia;
}

export function getActiveMedia(
  workspace: Workspace,
  projectId: string,
): ProjectMedia {
  const record = workspace.projects.find((p) => p.id === projectId);
  return normalizeProjectMedia(record?.media);
}

export function loadWorkspace(): LoadedWorkspace {
  if (typeof window === "undefined") {
    const state = createInitialState();
    const workspace = migrateLegacyWorkspace(state);
    return { workspace, activeState: state, activeMedia: emptyProjectMedia() };
  }

  const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
  if (saved) {
    const workspace = parseWorkspace(saved);
    if (workspace) {
      if (!workspace.projects.length) {
        return {
          workspace,
          activeState: createBlankEditorState(),
          activeMedia: emptyProjectMedia(),
        };
      }
      const active = workspace.projects.find(
        (p) => p.id === workspace.activeProjectId,
      );
      if (active) {
        return {
          workspace,
          activeState: { ...active.state, isPlaying: false },
          activeMedia: normalizeProjectMedia(active.media),
        };
      }
    }
  }

  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) {
    const parsed = deserializeState(legacy);
    if (parsed) {
      const state = stripPlayback(parsed);
      const workspace = migrateLegacyWorkspace(state);
      saveWorkspace(workspace);
      return { workspace, activeState: state, activeMedia: emptyProjectMedia() };
    }
  }

  const state = createInitialState();
  const workspace = migrateLegacyWorkspace(state);
  saveWorkspace(workspace);
  return { workspace, activeState: state, activeMedia: emptyProjectMedia() };
}

export function addProject(
  workspace: Workspace,
  params: NewProjectParams,
): { workspace: Workspace; record: ProjectRecord } {
  const state = createProjectState(params);
  const record = createProjectRecord(state);
  if (!workspace.projects.length) {
    return {
      workspace: {
        version: 2,
        activeProjectId: record.id,
        projects: [record],
        folders: [],
      },
      record,
    };
  }
  return {
    workspace: {
      version: 2,
      activeProjectId: record.id,
      projects: [...workspace.projects, record],
      folders: workspace.folders,
    },
    record,
  };
}

export function reorderProjects(
  workspace: Workspace,
  fromIndex: number,
  toIndex: number,
): Workspace {
  if (fromIndex === toIndex) return workspace;
  const projects = [...workspace.projects];
  if (fromIndex < 0 || toIndex < 0) return workspace;
  if (fromIndex >= projects.length || toIndex >= projects.length) return workspace;
  const [removed] = projects.splice(fromIndex, 1);
  projects.splice(toIndex, 0, removed);
  return { ...workspace, projects };
}

export function removeProject(
  workspace: Workspace,
  projectId: string,
): Workspace | null {
  const projects = workspace.projects.filter((p) => p.id !== projectId);
  if (projects.length === workspace.projects.length) return null;
  if (!projects.length) {
    return createEmptyWorkspace();
  }
  const activeProjectId =
    workspace.activeProjectId === projectId
      ? projects[0].id
      : workspace.activeProjectId;
  return { version: 2, activeProjectId, projects, folders: workspace.folders };
}

export function createFolder(workspace: Workspace, name: string): Workspace {
  const folder = normalizeFolder({
    id: newFolderId(),
    name: name.trim() || "Folder",
    createdAt: Date.now(),
    collapsed: false,
  });
  return { ...workspace, folders: [...workspace.folders, folder] };
}

export function renameFolder(
  workspace: Workspace,
  folderId: string,
  name: string,
): Workspace {
  const nextName = name.trim();
  if (!nextName) return workspace;
  return {
    ...workspace,
    folders: workspace.folders.map((f) =>
      f.id === folderId ? { ...f, name: nextName } : f,
    ),
  };
}

export function renameProjectTitle(
  workspace: Workspace,
  projectId: string,
  songTitle: string,
): Workspace {
  const nextTitle = songTitle.trim();
  if (!nextTitle) return workspace;
  const now = Date.now();
  return {
    ...workspace,
    projects: workspace.projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            updatedAt: now,
            state: { ...p.state, songTitle: nextTitle },
          }
        : p,
    ),
  };
}

export function deleteFolder(workspace: Workspace, folderId: string): Workspace {
  return {
    ...workspace,
    folders: workspace.folders.filter((f) => f.id !== folderId),
    projects: workspace.projects.map((p) =>
      p.folderId === folderId ? { ...p, folderId: null } : p,
    ),
  };
}

export function toggleFolderCollapsed(
  workspace: Workspace,
  folderId: string,
): Workspace {
  return {
    ...workspace,
    folders: workspace.folders.map((f) =>
      f.id === folderId ? { ...f, collapsed: !f.collapsed } : f,
    ),
  };
}

export function toggleFolderBookmark(
  workspace: Workspace,
  folderId: string,
): Workspace {
  return {
    ...workspace,
    folders: workspace.folders.map((f) =>
      f.id === folderId ? { ...f, bookmarked: !f.bookmarked } : f,
    ),
  };
}

export function setProjectFolder(
  workspace: Workspace,
  projectId: string,
  folderId: string | null,
): Workspace {
  const validFolderId =
    folderId && workspace.folders.some((f) => f.id === folderId) ? folderId : null;
  return {
    ...workspace,
    projects: workspace.projects.map((p) =>
      p.id === projectId ? { ...p, folderId: validFolderId } : p,
    ),
  };
}

export function toggleProjectBookmark(
  workspace: Workspace,
  projectId: string,
): Workspace {
  return {
    ...workspace,
    projects: workspace.projects.map((p) =>
      p.id === projectId ? { ...p, bookmarked: !p.bookmarked } : p,
    ),
  };
}

export function getActiveState(
  workspace: Workspace,
  projectId: string,
): ChoreoState | null {
  const record = workspace.projects.find((p) => p.id === projectId);
  if (!record) return null;
  return { ...record.state, isPlaying: false };
}

export { serializeState };
