import {
  LEGACY_STORAGE_KEY,
  WORKSPACE_STORAGE_KEY,
} from "./constants";
import {
  createInitialState,
  createProjectState,
  deserializeState,
  normalizeChoreoState,
  serializeState,
} from "./choreoUtils";
import type {
  ChoreoState,
  NewProjectParams,
  ProjectRecord,
  ProjectSummary,
  Workspace,
} from "./types";

function newProjectId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function stripPlayback(state: ChoreoState): ChoreoState {
  return normalizeChoreoState(state);
}

export function createProjectRecord(
  state: ChoreoState,
  id = newProjectId(),
): ProjectRecord {
  const now = Date.now();
  return {
    id,
    createdAt: now,
    updatedAt: now,
    state: stripPlayback(state),
  };
}

export function projectToSummary(record: ProjectRecord): ProjectSummary {
  return {
    id: record.id,
    songTitle: record.state.songTitle,
    bpm: record.state.bpm,
    updatedAt: record.updatedAt,
  };
}

export function patchActiveProject(
  workspace: Workspace,
  activeProjectId: string,
  state: ChoreoState,
): Workspace {
  const now = Date.now();
  return {
    ...workspace,
    projects: workspace.projects.map((p) =>
      p.id === activeProjectId
        ? { ...p, updatedAt: now, state: stripPlayback(state) }
        : p,
    ),
  };
}

function parseWorkspace(json: string): Workspace | null {
  try {
    const raw = JSON.parse(json) as Partial<Workspace>;
    if (raw.version !== 1 || !raw.activeProjectId || !Array.isArray(raw.projects)) {
      return null;
    }
    const projects: ProjectRecord[] = [];
    for (const item of raw.projects) {
      if (!item?.id || !item.state) continue;
      const state = stripPlayback(item.state as ChoreoState);
      projects.push({
        id: item.id,
        createdAt: item.createdAt ?? Date.now(),
        updatedAt: item.updatedAt ?? Date.now(),
        state,
      });
    }
    if (!projects.length) return null;
    const activeProjectId = projects.some((p) => p.id === raw.activeProjectId)
      ? raw.activeProjectId
      : projects[0].id;
    return { version: 1, activeProjectId, projects };
  } catch {
    return null;
  }
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
        ...p,
        state: stripPlayback(p.state),
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
}

export function loadWorkspace(): LoadedWorkspace {
  if (typeof window === "undefined") {
    const state = createInitialState();
    const workspace = migrateLegacyWorkspace(state);
    return { workspace, activeState: state };
  }

  const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
  if (saved) {
    const workspace = parseWorkspace(saved);
    if (workspace) {
      const active = workspace.projects.find(
        (p) => p.id === workspace.activeProjectId,
      );
      if (active) {
        return {
          workspace,
          activeState: { ...active.state, isPlaying: false },
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
      return { workspace, activeState: state };
    }
  }

  const state = createInitialState();
  const workspace = migrateLegacyWorkspace(state);
  saveWorkspace(workspace);
  return { workspace, activeState: state };
}

export function addProject(
  workspace: Workspace,
  params: NewProjectParams,
): { workspace: Workspace; record: ProjectRecord } {
  const state = createProjectState(params);
  const record = createProjectRecord(state);
  return {
    workspace: {
      version: 1,
      activeProjectId: record.id,
      projects: [...workspace.projects, record],
    },
    record,
  };
}

export function removeProject(
  workspace: Workspace,
  projectId: string,
): Workspace | null {
  if (workspace.projects.length <= 1) return null;
  const projects = workspace.projects.filter((p) => p.id !== projectId);
  if (projects.length === workspace.projects.length) return null;
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
