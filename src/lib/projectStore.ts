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
  ProjectMedia,
  ProjectRecord,
  ProjectSummary,
  Workspace,
} from "./types";
import { emptyProjectMedia, normalizeProjectMedia } from "./shareUtils";

function newProjectId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function stripPlayback(state: ChoreoState): ChoreoState {
  return normalizeChoreoState(state);
}

export function createEmptyWorkspace(): Workspace {
  return { version: 1, activeProjectId: "", projects: [] };
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
  const data = raw as Partial<Workspace>;
  if (data.version !== 1 || !data.activeProjectId || !Array.isArray(data.projects)) {
    return null;
  }
  const projects: ProjectRecord[] = [];
  for (const item of data.projects) {
    if (!item?.id || !item.state) continue;
    const state = stripPlayback(item.state as ChoreoState);
    projects.push({
      id: item.id,
      createdAt: item.createdAt ?? Date.now(),
      updatedAt: item.updatedAt ?? Date.now(),
      state,
      media: normalizeProjectMedia(item.media),
    });
  }
  if (!projects.length) {
    return {
      version: 1,
      activeProjectId: typeof data.activeProjectId === "string" ? data.activeProjectId : "",
      projects: [],
    };
  }
  const activeProjectId = projects.some((p) => p.id === data.activeProjectId)
    ? data.activeProjectId
    : projects[0].id;
  return { version: 1, activeProjectId, projects };
}

function migrateLegacyWorkspace(state: ChoreoState): Workspace {
  const record = createProjectRecord(state);
  return {
    version: 1,
    activeProjectId: record.id,
    projects: [record],
  };
}

export function saveWorkspace(workspace: Workspace): boolean {
  try {
    const payload: Workspace = {
      version: 1,
      activeProjectId: workspace.activeProjectId,
      projects: workspace.projects.map((p) => ({
        id: p.id,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        state: stripPlayback(p.state),
        media: normalizeProjectMedia(p.media),
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
        version: 1,
        activeProjectId: record.id,
        projects: [record],
      },
      record,
    };
  }
  return {
    workspace: {
      version: 1,
      activeProjectId: record.id,
      projects: [...workspace.projects, record],
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
  return { version: 1, activeProjectId, projects };
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
