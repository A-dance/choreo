"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { STORAGE_KEY } from "@/lib/constants";
import {
  applyMemberCount,
  beatIntervalMs,
  clampStagePos,
  createInitialState,
  deserializeState,
  flattenTimeline,
  getCountData,
  getFlatSlot,
  getMemberPos,
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
  beatIntervalSec: number;
  setSongTitle: (v: string) => void;
  setBpm: (bpm: number) => void;
  setBamiriHalfWidth: (v: number) => void;
  setBamiriDepth: (v: number) => void;
  setStageScaleW: (v: number) => void;
  setStageScaleH: (v: number) => void;
  setMemberCount: (n: number) => void;
  renameMember: (memberId: number, name: string) => void;
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
  copyFormation: () => void;
  pasteFormation: () => void;
  hasClipboard: boolean;
  updateMemberPosition: (memberId: number, x: number, y: number) => void;
  setDraggingMemberId: (id: number | null) => void;
  getMemberPos: (memberId: number) => Position;
}

const ChoreoContext = createContext<ChoreoContextValue | null>(null);

function persist(state: ChoreoState) {
  try {
    localStorage.setItem(STORAGE_KEY, serializeState(state));
  } catch {
    /* ignore */
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
  const [clipboard, setClipboard] = useState<FormationClipboard | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const stateRef = useRef(state);
  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  stateRef.current = state;

  const totalSlots = getTotalSlots(state.sections);
  const beatIntervalSec = beatIntervalMs(state.bpm) / 1000;

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
    setState((s) => (s.isPlaying ? { ...s, isPlaying: false } : s));
  }, [clearPlaybackTimer]);

  const scheduleNextBeat = useCallback(() => {
    clearPlaybackTimer();
    const s = stateRef.current;
    if (!s.isPlaying) return;

    const flat = flattenTimeline(s.sections);
    const current = flat[s.currentCount - 1];
    const ms = current?.isHalf
      ? beatIntervalMs(s.bpm) / 2
      : beatIntervalMs(s.bpm);

    playbackTimerRef.current = setTimeout(() => {
      const cur = stateRef.current;
      if (!cur.isPlaying) return;
      const total = getTotalSlots(cur.sections);
      const next = cur.currentCount >= total ? 1 : cur.currentCount + 1;
      setState((prev) => ({ ...prev, currentCount: next }));
      scheduleNextBeat();
    }, ms);
  }, [clearPlaybackTimer]);

  const startPlaybackLoop = useCallback(() => {
    scheduleNextBeat();
  }, [scheduleNextBeat]);

  const togglePlayback = useCallback(() => {
    if (stateRef.current.isPlaying) {
      stopPlayback();
      showToast("⏸ 停止");
    } else {
      setState((s) => ({ ...s, isPlaying: true }));
      startPlaybackLoop();
      showToast("▶ 再生中");
    }
  }, [stopPlayback, startPlaybackLoop, showToast]);

  useEffect(() => {
    if (!state.isPlaying) return;
    startPlaybackLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.bpm]);

  useEffect(() => {
    return () => clearPlaybackTimer();
  }, [clearPlaybackTimer]);

  const navigateTo = useCallback((count: number) => {
    setState((s) => {
      const total = getTotalSlots(s.sections);
      return {
        ...s,
        currentCount: Math.max(1, Math.min(total, count)),
      };
    });
  }, []);

  const prevCount = useCallback(() => {
    setState((s) => ({
      ...s,
      currentCount: s.currentCount > 1 ? s.currentCount - 1 : s.currentCount,
    }));
  }, []);

  const nextCount = useCallback(() => {
    setState((s) => {
      const total = getTotalSlots(s.sections);
      return {
        ...s,
        currentCount:
          s.currentCount < total ? s.currentCount + 1 : s.currentCount,
      };
    });
  }, []);

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
    }));
  }, []);

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
      isMemberVisible(memberId, state.currentCount, state.countData),
    [state.currentCount, state.countData],
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
      showToast("セクションを追加しました");
    },
    [stopPlayback, showToast],
  );

  const value: ChoreoContextValue = {
    state,
    totalSlots,
    toast,
    draggingMemberId,
    beatIntervalSec,
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
    copyFormation,
    pasteFormation,
    hasClipboard: clipboard !== null,
    updateMemberPosition,
    setDraggingMemberId,
    getMemberPos: (memberId) =>
      getMemberPos(
        memberId,
        state.currentCount,
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
