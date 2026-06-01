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
import { STORAGE_KEY } from "@/lib/constants";
import {
  applyMemberCount,
  beatIntervalMs,
  buildPlaybackPhases,
  clampStagePos,
  createInitialState,
  deserializeState,
  findFirstPhaseForGlobal,
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
  removeHalfSlot,
  renameSection,
  serializeState,
  shiftCountDataInsert,
  shiftCountDataRemove,
  slotGlobalIndex,
  getHiddenMembers,
  isMemberVisible,
  snapshotFormation,
} from "@/lib/choreoUtils";
import { normalizeStage } from "@/lib/gridUtils";
import type { ChoreoState, FormationClipboard, Position } from "@/lib/types";

interface ChoreoContextValue {
  state: ChoreoState;
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
  setMemberCount: (n: number) => void;
  renameMember: (memberId: number, name: string) => void;
  deleteMember: (memberId: number) => void;
  restoreMember: (memberId: number) => void;
  toggleMemberVisibility: (memberId: number) => void;
  isMemberVisibleOnCurrent: (memberId: number) => boolean;
  renameSectionName: (sectionId: string, name: string) => void;
  insertHalfAfter: (sectionId: string, afterSlotIndex: number) => void;
  removeHalfAt: (sectionId: string, slotIndex: number) => void;
  addSection: (name?: string) => void;
  navigateTo: (count: number) => void;
  prevCount: () => void;
  nextCount: () => void;
  togglePlayback: () => void;
  stopPlayback: () => void;
  saveProject: () => void;
  copyFormation: () => void;
  pasteFormation: () => void;
  hasClipboard: boolean;
  updateMemberPosition: (memberId: number, x: number, y: number) => void;
  setDraggingMemberId: (id: number | null) => void;
  getMemberPos: (memberId: number) => Position;
}

const ChoreoContext = createContext<ChoreoContextValue | null>(null);

function persist(state: ChoreoState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, serializeState(state));
    return true;
  } catch {
    return false;
  }
}

function load(): ChoreoState {
  if (typeof window === "undefined") return createInitialState();
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = deserializeState(saved);
    if (parsed) {
      return { ...parsed, stage: normalizeStage(parsed.stage) };
    }
  }
  return createInitialState();
}

