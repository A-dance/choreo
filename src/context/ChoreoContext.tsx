"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  applyMemberCount,
  beatIntervalMs,
  buildPlaybackPhases,
  clampStagePos,
  createBlankEditorState,
  createInitialState,
  findFirstPhaseForGlobal,
  flattenTimeline,
  countHasData,
  getCountData,
  getFlatSlot,
  getMemberPos,
  getPlaybackPhaseTiming,
  getSectionDurationMs,
  getElapsedMsBeforePhase,
  getElapsedMsThroughPhase,
  getTotalSlots,
  insertHalfSlot,
  appendSection,
  appendCountToSection,
  moveSection as moveSectionOrder,
  reorderSections as reorderSectionsOrder,
  removeSlotAt,
  removeSection,
  renameSection,
  remapCountDataBySlots,
  remapCurrentCount,
  swapSections as swapSectionsOrder,
  shiftCountDataInsert,
  shiftCountDataRemove,
  slotGlobalIndex,
  getHiddenMembers,
  isMemberVisible,
  resolveMemberDotPx,
  snapshotFormation,
  setMemberHiddenAtCount,
  normalizeChoreoState,
} from "@/lib/choreoUtils";
import { MAX_COUNTS_PER_SECTION } from "@/lib/constants";
import { clampMemberDotPx, normalizeStage } from "@/lib/gridUtils";
import {
  addProject,
  createFolder,
  deleteFolder,
  getActiveMedia,
  getActiveState,
  loadWorkspace,
  patchActiveProject,
  projectToSummary,
  removeProject,
  renameFolder,
  renameProjectTitle,
  reorderProjects as reorderWorkspaceProjects,
  saveWorkspace,
  setProjectFolder,
  toggleFolderBookmark,
  toggleFolderCollapsed,
  toggleProjectBookmark,
  workspaceHasActiveProject,
} from "@/lib/projectStore";
import {
  fetchCloudWorkspace,
  flushCloudWorkspacePush,
  pushCloudWorkspace,
  resolveUserWorkspace,
  scheduleCloudWorkspacePush,
} from "@/lib/cloudSync";
import { useAuth } from "@/context/AuthContext";
import {
  applySharedViewBundle,
  buildLegacyShareUrl,
  decodeLegacyShareToken,
  emptyProjectMedia,
  normalizeProjectMedia,
  parseShareFromLocation,
  SHARED_VIEW_PROJECT_ID,
} from "@/lib/shareUtils";
import {
  buildShareUrlFromId,
  createRemoteShare,
  hydrateRemoteShare,
  isShareId,
  shareCopiedToastMessage,
} from "@/lib/shareRemote";
import {
  deleteMediaBlob,
  deleteProjectMedia,
  getMediaBlob,
  newMediaId,
  saveMediaFile,
} from "@/lib/mediaStore";
import { resolveMusicLink } from "@/lib/musicResolve";
import { coerceMusicLink } from "@/lib/musicLinkUtils";
import { displayMusicTitle } from "@/lib/openGraphMetadata";
import { parseVideoLink } from "@/lib/videoLinkUtils";
import { useProfile } from "@/context/ProfileContext";
import { BrandLogo } from "@/components/BrandLogo";
import { canCreateProject } from "@/lib/subscription";
import { getStrings, detectBrowserLanguage, type ProjectLanguage, type UiStrings } from "@/lib/uiStrings";
import type {
  AppMode,
  ChoreoState,
  CountData,
  CreateProjectInput,
  FormationClipboard,
  Position,
  ProjectMedia,
  ProjectFolder,
  ProjectSummary,
  StageAnnotation,
  Workspace,
} from "@/lib/types";

