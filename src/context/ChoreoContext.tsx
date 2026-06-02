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
} from "@/lib/choreoUtils";
import { MAX_COUNTS_PER_SECTION } from "@/lib/constants";
import { clampMemberDotPx, normalizeStage } from "@/lib/gridUtils";
import {
  addProject,
  getActiveState,
  loadWorkspace,
  patchActiveProject,
  projectToSummary,
  removeProject,
  saveWorkspace,
} from "@/lib/projectStore";
import { getStrings, type ProjectLanguage, type UiStrings } from "@/lib/uiStrings";
import type {
  ChoreoState,
  CountData,
  FormationClipboard,
  NewProjectParams,
  Position,
  ProjectSummary,
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
  saveProject: () => void;
  undo: () => void;
  canUndo: boolean;
  pushUndoHistory: () => void;
  copyFormation: () => void;
  pasteFormation: () => void;
  hasClipboard: boolean;
  updateMemberPosition: (memberId: number, x: number, y: number) => void;
  setDraggingMemberId: (id: number | null) => void;
  getMemberPos: (memberId: number) => Position;
  projects: ProjectSummary[];
  activeProjectId: string;
  switchProject: (projectId: string) => void;
  createProject: (params: NewProjectParams) => void;
  deleteProject: (projectId: string) => void;
}

const ChoreoContext = createContext<ChoreoContextValue | null>(null);

const MAX_UNDO = 50;

function persistWorkspace(
  workspace: Workspace,
  activeProjectId: string,
  state: ChoreoState,
): boolean {
  return saveWorkspace(patchActiveProject(workspace, activeProjectId, state));
}

function cloneChoreoState(state: ChoreoState): ChoreoState {
  return JSON.parse(JSON.stringify(state)) as ChoreoState;
}