export function ChoreoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ChoreoState>(createInitialState);
  const [toast, setToast] = useState<string | null>(null);
  const [draggingMemberId, setDraggingMemberId] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [clipboard, setClipboard] = useState<FormationClipboard | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const stateRef = useRef(state);
  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackAnchorRef = useRef<number | null>(null);
  const playbackPhaseRef = useRef<number>(0);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  stateRef.current = state;

  const totalSlots = getTotalSlots(state.sections);
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
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) persist(state);
  }, [state, hydrated]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 2000);
  }, []);

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
      showToast("⏸ 停止");
    } else {
      setState((s) => ({ ...s, isPlaying: true }));
      showToast("▶ 再生中");
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
    const ok = persist(stateRef.current);
    showToast(ok ? "保存しました" : "保存に失敗しました");
  }, [showToast]);

  const copyFormation = useCallback(() => {
    stopPlayback();
    const s = stateRef.current;
    setClipboard(snapshotFormation(s.currentCount, s.countData, s.members));
    showToast("コピーしました");
  }, [stopPlayback, showToast]);

  const pasteFormation = useCallback(() => {
    stopPlayback();
    setState((s) => {
      if (!clipboard) return s;
      const countData = { ...s.countData };
      const existing = getCountData(countData, s.currentCount);
      countData[s.currentCount] = {
        positions: JSON.parse(JSON.stringify(clipboard.positions)),
        hidden: [...clipboard.hidden],
        memo: existing.memo,
      };
      return { ...s, countData };
    });
    showToast("ペーストしました");
  }, [stopPlayback, clipboard, showToast]);

  const updateMemberPosition = useCallback(
    (memberId: number, x: number, y: number) => {
      setState((s) => {
        const pos = clampStagePos(x, y);
        const countData = { ...s.countData };
        const cd = { ...getCountData(countData, s.currentCount) };
        cd.positions = { ...cd.positions, [memberId]: pos };
        countData[s.currentCount] = cd;
        return { ...s, countData };
      });
    },
    [],
  );

  const setMemberCount = useCallback((n: number) => {
    setState((s) => applyMemberCount(s, n));
  }, []);

  const renameMember = useCallback((memberId: number, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setState((s) => ({
      ...s,
      members: s.members.map((m) =>
        m.id === memberId ? { ...m, name: trimmed } : m,
      ),
      removedMembers: s.removedMembers.map((m) =>
        m.id === memberId ? { ...m, name: trimmed } : m,
      ),
    }));
  }, []);

  const selectMember = useCallback((memberId: number | null) => {
    setSelectedMemberId(memberId);
  }, []);

  const deleteMember = useCallback(
    (memberId: number) => {
      const name =
        stateRef.current.members.find((m) => m.id === memberId)?.name ??
        "メンバー";
      setState((s) => {
        const member = s.members.find((m) => m.id === memberId);
        if (!member) return s;
        return {
          ...s,
          members: s.members.filter((m) => m.id !== memberId),
          removedMembers: [...s.removedMembers, member],
        };
      });
      setSelectedMemberId((id) => (id === memberId ? null : id));
      showToast(`${name} を削除`);
    },
    [showToast],
  );

  const restoreMember = useCallback(
    (memberId: number) => {
      setState((s) => {
        const member = s.removedMembers.find((m) => m.id === memberId);
        if (!member) return s;
        const members = [...s.members, member].sort((a, b) => a.id - b.id);
        return {
          ...s,
          members,
          removedMembers: s.removedMembers.filter((m) => m.id !== memberId),
        };
      });
      showToast("表示に戻しました");
    },
    [showToast],
  );

  const toggleMemberVisibility = useCallback((memberId: number) => {
    setState((s) => {
      const countData = { ...s.countData };
      const cd = { ...getCountData(countData, s.currentCount) };
      const hidden = new Set(getHiddenMembers(s.currentCount, s.countData));
      if (hidden.has(memberId)) hidden.delete(memberId);
      else hidden.add(memberId);
      cd.hidden = Array.from(hidden);
      countData[s.currentCount] = cd;
      return { ...s, countData };
    });
  }, []);

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
    setState((s) => ({
      ...s,
      sections: renameSection(s.sections, sectionId, name),
    }));
  }, []);

  const insertHalfAfter = useCallback(
    (sectionId: string, afterSlotIndex: number) => {
      setState((s) => {
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
      showToast("＆ 半カウントを追加");
    },
    [showToast],
  );

  const removeHalfAt = useCallback(
    (sectionId: string, slotIndex: number) => {
      setState((s) => {
        const sec = s.sections.find((x) => x.id === sectionId);
        if (sec?.slots[slotIndex]?.type !== "half") return s;
        const removeAt = slotGlobalIndex(s.sections, sectionId, slotIndex);
        let currentCount = s.currentCount;
        if (currentCount === removeAt) {
          currentCount = Math.max(1, removeAt - 1);
        } else if (currentCount > removeAt) {
          currentCount -= 1;
        }
        return {
          ...s,
          sections: removeHalfSlot(s.sections, sectionId, slotIndex),
          countData: shiftCountDataRemove(s.countData, removeAt),
          currentCount,
        };
      });
      showToast("＆ を削除");
    },
    [showToast],
  );

  const addSection = useCallback(
    (name?: string) => {
      stopPlayback();
      setState((s) => {
        const firstNew = getTotalSlots(s.sections) + 1;
        const sections = appendSection(s.sections, name);
        return { ...s, sections, currentCount: firstNew };
      });
      showToast("Section added");
    },
    [stopPlayback, showToast],
  );

  const value: ChoreoContextValue = {
    state,
    totalSlots,
    toast,
    draggingMemberId,
    selectedMemberId,
    selectMember,
    beatIntervalSec,
    currentBeatSec,
    setSongTitle: (v) => setState((s) => ({ ...s, songTitle: v })),
    setBpm: (bpm) =>
      setState((s) => ({
        ...s,
        bpm: Math.max(40, Math.min(240, Math.round(bpm))),
      })),
    setBamiriHalfWidth: (bamiriHalfWidth) =>
      setState((s) => ({
        ...s,
        stage: normalizeStage({ ...s.stage, bamiriHalfWidth }),
      })),
    setBamiriDepth: (bamiriDepth) =>
      setState((s) => ({
        ...s,
        stage: normalizeStage({ ...s.stage, bamiriDepth }),
      })),
    setStageScaleW: (scaleW) =>
      setState((s) => ({
        ...s,
        stage: normalizeStage({ ...s.stage, scaleW }),
      })),
    setStageScaleH: (scaleH) =>
      setState((s) => ({
        ...s,
        stage: normalizeStage({ ...s.stage, scaleH }),
      })),
    setMemberCount,
    renameMember,
    deleteMember,
    restoreMember,
    toggleMemberVisibility,
    isMemberVisibleOnCurrent,
    renameSectionName,
    insertHalfAfter,
    removeHalfAt,
    addSection,
    navigateTo,
    prevCount,
    nextCount,
    togglePlayback,
    stopPlayback,
    saveProject,
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