interface ChoreoContextValue {
  state: ChoreoState;
  language: ProjectLanguage;
  strings: UiStrings;
  totalSlots: number;
  toast: string | null;
  draggingMemberId: number | null;
  selectedMemberId: number | null;
  selectMember: (memberId: number | null) => void;
  beatIntervalSec: number;
  currentBeatSec: number;
  displayCount: number;
  setSongTitle: (v: string) => void;
  setBpm: (bpm: number) => void;
  setBamiriHalfWidth: (v: number) => void;
  setBamiriDepth: (v: number) => void;
  setStageScaleW: (v: number) => void;
  setStageScaleH: (v: number) => void;
  setMemberDotPx: (px: number) => void;
  resetMemberDotPx: () => void;
  memberDotPx: number;
  setMemberCount: (n: number) => void;
  renameMember: (memberId: number, name: string) => void;
  deleteMember: (memberId: number) => void;
  hideMemberFromCurrentCount: (memberId: number) => void;
  restoreMember: (memberId: number) => void;
  toggleMemberVisibility: (memberId: number) => void;
  isMemberVisibleOnCurrent: (memberId: number) => boolean;
  renameSectionName: (sectionId: string, name: string) => void;
  insertHalfAfter: (sectionId: string, afterSlotIndex: number) => void;
  removeHalfAt: (sectionId: string, slotIndex: number) => void;
  removeCountAt: (sectionId: string, slotIndex: number) => void;
  removeCurrentCount: () => boolean;
  addSection: (name?: string) => void;
  deleteSection: (sectionId: string) => void;
  addCountToSection: (sectionId: string) => void;
  moveSection: (sectionId: string, delta: -1 | 1) => void;
  swapSections: (sectionIdA: string, sectionIdB: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  navigateTo: (count: number) => void;
  prevCount: () => void;
  nextCount: () => void;
  togglePlayback: () => void;
  stopPlayback: () => void;
  undo: () => void;
  canUndo: boolean;
  pushUndoHistory: () => void;
  copyFormation: () => void;
  pasteFormation: () => void;
  hasClipboard: boolean;
  updateMemberPosition: (memberId: number, x: number, y: number) => void;
  setDraggingMemberId: (id: number | null) => void;
  getMemberPos: (memberId: number) => Position;
  addStageAnnotation: (annotation: StageAnnotation) => void;
  updateStageAnnotation: (id: string, next: StageAnnotation) => void;
  removeStageAnnotation: (id: string) => void;
  clearStageAnnotations: () => void;
  selectedAnnotationId: string | null;
  setSelectedAnnotationId: (id: string | null) => void;
  selectAnnotation: (id: string | null) => void;
  projects: ProjectSummary[];
  folders: ProjectFolder[];
  activeProjectId: string;
  hasActiveProject: boolean;
  switchProject: (projectId: string) => void;
  createProject: (params: CreateProjectInput) => void;
  deleteProject: (projectId: string) => void;
  renameProject: (projectId: string, songTitle: string) => void;
  reorderProjects: (fromIndex: number, toIndex: number) => void;
  createFolder: (name: string) => void;
  renameFolder: (folderId: string, name: string) => void;
  deleteFolder: (folderId: string) => void;
  toggleFolderCollapsed: (folderId: string) => void;
  toggleFolderBookmark: (folderId: string) => void;
  setProjectFolder: (projectId: string, folderId: string | null) => void;
  toggleProjectBookmark: (projectId: string) => void;
  appMode: AppMode;
  isViewOnly: boolean;
  /** 共有 URL から開いた閲覧（編集に戻れない） */
  externalShareView: boolean;
  canExitViewMode: boolean;
  media: ProjectMedia;
  addMusicLink: (input: string, html?: string) => Promise<boolean>;
  setMusicTrackName: (trackId: string, name: string) => void;
  removeMusicTrack: (trackId: string) => Promise<void>;
  getMusicFileUrl: (trackId: string) => Promise<string | null>;
  addReferenceVideo: (file: File) => Promise<void>;
  addReferenceVideoLink: (url: string) => void;
  setReferenceVideoName: (videoId: string, name: string) => void;
  setReferenceVideoMessage: (videoId: string, message: string) => void;
  removeReferenceVideo: (videoId: string) => Promise<void>;
  getVideoUrl: (videoId: string) => Promise<string | null>;
  copyShareLink: () => Promise<void>;
  createShareUrl: (projectId?: string) => Promise<string | null>;
  enterViewPreview: (projectId?: string) => void;
  exitViewMode: () => void;
  shareDialogOpen: boolean;
  openShareDialog: () => void;
  closeShareDialog: () => void;
}

const ChoreoContext = createContext<ChoreoContextValue | null>(null);

const MAX_UNDO = 50;

function persistWorkspace(
  workspace: Workspace,
  activeProjectId: string,
  state: ChoreoState,
  media?: ProjectMedia,
): boolean {
  return saveWorkspace(patchActiveProject(workspace, activeProjectId, state, media));
}

function cloneChoreoState(state: ChoreoState): ChoreoState {
  return JSON.parse(JSON.stringify(state)) as ChoreoState;
}

export function ChoreoProvider({ children }: { children: ReactNode }) {
  const { language: profileLanguage, plan } = useProfile();
  const { authReady, user } = useAuth();
  const [state, setState] = useState<ChoreoState>(createInitialState);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [activeProjectId, setActiveProjectId] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [draggingMemberId, setDraggingMemberId] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<FormationClipboard | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [bootingLabel, setBootingLabel] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>("edit");
  const [externalShareView, setExternalShareView] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [media, setMedia] = useState<ProjectMedia>(emptyProjectMedia());

  const stateRef = useRef(state);
  const undoStackRef = useRef<ChoreoState[]>([]);
  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackAnchorRef = useRef<number | null>(null);
  const playbackPhaseRef = useRef<number>(0);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workspaceRef = useRef<Workspace | null>(null);
  const mediaRef = useRef(media);
  const activeProjectIdRef = useRef(activeProjectId);
  const appModeRef = useRef(appMode);
  const profileLanguageRef = useRef(profileLanguage);
  const userIdRef = useRef<string | null>(null);
  const cloudSyncedUserRef = useRef<string | null>(null);
  profileLanguageRef.current = profileLanguage;
  userIdRef.current = user?.id ?? null;
  const externalShareViewRef = useRef(externalShareView);
  stateRef.current = state;
  workspaceRef.current = workspace;
  mediaRef.current = media;
  activeProjectIdRef.current = activeProjectId;
  appModeRef.current = appMode;
  externalShareViewRef.current = externalShareView;

  const syncWorkspaceToCloud = useCallback((workspace: Workspace) => {
    const uid = userIdRef.current;
    if (uid) scheduleCloudWorkspacePush(uid, workspace);
  }, []);

  const commitActiveProject = useCallback(
    (nextState: ChoreoState, nextMedia: ProjectMedia) => {
      const ws = workspaceRef.current;
      const projectId = activeProjectIdRef.current;
      if (!ws || !projectId || appModeRef.current === "view") return false;
      const nextWs = patchActiveProject(ws, projectId, nextState, nextMedia);
      workspaceRef.current = nextWs;
      const ok = saveWorkspace(nextWs);
      syncWorkspaceToCloud(nextWs);
      setWorkspace(nextWs);
      return ok;
    },
    [syncWorkspaceToCloud],
  );

  const projects = useMemo((): ProjectSummary[] => {
    if (!workspace) return [];
    return workspace.projects.map((p) => {
      const base = projectToSummary(p);
      if (p.id !== activeProjectId) return base;
      const m = normalizeProjectMedia(media);
      return {
        ...base,
        songTitle: state.songTitle,
        bpm: state.bpm,
        audioCount: m.audioTracks.length,
        videoCount: m.referenceVideos.length,
      };
    });
  }, [workspace, activeProjectId, state.songTitle, state.bpm, media]);

  const folders = useMemo(
    (): ProjectFolder[] => workspace?.folders ?? [],
    [workspace],
  );

  const hasActiveProject = useMemo(
    () => (workspace ? workspaceHasActiveProject(workspace) : false),
    [workspace],
  );

  const language = profileLanguage;
  const strings = useMemo(() => getStrings(profileLanguage), [profileLanguage]);

  useEffect(() => {
    document.documentElement.lang = profileLanguage;
  }, [profileLanguage]);

  const totalSlots = getTotalSlots(state.sections);
  const memberDotPx = useMemo(
    () => resolveMemberDotPx(state.stage, state.members.length),
    [state.stage, state.members.length],
  );
  const beatIntervalSec = beatIntervalMs(state.bpm) / 1000;
  const playbackPhases = useMemo(
    () => buildPlaybackPhases(state.sections, state.bpm),
    [state.sections, state.bpm],
  );
  const playbackTiming = useMemo(() => {
    if (!state.isPlaying) {
      return {
        animationSec: beatIntervalSec,
        targetCount: state.currentCount,
      };
    }
    const phase = playbackPhases.find(
      (p) => p.globalIndex === state.currentCount,
    );
    if (!phase) {
      return {
        animationSec: beatIntervalSec,
        targetCount: state.currentCount,
      };
    }
    return {
      animationSec: phase.animationSec,
      targetCount: phase.posCount,
    };
  }, [
    state.isPlaying,
    state.currentCount,
    playbackPhases,
    beatIntervalSec,
  ]);
  const currentBeatSec = playbackTiming.animationSec;
  const playbackPosCount = state.isPlaying
    ? playbackTiming.targetCount
    : state.currentCount;

  useEffect(() => {
    setBootingLabel(getStrings(detectBrowserLanguage()).booting);
  }, []);

  useEffect(() => {
    if (!hydrated || !activeProjectId || appMode === "view") return;
    if (!workspaceRef.current) return;
    commitActiveProject(state, mediaRef.current);
  }, [state, hydrated, activeProjectId, appMode, commitActiveProject]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const clearUndoHistory = useCallback(() => {
    undoStackRef.current = [];
    setCanUndo(false);
  }, []);

  const pushUndoHistory = useCallback(() => {
    undoStackRef.current.push(cloneChoreoState(stateRef.current));
    if (undoStackRef.current.length > MAX_UNDO) {
      undoStackRef.current.shift();
    }
    setCanUndo(true);
  }, []);

  const mutateState = useCallback(
    (updater: (s: ChoreoState) => ChoreoState, recordHistory = true) => {
      if (appModeRef.current === "view") return;
      if (recordHistory) pushUndoHistory();
      setState(updater);
    },
    [pushUndoHistory],
  );

  const mutateMedia = useCallback(
    (updater: (m: ProjectMedia) => ProjectMedia) => {
      if (appModeRef.current === "view") return;
      let nextMedia: ProjectMedia | null = null;
      setMedia((prev) => {
        nextMedia = updater(prev);
        mediaRef.current = nextMedia;
        return nextMedia;
      });
      if (nextMedia) {
        commitActiveProject(stateRef.current, nextMedia);
      }
    },
    [commitActiveProject],
  );

  const clearPlaybackTimer = useCallback(() => {
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  }, []);

  const stopPlayback = useCallback(() => {
    clearPlaybackTimer();
    playbackAnchorRef.current = null;
    playbackPhaseRef.current = 0;
    setState((s) => (s.isPlaying ? { ...s, isPlaying: false } : s));
  }, [clearPlaybackTimer]);

  const undo = useCallback(() => {
    const stack = undoStackRef.current;
    if (!stack.length) return;
    stopPlayback();
    const prev = stack.pop()!;
    setCanUndo(stack.length > 0);
    setState(prev);
    showToast(getStrings(profileLanguageRef.current).undoDone);
  }, [stopPlayback, showToast]);

  const applyWorkspace = useCallback(
    (ws: Workspace) => {
      workspaceRef.current = ws;
      setWorkspace(ws);
      setAppMode("edit");
      setExternalShareView(false);

      if (!workspaceHasActiveProject(ws)) {
        setActiveProjectId("");
        setState(createBlankEditorState(profileLanguageRef.current));
        setMedia(emptyProjectMedia());
        clearUndoHistory();
        return;
      }

      const active =
        ws.projects.find((project) => project.id === ws.activeProjectId) ??
        ws.projects[0];
      setActiveProjectId(active.id);
      setState(normalizeChoreoState({ ...active.state, isPlaying: false }));
      setMedia(normalizeProjectMedia(active.media));
      clearUndoHistory();
    },
    [clearUndoHistory],
  );

  const applyWorkspaceRef = useRef(applyWorkspace);
  applyWorkspaceRef.current = applyWorkspace;

  useEffect(() => {
    let cancelled = false;

    function applyLoadedWorkspace(loaded: ReturnType<typeof loadWorkspace>) {
      applyWorkspace(loaded.workspace);
    }

    function initFromLocalStorage() {
      applyLoadedWorkspace(loadWorkspace());
    }

    void (async () => {
      try {
        const { viewOnly, shareId, legacyToken } = parseShareFromLocation(
          window.location.search,
        );

        if (shareId && isShareId(shareId)) {
          const bundle = await hydrateRemoteShare(shareId);
          if (cancelled) return;
          if (!bundle) {
            showToast(getStrings(profileLanguageRef.current).shareLoadFailed);
            initFromLocalStorage();
            return;
          }
          const applied = applySharedViewBundle(
            { state: bundle.state, media: bundle.media },
            viewOnly,
          );
          workspaceRef.current = applied.workspace;
          setWorkspace(applied.workspace);
          setActiveProjectId(SHARED_VIEW_PROJECT_ID);
          setAppMode(applied.appMode);
          setExternalShareView(viewOnly);
          setState(applied.state);
          setMedia(applied.media);
          clearUndoHistory();
          return;
        }

        if (legacyToken) {
          const legacy = decodeLegacyShareToken(legacyToken);
          if (legacy) {
            const applied = applySharedViewBundle(legacy, viewOnly);
            workspaceRef.current = applied.workspace;
            setWorkspace(applied.workspace);
            setActiveProjectId(SHARED_VIEW_PROJECT_ID);
            setAppMode(applied.appMode);
            setExternalShareView(viewOnly);
            setState(applied.state);
            setMedia(applied.media);
            clearUndoHistory();
            return;
          }
        }

        initFromLocalStorage();
      } catch {
        if (!cancelled) initFromLocalStorage();
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyWorkspace, clearUndoHistory, showToast]);

  useEffect(() => {
    if (!user) cloudSyncedUserRef.current = null;
  }, [user]);

  useEffect(() => {
    if (!authReady || !hydrated || !user) return;
    if (appModeRef.current === "view" || externalShareViewRef.current) return;
    if (cloudSyncedUserRef.current === user.id) return;

    const userId = user.id;
    const userEmail = user.email ?? "";
    let cancelled = false;
    cloudSyncedUserRef.current = userId;

    void (async () => {
      const local = workspaceRef.current;
      const cloud = await fetchCloudWorkspace(userId);
      if (cancelled) return;

      const resolution = resolveUserWorkspace(userEmail, local, cloud);
      if (!resolution) return;

      const { kind, workspace: resolved } = resolution;
      const apply = applyWorkspaceRef.current;

      if (kind === "cloud") {
        apply(resolved);
        saveWorkspace(resolved);
        return;
      }

      apply(resolved);
      saveWorkspace(resolved);

      if (kind === "local") {
        await pushCloudWorkspace(userId, resolved);
        return;
      }

      await pushCloudWorkspace(userId, resolved);
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, hydrated, user?.id, user?.email]);

  useEffect(() => {
    return () => {
      void flushCloudWorkspacePush();
    };
  }, []);

  const scheduleNextPhase = useCallback(() => {
    clearPlaybackTimer();
    const s = stateRef.current;
    if (!s.isPlaying) return;

    const phases = buildPlaybackPhases(s.sections, s.bpm);
    if (!phases.length) return;

    if (playbackPhaseRef.current < 0 || playbackPhaseRef.current >= phases.length) {
      playbackPhaseRef.current = findFirstPhaseForGlobal(
        phases,
        s.currentCount,
      );
    }

    if (playbackAnchorRef.current === null) {
      playbackAnchorRef.current =
        performance.now() -
        getElapsedMsBeforePhase(phases, playbackPhaseRef.current);
    }

    const phase = phases[playbackPhaseRef.current];
    setState((prev) =>
      prev.currentCount === phase.globalIndex
        ? prev
        : { ...prev, currentCount: phase.globalIndex },
    );

    const target =
      playbackAnchorRef.current +
      getElapsedMsThroughPhase(phases, playbackPhaseRef.current);
    const delay = Math.max(0, target - performance.now());

    playbackTimerRef.current = setTimeout(() => {
      const cur = stateRef.current;
      if (!cur.isPlaying) return;
      const nextPhases = buildPlaybackPhases(cur.sections, cur.bpm);
      if (!nextPhases.length) return;

      const nextPhaseIndex =
        playbackPhaseRef.current + 1 >= nextPhases.length
          ? 0
          : playbackPhaseRef.current + 1;

      if (nextPhaseIndex === 0) {
        playbackAnchorRef.current = performance.now();
      }

      playbackPhaseRef.current = nextPhaseIndex;
      const nextPhase = nextPhases[nextPhaseIndex];
      setState((prev) => ({ ...prev, currentCount: nextPhase.globalIndex }));
      scheduleNextPhase();
    }, delay);
  }, [clearPlaybackTimer]);

  const startPlaybackLoop = useCallback(() => {
    scheduleNextPhase();
  }, [scheduleNextPhase]);

  const togglePlayback = useCallback(() => {
    if (stateRef.current.isPlaying) {
      stopPlayback();
    } else {
      setState((s) => ({ ...s, isPlaying: true }));
    }
  }, [stopPlayback, showToast]);

  useEffect(() => {
    if (!state.isPlaying) {
      clearPlaybackTimer();
      playbackAnchorRef.current = null;
      playbackPhaseRef.current = 0;
      return;
    }
    playbackPhaseRef.current = findFirstPhaseForGlobal(
      buildPlaybackPhases(state.sections, state.bpm),
      state.currentCount,
    );
    playbackAnchorRef.current =
      performance.now() -
      getElapsedMsBeforePhase(
        buildPlaybackPhases(state.sections, state.bpm),
        playbackPhaseRef.current,
      );
    startPlaybackLoop();
    return clearPlaybackTimer;
  }, [state.isPlaying, state.bpm, state.sections, startPlaybackLoop, clearPlaybackTimer]);

  useEffect(() => {
    return () => clearPlaybackTimer();
  }, [clearPlaybackTimer]);

  const restartPlaybackAt = useCallback(
    (globalIndex: number) => {
      const s = stateRef.current;
      if (!s.isPlaying) return;
      clearPlaybackTimer();
      const phases = buildPlaybackPhases(s.sections, s.bpm);
      playbackPhaseRef.current = findFirstPhaseForGlobal(phases, globalIndex);
      playbackAnchorRef.current =
        performance.now() -
        getElapsedMsBeforePhase(phases, playbackPhaseRef.current);
      scheduleNextPhase();
    },
    [clearPlaybackTimer, scheduleNextPhase],
  );

  const navigateTo = useCallback(
    (count: number) => {
      const s = stateRef.current;
      const total = getTotalSlots(s.sections);
      const next = Math.max(1, Math.min(total, count));
      if (next === s.currentCount) return;
      setState((prev) => ({ ...prev, currentCount: next }));
      if (s.isPlaying) restartPlaybackAt(next);
    },
    [restartPlaybackAt],
  );

  const prevCount = useCallback(() => {
    const s = stateRef.current;
    if (s.currentCount <= 1) return;
    const next = s.currentCount - 1;
    setState((prev) => ({ ...prev, currentCount: next }));
    if (s.isPlaying) restartPlaybackAt(next);
  }, [restartPlaybackAt]);

  const nextCount = useCallback(() => {
    const s = stateRef.current;
    const total = getTotalSlots(s.sections);
    if (s.currentCount >= total) return;
    const next = s.currentCount + 1;
    setState((prev) => ({ ...prev, currentCount: next }));
    if (s.isPlaying) restartPlaybackAt(next);
  }, [restartPlaybackAt]);

  const switchProject = useCallback(
    (projectId: string) => {
      if (appModeRef.current === "view") return;
      if (projectId === activeProjectId) return;
      const ws = workspaceRef.current;
      if (!ws) return;
      stopPlayback();
      const saved = patchActiveProject(
        ws,
        activeProjectId,
        stateRef.current,
        mediaRef.current,
      );
      const nextState = getActiveState(
        { ...saved, activeProjectId: projectId },
        projectId,
      );
      if (!nextState) return;
      const nextWs = { ...saved, activeProjectId: projectId };
      workspaceRef.current = nextWs;
      saveWorkspace(nextWs);
      syncWorkspaceToCloud(nextWs);
      setWorkspace(nextWs);
      setActiveProjectId(projectId);
      setState(nextState);
      setMedia(normalizeProjectMedia(getActiveMedia(nextWs, projectId)));
      setSelectedMemberId(null);
      clearUndoHistory();
    },
    [activeProjectId, stopPlayback, clearUndoHistory, syncWorkspaceToCloud],
  );

  const createProject = useCallback(
    (params: CreateProjectInput) => {
      if (appModeRef.current === "view") return;
      const ws = workspaceRef.current;
      if (!ws) return;
      if (!canCreateProject(ws.projects.length, plan)) {
        showToast(getStrings(profileLanguageRef.current).upgradeTitle);
        return;
      }
      stopPlayback();
      const saved =
        workspaceHasActiveProject(ws) && activeProjectId
          ? patchActiveProject(
              ws,
              activeProjectId,
              stateRef.current,
              mediaRef.current,
            )
          : ws;
      const { workspace: nextWs, record } = addProject(saved, {
        ...params,
        language: profileLanguageRef.current,
      });
      workspaceRef.current = nextWs;
      saveWorkspace(nextWs);
      syncWorkspaceToCloud(nextWs);
      setWorkspace(nextWs);
      setActiveProjectId(record.id);
      setState(record.state);
      setMedia(normalizeProjectMedia(record.media));
      setSelectedMemberId(null);
      clearUndoHistory();
      showToast(getStrings(profileLanguageRef.current).createdProject(record.state.songTitle));
    },
    [activeProjectId, stopPlayback, showToast, clearUndoHistory, syncWorkspaceToCloud, plan],
  );

  const reorderProjects = useCallback((fromIndex: number, toIndex: number) => {
    if (appModeRef.current === "view") return;
    const ws = workspaceRef.current;
    if (!ws) return;
    const nextWs = reorderWorkspaceProjects(ws, fromIndex, toIndex);
    if (nextWs === ws) return;
    workspaceRef.current = nextWs;
    saveWorkspace(nextWs);
    syncWorkspaceToCloud(nextWs);
    setWorkspace(nextWs);
  }, [syncWorkspaceToCloud]);

  const persistOrganizeChange = useCallback(
    (nextWs: Workspace) => {
      if (appModeRef.current === "view") return;
      workspaceRef.current = nextWs;
      saveWorkspace(nextWs);
      syncWorkspaceToCloud(nextWs);
      setWorkspace(nextWs);
    },
    [syncWorkspaceToCloud],
  );

  const createFolderInWorkspace = useCallback(
    (name: string) => {
      const ws = workspaceRef.current;
      if (!ws) return;
      persistOrganizeChange(createFolder(ws, name));
    },
    [persistOrganizeChange],
  );

  const renameFolderInWorkspace = useCallback(
    (folderId: string, name: string) => {
      const ws = workspaceRef.current;
      if (!ws) return;
      persistOrganizeChange(renameFolder(ws, folderId, name));
    },
    [persistOrganizeChange],
  );

  const deleteFolderInWorkspace = useCallback(
    (folderId: string) => {
      const ws = workspaceRef.current;
      if (!ws) return;
      persistOrganizeChange(deleteFolder(ws, folderId));
    },
    [persistOrganizeChange],
  );

  const toggleFolderCollapsedInWorkspace = useCallback(
    (folderId: string) => {
      const ws = workspaceRef.current;
      if (!ws) return;
      persistOrganizeChange(toggleFolderCollapsed(ws, folderId));
    },
    [persistOrganizeChange],
  );

  const toggleFolderBookmarkInWorkspace = useCallback(
    (folderId: string) => {
      const ws = workspaceRef.current;
      if (!ws) return;
      persistOrganizeChange(toggleFolderBookmark(ws, folderId));
    },
    [persistOrganizeChange],
  );

  const setProjectFolderInWorkspace = useCallback(
    (projectId: string, folderId: string | null) => {
      const ws = workspaceRef.current;
      if (!ws) return;
      persistOrganizeChange(setProjectFolder(ws, projectId, folderId));
    },
    [persistOrganizeChange],
  );

  const toggleProjectBookmarkInWorkspace = useCallback(
    (projectId: string) => {
      const ws = workspaceRef.current;
      if (!ws) return;
      persistOrganizeChange(toggleProjectBookmark(ws, projectId));
    },
    [persistOrganizeChange],
  );

  const renameProject = useCallback(
    (projectId: string, songTitle: string) => {
      if (appModeRef.current === "view") return;
      const nextTitle = songTitle.trim();
      if (!nextTitle) return;
      const ws = workspaceRef.current;
      if (!ws) return;
      const saved =
        workspaceHasActiveProject(ws) && activeProjectId
          ? patchActiveProject(
              ws,
              activeProjectId,
              stateRef.current,
              mediaRef.current,
            )
          : ws;
      const nextWs = renameProjectTitle(saved, projectId, nextTitle);
      if (nextWs === saved) return;
      workspaceRef.current = nextWs;
      saveWorkspace(nextWs);
      syncWorkspaceToCloud(nextWs);
      setWorkspace(nextWs);
      if (projectId === activeProjectId) {
        setState((prev) => ({ ...prev, songTitle: nextTitle }));
      }
    },
    [activeProjectId, syncWorkspaceToCloud],
  );

  const deleteProject = useCallback(
    (projectId: string) => {
      if (appModeRef.current === "view") return;
      const ws = workspaceRef.current;
      if (!ws) return;
      stopPlayback();
      const saved =
        workspaceHasActiveProject(ws) && activeProjectId
          ? patchActiveProject(
              ws,
              activeProjectId,
              stateRef.current,
              mediaRef.current,
            )
          : ws;
      const nextWs = removeProject(saved, projectId);
      if (!nextWs) return;
      void deleteProjectMedia(projectId);
      workspaceRef.current = nextWs;
      saveWorkspace(nextWs);
      syncWorkspaceToCloud(nextWs);
      setWorkspace(nextWs);
      if (activeProjectId === projectId) {
        if (workspaceHasActiveProject(nextWs)) {
          setActiveProjectId(nextWs.activeProjectId);
          const nextState = getActiveState(nextWs, nextWs.activeProjectId);
          if (nextState) {
            setState(nextState);
            setMedia(normalizeProjectMedia(getActiveMedia(nextWs, nextWs.activeProjectId)));
          }
        } else {
          setActiveProjectId("");
          setState(createBlankEditorState(profileLanguageRef.current));
          setMedia(emptyProjectMedia());
        }
        setSelectedMemberId(null);
      }
      clearUndoHistory();
      showToast(getStrings(profileLanguageRef.current).projectDeleted);
    },
    [activeProjectId, stopPlayback, showToast, clearUndoHistory, syncWorkspaceToCloud],
  );

  const copyFormation = useCallback(() => {
    stopPlayback();
    const s = stateRef.current;
    setClipboard(snapshotFormation(s.currentCount, s.countData, s.members));
    showToast(getStrings(profileLanguageRef.current).copied);
  }, [stopPlayback, showToast]);

  const pasteFormation = useCallback(() => {
    stopPlayback();
    mutateState((s) => {
      if (!clipboard) return s;
      const countData = { ...s.countData };
      const existing = countData[s.currentCount];
      countData[s.currentCount] = {
        positions: JSON.parse(JSON.stringify(clipboard.positions)),
        memo: existing?.memo ?? "",
        ...(existing?.hidden !== undefined ? { hidden: existing.hidden } : {}),
        ...(existing?.shown !== undefined ? { shown: existing.shown } : {}),
        ...(existing?.annotations !== undefined
          ? { annotations: existing.annotations }
          : {}),
      };
      return { ...s, countData };
    });
    showToast(getStrings(profileLanguageRef.current).pasted);
  }, [stopPlayback, clipboard, showToast, mutateState]);

  const updateMemberPosition = useCallback(
    (memberId: number, x: number, y: number) => {
      mutateState((s) => {
        const pos = clampStagePos(x, y);
        const countData = { ...s.countData };
        const cd = { ...getCountData(countData, s.currentCount) };
        cd.positions = { ...cd.positions, [memberId]: pos };
        countData[s.currentCount] = cd;
        return { ...s, countData };
      }, false);
    },
    [mutateState],
  );

  const addStageAnnotation = useCallback(
    (annotation: StageAnnotation) => {
      mutateState((s) => {
        const countData = { ...s.countData };
        const cd = { ...getCountData(countData, s.currentCount) };
        cd.annotations = [...(cd.annotations ?? []), annotation];
        countData[s.currentCount] = cd;
        return { ...s, countData };
      });
    },
    [mutateState],
  );

  const updateStageAnnotation = useCallback(
    (id: string, next: StageAnnotation) => {
      mutateState((s) => {
        const countData = { ...s.countData };
        const cd = { ...getCountData(countData, s.currentCount) };
        if (!cd.annotations?.some((a) => a.id === id)) return s;
        cd.annotations = cd.annotations.map((a) => (a.id === id ? next : a));
        countData[s.currentCount] = cd;
        return { ...s, countData };
      }, false);
    },
    [mutateState],
  );

  const clearStageAnnotations = useCallback(() => {
    mutateState((s) => {
      const countData = { ...s.countData };
      const cd = { ...getCountData(countData, s.currentCount) };
      if (!cd.annotations?.length) return s;
      cd.annotations = [];
      countData[s.currentCount] = cd;
      return { ...s, countData };
    });
  }, [mutateState]);

  const removeStageAnnotation = useCallback(
    (id: string) => {
      mutateState((s) => {
        const countData = { ...s.countData };
        const cd = { ...getCountData(countData, s.currentCount) };
        if (!cd.annotations?.length) return s;
        cd.annotations = cd.annotations.filter((a) => a.id !== id);
        countData[s.currentCount] = cd;
        return { ...s, countData };
      });
      setSelectedAnnotationId((cur) => (cur === id ? null : cur));
    },
    [mutateState],
  );

  const setMemberCount = useCallback((n: number) => {
    mutateState((s) => applyMemberCount(s, n));
  }, [mutateState]);

  const renameMember = useCallback((memberId: number, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    mutateState((s) => ({
      ...s,
      members: s.members.map((m) =>
        m.id === memberId ? { ...m, name: trimmed } : m,
      ),
      removedMembers: s.removedMembers.map((m) =>
        m.id === memberId ? { ...m, name: trimmed } : m,
      ),
    }));
  }, [mutateState]);

  const selectMember = useCallback((memberId: number | null) => {
    setSelectedMemberId(memberId);
    if (memberId !== null) setSelectedAnnotationId(null);
  }, []);

  const selectAnnotation = useCallback((id: string | null) => {
    setSelectedAnnotationId(id);
    if (id !== null) setSelectedMemberId(null);
  }, []);

  const deleteMember = useCallback(
    (memberId: number) => {
      const name =
        stateRef.current.members.find((m) => m.id === memberId)?.name ??
        getStrings(profileLanguageRef.current).memberFallback;
      mutateState((s) => {
        const member = s.members.find((m) => m.id === memberId);
        if (!member) return s;
        return {
          ...s,
          members: s.members.filter((m) => m.id !== memberId),
          removedMembers: [...s.removedMembers, member],
        };
      });
      setSelectedMemberId((id) => (id === memberId ? null : id));
      showToast(getStrings(profileLanguageRef.current).memberRemoved(name));
    },
    [mutateState, showToast],
  );

  const restoreMember = useCallback(
    (memberId: number) => {
      mutateState((s) => {
        const member = s.removedMembers.find((m) => m.id === memberId);
        if (!member) return s;
        const members = [...s.members, member].sort((a, b) => a.id - b.id);
        return {
          ...s,
          members,
          removedMembers: s.removedMembers.filter((m) => m.id !== memberId),
        };
      });
      showToast(getStrings(profileLanguageRef.current).memberRestored);
    },
    [mutateState, showToast],
  );

  const hideMemberFromCurrentCount = useCallback(
    (memberId: number) => {
      mutateState((s) => {
        if (getHiddenMembers(s.currentCount, s.countData).includes(memberId)) {
          return s;
        }
        return {
          ...s,
          countData: setMemberHiddenAtCount(
            s.countData,
            s.currentCount,
            memberId,
            true,
          ),
        };
      });
      setSelectedMemberId((id) => (id === memberId ? null : id));
    },
    [mutateState],
  );

  const toggleMemberVisibility = useCallback((memberId: number) => {
    mutateState((s) => {
      const isHidden = getHiddenMembers(
        s.currentCount,
        s.countData,
      ).includes(memberId);
      return {
        ...s,
        countData: setMemberHiddenAtCount(
          s.countData,
          s.currentCount,
          memberId,
          !isHidden,
        ),
      };
    });
  }, [mutateState]);

  const isMemberVisibleOnCurrent = useCallback(
    (memberId: number) =>
      isMemberVisible(
        memberId,
        state.isPlaying ? playbackPosCount : state.currentCount,
        state.countData,
      ),
    [state.isPlaying, state.currentCount, state.countData, playbackPosCount],
  );

  const renameSectionName = useCallback((sectionId: string, name: string) => {
    mutateState((s) => ({
      ...s,
      sections: renameSection(s.sections, sectionId, name),
    }));
  }, [mutateState]);

  const insertHalfAfter = useCallback(
    (sectionId: string, afterSlotIndex: number) => {
      mutateState((s) => {
        const insertAt =
          slotGlobalIndex(s.sections, sectionId, afterSlotIndex) + 1;
        let currentCount = s.currentCount;
        if (currentCount >= insertAt) currentCount += 1;
        return {
          ...s,
          sections: insertHalfSlot(s.sections, sectionId, afterSlotIndex),
          countData: shiftCountDataInsert(s.countData, insertAt),
          currentCount,
        };
      });
    },
    [mutateState],
  );

  const removeCountAt = useCallback(
    (sectionId: string, slotIndex: number) => {
      mutateState((s) => {
        const sec = s.sections.find((x) => x.id === sectionId);
        if (!sec || sec.slots.length <= 1) return s;
        const removeAt = slotGlobalIndex(s.sections, sectionId, slotIndex);
        const sections = removeSlotAt(s.sections, sectionId, slotIndex);
        if (!sections) return s;
        let currentCount = s.currentCount;
        if (currentCount === removeAt) {
          currentCount = Math.max(1, removeAt - 1);
        } else if (currentCount > removeAt) {
          currentCount -= 1;
        }
        return {
          ...s,
          sections,
          countData: shiftCountDataRemove(s.countData, removeAt),
          currentCount,
        };
      });
    },
    [mutateState],
  );

  const removeHalfAt = useCallback(
    (sectionId: string, slotIndex: number) => {
      removeCountAt(sectionId, slotIndex);
    },
    [removeCountAt],
  );

  const removeCurrentCount = useCallback((): boolean => {
    const s = stateRef.current;
    const flat = getFlatSlot(s.sections, s.currentCount);
    if (!flat) return false;
    const sec = s.sections.find((x) => x.id === flat.sectionId);
    if (!sec || sec.slots.length <= 1) return false;
    if (
      countHasData(s.countData[s.currentCount]) &&
      !window.confirm(getStrings(profileLanguageRef.current).deleteCountConfirm(flat.label))
    ) {
      return false;
    }
    removeCountAt(flat.sectionId, flat.slotIndex);
    return true;
  }, [removeCountAt]);

  const addSection = useCallback(
    (name?: string) => {
      stopPlayback();
      mutateState((s) => {
        const firstNew = getTotalSlots(s.sections) + 1;
        const sections = appendSection(s.sections, name, s.language);
        return { ...s, sections, currentCount: firstNew };
      });
    },
    [stopPlayback, mutateState],
  );

  const deleteSection = useCallback(
    (sectionId: string) => {
      stopPlayback();
      mutateState((s) => {
        const sections = removeSection(s.sections, sectionId);
        if (!sections) return s;
        return {
          ...s,
          sections,
          countData: remapCountDataBySlots(s.sections, sections, s.countData),
          currentCount: remapCurrentCount(
            s.sections,
            sections,
            s.currentCount,
            sectionId,
          ),
        };
      });
      showToast(getStrings(profileLanguageRef.current).sectionDeletedToast);
    },
    [stopPlayback, mutateState, showToast],
  );

  const addCountToSection = useCallback(
    (sectionId: string) => {
      mutateState((s) => {
        const sec = s.sections.find((x) => x.id === sectionId);
        if (!sec) return s;
        const fullCount = sec.slots.filter((sl) => sl.type === "count").length;
        if (fullCount >= MAX_COUNTS_PER_SECTION) return s;
        const sections = appendCountToSection(
          s.sections,
          sectionId,
          MAX_COUNTS_PER_SECTION,
        );
        const newFlat = flattenTimeline(sections);
        const added = newFlat.find(
          (f) =>
            f.sectionId === sectionId &&
            f.slotIndex === sec.slots.length,
        );
        return {
          ...s,
          sections,
          countData: remapCountDataBySlots(s.sections, sections, s.countData),
          currentCount: added?.globalIndex ?? s.currentCount,
        };
      });
    },
    [mutateState],
  );

  const moveSection = useCallback(
    (sectionId: string, delta: -1 | 1) => {
      stopPlayback();
      mutateState((s) => {
        const sections = moveSectionOrder(s.sections, sectionId, delta);
        if (sections === s.sections) return s;
        return {
          ...s,
          sections,
          countData: remapCountDataBySlots(s.sections, sections, s.countData),
          currentCount: remapCurrentCount(
            s.sections,
            sections,
            s.currentCount,
          ),
        };
      });
      showToast(delta === -1 ? getStrings(profileLanguageRef.current).sectionMovedLeft : getStrings(profileLanguageRef.current).sectionMovedRight);
    },
    [stopPlayback, mutateState, showToast],
  );

  const swapSections = useCallback(
    (sectionIdA: string, sectionIdB: string) => {
      if (sectionIdA === sectionIdB) return;
      stopPlayback();
      mutateState((s) => {
        const sections = swapSectionsOrder(s.sections, sectionIdA, sectionIdB);
        if (sections === s.sections) return s;
        return {
          ...s,
          sections,
          countData: remapCountDataBySlots(s.sections, sections, s.countData),
          currentCount: remapCurrentCount(
            s.sections,
            sections,
            s.currentCount,
          ),
        };
      });
      showToast(getStrings(profileLanguageRef.current).sectionsSwapped);
    },
    [stopPlayback, mutateState, showToast],
  );

  const reorderSections = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      stopPlayback();
      mutateState((s) => {
        const sections = reorderSectionsOrder(s.sections, fromIndex, toIndex);
        if (sections === s.sections) return s;
        return {
          ...s,
          sections,
          countData: remapCountDataBySlots(s.sections, sections, s.countData),
          currentCount: remapCurrentCount(
            s.sections,
            sections,
            s.currentCount,
          ),
        };
      });
      showToast(getStrings(profileLanguageRef.current).sectionReordered);
    },
    [stopPlayback, mutateState, showToast],
  );

  const addMusicLink = useCallback(
    async (input: string, html?: string) => {
      const parsed = coerceMusicLink(input, html);
      if (!parsed) {
        showToast(getStrings(profileLanguageRef.current).musicLinkInvalid);
        return false;
      }

      const resolved = await resolveMusicLink(input, html, parsed);
      const id = newMediaId();
      mutateMedia((m) => ({
        ...m,
        audioTracks: [
          ...(m.audioTracks ?? []),
          {
            id,
            name: displayMusicTitle(resolved?.name?.trim() || parsed.name),
            createdAt: Date.now(),
            source: parsed.source,
            externalUrl: parsed.externalUrl,
            thumbnailUrl: resolved?.thumbnailUrl,
          },
        ],
      }));
      showToast(getStrings(profileLanguageRef.current).musicLinkAdded);
      return true;
    },
    [mutateMedia, showToast],
  );

  const setMusicTrackName = useCallback(
    (trackId: string, name: string) => {
      mutateMedia((m) => ({
        ...m,
        audioTracks: (m.audioTracks ?? []).map((t) =>
          t.id === trackId ? { ...t, name } : t,
        ),
      }));
    },
    [mutateMedia],
  );

  const removeMusicTrack = useCallback(
    async (trackId: string) => {
      if (!activeProjectId) return;
      const track = mediaRef.current.audioTracks.find((t) => t.id === trackId);
      if (track?.source === "file") {
        await deleteMediaBlob(activeProjectId, trackId);
      }
      mutateMedia((m) => ({
        ...m,
        audioTracks: (m.audioTracks ?? []).filter((t) => t.id !== trackId),
      }));
    },
    [activeProjectId, mutateMedia],
  );

  const getMusicFileUrl = useCallback(
    async (trackId: string): Promise<string | null> => {
      if (!activeProjectId) return null;
      const track = mediaRef.current.audioTracks.find((t) => t.id === trackId);
      if (!track || track.source !== "file") return null;
      const blob = await getMediaBlob(activeProjectId, trackId);
      return blob ? URL.createObjectURL(blob) : null;
    },
    [activeProjectId],
  );

  const addReferenceVideo = useCallback(
    async (file: File) => {
      if (!activeProjectId) return;
      const id = newMediaId();
      await saveMediaFile(activeProjectId, id, "video", file);
      mutateMedia((m) => ({
        ...m,
        referenceVideos: [
          ...(m.referenceVideos ?? []),
          {
            id,
            name: file.name,
            createdAt: Date.now(),
            message: "",
            source: "file" as const,
          },
        ],
      }));
      showToast(getStrings(profileLanguageRef.current).videoUploaded);
    },
    [activeProjectId, mutateMedia, showToast],
  );

  const addReferenceVideoLink = useCallback(
    (url: string) => {
      const parsed = parseVideoLink(url);
      if (!parsed) {
        showToast(getStrings(profileLanguageRef.current).videoLinkInvalid);
        return;
      }
      const id = newMediaId();
      mutateMedia((m) => ({
        ...m,
        referenceVideos: [
          ...(m.referenceVideos ?? []),
          {
            id,
            name: parsed.name,
            createdAt: Date.now(),
            message: "",
            source: parsed.source,
            externalUrl: parsed.externalUrl,
          },
        ],
      }));
      showToast(getStrings(profileLanguageRef.current).videoLinkAdded);
    },
    [mutateMedia, showToast],
  );

  const setReferenceVideoMessage = useCallback(
    (videoId: string, message: string) => {
      mutateMedia((m) => ({
        ...m,
        referenceVideos: (m.referenceVideos ?? []).map((v) =>
          v.id === videoId ? { ...v, message } : v,
        ),
      }));
    },
    [mutateMedia],
  );

  const setReferenceVideoName = useCallback(
    (videoId: string, name: string) => {
      mutateMedia((m) => ({
        ...m,
        referenceVideos: (m.referenceVideos ?? []).map((v) =>
          v.id === videoId ? { ...v, name } : v,
        ),
      }));
    },
    [mutateMedia],
  );

  const removeReferenceVideo = useCallback(
    async (videoId: string) => {
      if (!activeProjectId) return;
      const video = mediaRef.current.referenceVideos.find((v) => v.id === videoId);
      if (video?.source === "file") {
        await deleteMediaBlob(activeProjectId, videoId);
      }
      mutateMedia((m) => ({
        ...m,
        referenceVideos: (m.referenceVideos ?? []).filter((v) => v.id !== videoId),
      }));
    },
    [activeProjectId, mutateMedia],
  );

  const getVideoUrl = useCallback(
    async (videoId: string): Promise<string | null> => {
      if (!activeProjectId) return null;
      const video = mediaRef.current.referenceVideos.find((v) => v.id === videoId);
      if (!video || video.source !== "file") return null;
      const blob = await getMediaBlob(activeProjectId, videoId);
      return blob ? URL.createObjectURL(blob) : null;
    },
    [activeProjectId],
  );

  const buildShareUrlForProject = useCallback(
    async (
      projectId: string,
    ): Promise<{ url: string; kind: "remote" | "legacy" } | null> => {
      if (appModeRef.current === "view") return null;
      const ws = workspaceRef.current;
      if (!ws) return null;

      const state =
        projectId === activeProjectIdRef.current
          ? stateRef.current
          : getActiveState(ws, projectId);
      if (!state) return null;

      const media =
        projectId === activeProjectIdRef.current
          ? normalizeProjectMedia(mediaRef.current)
          : normalizeProjectMedia(getActiveMedia(ws, projectId));

      const remote = await createRemoteShare(state, media);
      if (remote.ok) {
        return { url: buildShareUrlFromId(remote.shareId), kind: "remote" };
      }
      if (remote.reason === "failed") {
        console.error("[share] create failed:", remote.error);
      }

      const legacyUrl = buildLegacyShareUrl(state, media);
      return legacyUrl ? { url: legacyUrl, kind: "legacy" } : null;
    },
    [],
  );

  const createShareUrl = useCallback(
    async (projectId?: string): Promise<string | null> => {
      const pid = projectId ?? activeProjectIdRef.current;
      if (!pid) return null;
      const result = await buildShareUrlForProject(pid);
      return result?.url ?? null;
    },
    [buildShareUrlForProject],
  );

  const copyShareLink = useCallback(async () => {
    if (appModeRef.current === "view") return;
    const lang = getStrings(profileLanguageRef.current);
    const projectId = activeProjectIdRef.current;
    const ws = workspaceRef.current;
    const media =
      ws && projectId
        ? normalizeProjectMedia(getActiveMedia(ws, projectId))
        : normalizeProjectMedia(mediaRef.current);

    const result = projectId
      ? await buildShareUrlForProject(projectId)
      : null;
    if (!result) {
      showToast(lang.shareLinkTooLong);
      return;
    }
    try {
      await navigator.clipboard.writeText(result.url);
      showToast(
        result.kind === "remote"
          ? shareCopiedToastMessage(lang, media)
          : lang.shareLinkCopiedLegacy,
      );
    } catch {
      showToast(lang.shareLinkCopyFailed);
    }
  }, [buildShareUrlForProject, showToast]);

  const openShareDialog = useCallback(() => {
    if (appModeRef.current === "view") return;
    setShareDialogOpen(true);
  }, []);

  const closeShareDialog = useCallback(() => {
    setShareDialogOpen(false);
  }, []);

  const enterViewPreview = useCallback(
    (projectId?: string) => {
      const targetId = projectId ?? activeProjectIdRef.current;
      if (targetId && targetId !== activeProjectIdRef.current) {
        switchProject(targetId);
      }
      stopPlayback();
      setExternalShareView(false);
      setAppMode("view");
      showToast(getStrings(profileLanguageRef.current).viewPreviewStarted);
    },
    [stopPlayback, showToast, switchProject],
  );

  const exitViewMode = useCallback(() => {
    if (externalShareViewRef.current) return;
    stopPlayback();
    setAppMode("edit");
    showToast(getStrings(profileLanguageRef.current).viewPreviewEnded);
  }, [stopPlayback, showToast]);

  const setMemberDotPx = useCallback((px: number) => {
    mutateState((s) => ({
      ...s,
      stage: normalizeStage({
        ...s.stage,
        memberDotPx: clampMemberDotPx(px),
      }),
    }));
  }, [mutateState]);

  const resetMemberDotPx = useCallback(() => {
    mutateState((s) => ({
      ...s,
      stage: normalizeStage({ ...s.stage, memberDotPx: null }),
    }));
  }, [mutateState]);

  const value: ChoreoContextValue = {
    state,
    language,
    strings,
    totalSlots,
    toast,
    draggingMemberId,
    selectedMemberId,
    selectMember,
    beatIntervalSec,
    currentBeatSec,
    displayCount: playbackPosCount,
    setSongTitle: (v) => mutateState((s) => ({ ...s, songTitle: v })),
    setBpm: (bpm) =>
      mutateState((s) => ({
        ...s,
        bpm: Math.max(40, Math.min(240, Math.round(bpm))),
      })),
    setBamiriHalfWidth: (bamiriHalfWidth) =>
      mutateState((s) => ({
        ...s,
        stage: normalizeStage({ ...s.stage, bamiriHalfWidth }),
      })),
    setBamiriDepth: (bamiriDepth) =>
      mutateState((s) => ({
        ...s,
        stage: normalizeStage({ ...s.stage, bamiriDepth }),
      })),
    setStageScaleW: (scaleW) =>
      mutateState(
        (s) => ({
          ...s,
          stage: normalizeStage({ ...s.stage, scaleW }),
        }),
        false,
      ),
    setStageScaleH: (scaleH) =>
      mutateState(
        (s) => ({
          ...s,
          stage: normalizeStage({ ...s.stage, scaleH }),
        }),
        false,
      ),
    setMemberDotPx,
    resetMemberDotPx,
    memberDotPx,
    setMemberCount,
    renameMember,
    deleteMember,
    hideMemberFromCurrentCount,
    restoreMember,
    toggleMemberVisibility,
    isMemberVisibleOnCurrent,
    renameSectionName,
    insertHalfAfter,
    removeHalfAt,
    removeCountAt,
    removeCurrentCount,
    addSection,
    deleteSection,
    addCountToSection,
    moveSection,
    swapSections,
    reorderSections,
    navigateTo,
    prevCount,
    nextCount,
    togglePlayback,
    stopPlayback,
    undo,
    canUndo,
    pushUndoHistory,
    copyFormation,
    pasteFormation,
    hasClipboard: clipboard !== null,
    updateMemberPosition,
    setDraggingMemberId,
    getMemberPos: (memberId) =>
      getMemberPos(
        memberId,
        state.isPlaying ? playbackPosCount : state.currentCount,
        state.countData,
        state.members,
      ),
    addStageAnnotation,
    updateStageAnnotation,
    removeStageAnnotation,
    clearStageAnnotations,
    selectedAnnotationId,
    setSelectedAnnotationId,
    selectAnnotation,
    projects,
    folders,
    activeProjectId,
    hasActiveProject,
    switchProject,
    createProject,
    deleteProject,
    renameProject,
    reorderProjects,
    createFolder: createFolderInWorkspace,
    renameFolder: renameFolderInWorkspace,
    deleteFolder: deleteFolderInWorkspace,
    toggleFolderCollapsed: toggleFolderCollapsedInWorkspace,
    toggleFolderBookmark: toggleFolderBookmarkInWorkspace,
    setProjectFolder: setProjectFolderInWorkspace,
    toggleProjectBookmark: toggleProjectBookmarkInWorkspace,
    appMode,
    isViewOnly: appMode === "view",
    externalShareView,
    canExitViewMode: appMode === "view" && !externalShareView,
    media,
    addMusicLink,
    setMusicTrackName,
    removeMusicTrack,
    getMusicFileUrl,
    addReferenceVideo,
    addReferenceVideoLink,
    setReferenceVideoName,
    setReferenceVideoMessage,
    removeReferenceVideo,
    getVideoUrl,
    copyShareLink,
    createShareUrl,
    enterViewPreview,
    exitViewMode,
    shareDialogOpen,
    openShareDialog,
    closeShareDialog,
  };

  return (
    <ChoreoContext.Provider value={value}>
      {!hydrated ? (
        <div className="choreo-loading">
          <div className="choreo-loading-inner">
            <BrandLogo size="loading" />
            {bootingLabel ? (
              <p className="choreo-loading-label">{bootingLabel}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <>{children}</>
      )}
    </ChoreoContext.Provider>
  );
}

export function useChoreo() {
  const ctx = useContext(ChoreoContext);
  if (!ctx) throw new Error("useChoreo must be used within ChoreoProvider");
  return ctx;
}