export function ChoreoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ChoreoState>(createInitialState);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [activeProjectId, setActiveProjectId] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [draggingMemberId, setDraggingMemberId] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [clipboard, setClipboard] = useState<FormationClipboard | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  const stateRef = useRef(state);
  const undoStackRef = useRef<ChoreoState[]>([]);
  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackAnchorRef = useRef<number | null>(null);
  const playbackPhaseRef = useRef<number>(0);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workspaceRef = useRef<Workspace | null>(null);
  stateRef.current = state;
  workspaceRef.current = workspace;

  const projects = useMemo((): ProjectSummary[] => {
    if (!workspace) return [];
    return workspace.projects.map((p) =>
      p.id === activeProjectId
        ? {
            id: p.id,
            songTitle: state.songTitle,
            bpm: state.bpm,
            updatedAt: p.updatedAt,
          }
        : projectToSummary(p),
    );
  }, [workspace, activeProjectId, state.songTitle, state.bpm]);

  const language = state.language;
  const strings = useMemo(() => getStrings(state.language), [state.language]);

  useEffect(() => {
    document.documentElement.lang = state.language;
  }, [state.language]);

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
    if (!hydrated || !activeProjectId) return;
    const ws = workspaceRef.current;
    if (!ws) return;
    const next = patchActiveProject(ws, activeProjectId, state);
    workspaceRef.current = next;
    saveWorkspace(next);
    setWorkspace(next);
  }, [state, hydrated, activeProjectId]);

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
      if (recordHistory) pushUndoHistory();
      setState(updater);
    },
    [pushUndoHistory],
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
    showToast(getStrings(stateRef.current.language).undoDone);
  }, [stopPlayback, showToast]);

  useEffect(() => {
    const loaded = loadWorkspace();
    setWorkspace(loaded.workspace);
    setActiveProjectId(loaded.workspace.activeProjectId);
    setState(loaded.activeState);
    clearUndoHistory();
    setHydrated(true);
  }, [clearUndoHistory]);

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
      showToast(getStrings(stateRef.current.language).paused);
    } else {
      setState((s) => ({ ...s, isPlaying: true }));
      showToast(getStrings(stateRef.current.language).playingToast);
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

  const saveProject = useCallback(() => {
    const ws = workspaceRef.current;
    if (!ws || !activeProjectId) {
      showToast(getStrings(stateRef.current.language).saveFailed);
      return;
    }
    const ok = persistWorkspace(ws, activeProjectId, stateRef.current);
    showToast(ok ? getStrings(stateRef.current.language).saved : getStrings(stateRef.current.language).saveFailed);
  }, [activeProjectId, showToast]);

  const switchProject = useCallback(
    (projectId: string) => {
      if (projectId === activeProjectId) return;
      const ws = workspaceRef.current;
      if (!ws) return;
      stopPlayback();
      const saved = patchActiveProject(ws, activeProjectId, stateRef.current);
      const nextState = getActiveState(
        { ...saved, activeProjectId: projectId },
        projectId,
      );
      if (!nextState) return;
      const nextWs = { ...saved, activeProjectId: projectId };
      workspaceRef.current = nextWs;
      saveWorkspace(nextWs);
      setWorkspace(nextWs);
      setActiveProjectId(projectId);
      setState(nextState);
      setSelectedMemberId(null);
      clearUndoHistory();
      showToast(getStrings(stateRef.current.language).switchedProject(nextState.songTitle));
    },
    [activeProjectId, stopPlayback, showToast, clearUndoHistory],
  );

  const createProject = useCallback(
    (params: NewProjectParams) => {
      const ws = workspaceRef.current;
      if (!ws) return;
      stopPlayback();
      const saved = patchActiveProject(ws, activeProjectId, stateRef.current);
      const { workspace: nextWs, record } = addProject(saved, params);
      workspaceRef.current = nextWs;
      saveWorkspace(nextWs);
      setWorkspace(nextWs);
      setActiveProjectId(record.id);
      setState(record.state);
      setSelectedMemberId(null);
      clearUndoHistory();
      showToast(getStrings(stateRef.current.language).createdProject(record.state.songTitle));
    },
    [activeProjectId, stopPlayback, showToast, clearUndoHistory],
  );

  const deleteProject = useCallback(
    (projectId: string) => {
      const ws = workspaceRef.current;
      if (!ws) return;
      if (ws.projects.length <= 1) {
        showToast(getStrings(stateRef.current.language).cannotDeleteLastProject);
        return;
      }
      stopPlayback();
      const saved = patchActiveProject(ws, activeProjectId, stateRef.current);
      const nextWs = removeProject(saved, projectId);
      if (!nextWs) return;
      workspaceRef.current = nextWs;
      saveWorkspace(nextWs);
      setWorkspace(nextWs);
      if (activeProjectId === projectId) {
        const nextState = getActiveState(nextWs, nextWs.activeProjectId);
        if (nextState) {
          setActiveProjectId(nextWs.activeProjectId);
          setState(nextState);
          setSelectedMemberId(null);
        }
      }
      clearUndoHistory();
      showToast(getStrings(stateRef.current.language).projectDeleted);
    },
    [activeProjectId, stopPlayback, showToast, clearUndoHistory],
  );

  const copyFormation = useCallback(() => {
    stopPlayback();
    const s = stateRef.current;
    setClipboard(snapshotFormation(s.currentCount, s.countData, s.members));
    showToast(getStrings(stateRef.current.language).copied);
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
      };
      return { ...s, countData };
    });
    showToast(getStrings(stateRef.current.language).pasted);
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
  }, []);

  const deleteMember = useCallback(
    (memberId: number) => {
      const name =
        stateRef.current.members.find((m) => m.id === memberId)?.name ??
        getStrings(stateRef.current.language).memberFallback;
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
      showToast(getStrings(stateRef.current.language).memberRemoved(name));
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
      showToast(getStrings(stateRef.current.language).memberRestored);
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
      showToast(getStrings(stateRef.current.language).halfCountAdded);
    },
    [mutateState, showToast],
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
      showToast(getStrings(stateRef.current.language).countDeleted);
    },
    [mutateState, showToast],
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
      !window.confirm(getStrings(stateRef.current.language).deleteCountConfirm(flat.label))
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
      showToast(getStrings(stateRef.current.language).sectionDeletedToast);
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
      showToast(delta === -1 ? getStrings(stateRef.current.language).sectionMovedLeft : getStrings(stateRef.current.language).sectionMovedRight);
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
      showToast(getStrings(stateRef.current.language).sectionsSwapped);
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
      showToast(getStrings(stateRef.current.language).sectionReordered);
    },
    [stopPlayback, mutateState, showToast],
  );

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
    saveProject,
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
    projects,
    activeProjectId,
    switchProject,
    createProject,
    deleteProject,
  };

  if (!hydrated) {
    return (
      <div className="choreo-loading">
        <span className="logo">◈ CHOREO</span>
      </div>
    );
  }

  return (
    <ChoreoContext.Provider value={value}>{children}</ChoreoContext.Provider>
  );
}

export function useChoreo() {
  const ctx = useContext(ChoreoContext);
  if (!ctx) throw new Error("useChoreo must be used within ChoreoProvider");
  return ctx;
}
