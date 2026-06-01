import {
  COLORS,
  DEFAULT_BPM,
  DEFAULT_MEMBER_COUNT,
  DEFAULT_STAGE,
  MAX_MEMBERS,
  MIN_MEMBERS,
  createDefaultSections,
} from "./constants";
import { gridCellCenter, normalizeStage } from "./gridUtils";
import {
  getTotalSlots,
  migrateSections,
  flattenTimeline,
} from "./sectionUtils";
import type { ChoreoState, CountData, FormationClipboard, Member, Position } from "./types";

export {
  appendSection,
  flattenTimeline,
  getCurrentSection,
  getFlatSlot,
  getTotalSlots,
  insertHalfSlot,
  removeHalfSlot,
  renameSection,
  sectionHidesCountButtons,
  shiftCountDataInsert,
  shiftCountDataRemove,
  slotGlobalIndex,
} from "./sectionUtils";

export interface PositionDisplayInfo {
  sectionName: string;
  sectionIndex: number;
  sectionCount: number;
  countLabel: string;
  isHalf: boolean;
  indexInSection: number;
  slotsInSection: number;
  globalIndex: number;
  totalSlots: number;
}

export function getPositionDisplayInfo(
  sections: import("./types").Section[],
  globalIndex: number,
): PositionDisplayInfo {
  const flat = flattenTimeline(sections);
  const totalSlots = flat.length;
  const slot = flat[globalIndex - 1];
  if (!slot) {
    return {
      sectionName: sections[0]?.name ?? "—",
      sectionIndex: 1,
      sectionCount: sections.length,
      countLabel: String(globalIndex),
      isHalf: false,
      indexInSection: 1,
      slotsInSection: 1,
      globalIndex,
      totalSlots: Math.max(1, totalSlots),
    };
  }
  const sectionSlots = flat.filter((f) => f.sectionId === slot.sectionId);
  const sectionIndex =
    sections.findIndex((s) => s.id === slot.sectionId) + 1;
  return {
    sectionName: slot.sectionName,
    sectionIndex: Math.max(1, sectionIndex),
    sectionCount: sections.length,
    countLabel: slot.label,
    isHalf: slot.isHalf,
    indexInSection:
      sectionSlots.findIndex((f) => f.globalIndex === globalIndex) + 1,
    slotsInSection: sectionSlots.length,
    globalIndex,
    totalSlots: Math.max(1, totalSlots),
  };
}

export function clampMemberCount(n: number): number {
  return Math.max(MIN_MEMBERS, Math.min(MAX_MEMBERS, Math.round(n)));
}

export function defaultPosForIndex(index: number, total: number): Position {
  const hw = DEFAULT_STAGE.bamiriHalfWidth;
  const depth = DEFAULT_STAGE.bamiriDepth;
  const cols = hw * 2 + 1;
  const rows = depth + 1;
  const col = (index % cols) - hw;
  const row = Math.floor(index / cols);
  if (row < rows) return gridCellCenter(col, row, hw, depth);
  const legacyCols = Math.ceil(Math.sqrt(total));
  const legacyRows = Math.ceil(total / legacyCols);
  const c = index % legacyCols;
  const r = Math.floor(index / legacyCols);
  return {
    x: Math.round(12 + ((c + 0.5) / legacyCols) * 76),
    y: Math.round(12 + ((r + 0.5) / legacyRows) * 76),
  };
}

export function dotSizePx(memberCount: number): number {
  const n = Math.max(1, memberCount);
  return Math.max(16, Math.min(44, Math.floor(520 / Math.sqrt(n))));
}

export function createMembers(count: number, startId = 1): Member[] {
  const n = clampMemberCount(count);
  return Array.from({ length: n }, (_, i) => ({
    id: startId + i,
    name: String(i + 1),
    color: COLORS[i % COLORS.length],
  }));
}

export function applyMemberCount(state: ChoreoState, rawCount: number): ChoreoState {
  const n = clampMemberCount(rawCount);
  let members = [...state.members];
  let nextId = state.nextId;

  if (members.length > n) {
    members = members.slice(0, n);
  }
  while (members.length < n) {
    members.push({
      id: nextId++,
      name: String(members.length + 1),
      color: COLORS[members.length % COLORS.length],
    });
  }

  return {
    ...state,
    members,
    nextId: Math.max(state.nextId, nextId),
  };
}

/** 1拍（ms）。テンポは常にこれを基準にする。 */
export function beatIntervalMs(bpm: number): number {
  return (60 / Math.max(40, bpm)) * 1000;
}

export interface PlaybackPhase {
  globalIndex: number;
  durationMs: number;
  animationSec: number;
  posCount: number;
}

/** 再生フェーズ列。& は拍を増やさず、直前カウントの後半に割り当てる。 */
export function buildPlaybackPhases(
  sections: import("./types").Section[],
  bpm: number,
): PlaybackPhase[] {
  const flat = flattenTimeline(sections);
  const beat = beatIntervalMs(bpm);
  const halfBeat = beat / 2;
  const phases: PlaybackPhase[] = [];

  for (let i = 0; i < flat.length; ) {
    const slot = flat[i];
    const next = flat[i + 1];

    if (!slot.isHalf && next?.isHalf) {
      phases.push({
        globalIndex: slot.globalIndex,
        durationMs: halfBeat,
        animationSec: 0,
        posCount: slot.globalIndex,
      });
      phases.push({
        globalIndex: next.globalIndex,
        durationMs: halfBeat,
        animationSec: halfBeat / 1000,
        posCount: next.globalIndex,
      });
      i += 2;
      continue;
    }

    if (slot.isHalf) {
      phases.push({
        globalIndex: slot.globalIndex,
        durationMs: halfBeat,
        animationSec: halfBeat / 1000,
        posCount: slot.globalIndex,
      });
      i += 1;
      continue;
    }

    phases.push({
      globalIndex: slot.globalIndex,
      durationMs: beat,
      animationSec: beat / 1000,
      posCount: slot.globalIndex,
    });
    i += 1;
  }

  return phases;
}

export function findFirstPhaseForGlobal(
  phases: PlaybackPhase[],
  globalIndex: number,
): number {
  const idx = phases.findIndex((p) => p.globalIndex === globalIndex);
  return idx >= 0 ? idx : 0;
}

export function getElapsedMsThroughPhase(
  phases: PlaybackPhase[],
  phaseIndex: number,
): number {
  let total = 0;
  for (let i = 0; i <= phaseIndex && i < phases.length; i++) {
    total += phases[i].durationMs;
  }
  return total;
}

export function getElapsedMsBeforePhase(
  phases: PlaybackPhase[],
  phaseIndex: number,
): number {
  if (phaseIndex <= 0) return 0;
  return getElapsedMsThroughPhase(phases, phaseIndex - 1);
}

/** @deprecated スロット単位。再生スケジュールは buildPlaybackPhases を使用。 */
export function getSlotDurationMs(
  sections: import("./types").Section[],
  globalIndex: number,
  bpm: number,
): number {
  const flat = flattenTimeline(sections);
  const slot = flat[globalIndex - 1];
  if (!slot) return beatIntervalMs(bpm);
  const beat = beatIntervalMs(bpm);
  if (slot.isHalf) return beat / 2;
  const next = flat[globalIndex];
  if (next?.isHalf) return beat / 2;
  return beat;
}

export function getElapsedMsThroughSlot(
  sections: import("./types").Section[],
  globalIndex: number,
  bpm: number,
): number {
  const phases = buildPlaybackPhases(sections, bpm);
  let last = -1;
  for (let i = 0; i < phases.length; i++) {
    if (phases[i].globalIndex === globalIndex) last = i;
  }
  if (last < 0) return 0;
  return getElapsedMsThroughPhase(phases, last);
}

export function getElapsedMsBeforeSlot(
  sections: import("./types").Section[],
  globalIndex: number,
  bpm: number,
): number {
  const phases = buildPlaybackPhases(sections, bpm);
  const idx = findFirstPhaseForGlobal(phases, globalIndex);
  return getElapsedMsBeforePhase(phases, idx);
}

export function getSectionDurationMs(
  sections: import("./types").Section[],
  sectionId: string,
  bpm: number,
): number {
  const sec = sections.find((s) => s.id === sectionId);
  if (!sec) return 0;
  const beat = beatIntervalMs(bpm);
  const countSlots = sec.slots.filter((s) => s.type === "count").length;
  return countSlots * beat;
}

export interface PlaybackSlotTiming {
  waitMs: number;
  animationSec: number;
  targetCount: number;
}

export function getPlaybackPhaseTiming(
  sections: import("./types").Section[],
  globalIndex: number,
  bpm: number,
): PlaybackSlotTiming {
  const phases = buildPlaybackPhases(sections, bpm);
  const idx = findFirstPhaseForGlobal(phases, globalIndex);
  const phase = phases[idx];
  if (!phase) {
    const beat = beatIntervalMs(bpm);
    return { waitMs: beat, animationSec: beat / 1000, targetCount: globalIndex };
  }
  return {
    waitMs: phase.durationMs,
    animationSec: phase.animationSec,
    targetCount: phase.posCount,
  };
}

/** @deprecated getPlaybackPhaseTiming を使用 */
export function getPlaybackSlotTiming(
  sections: import("./types").Section[],
  globalIndex: number,
  bpm: number,
): PlaybackSlotTiming {
  return getPlaybackPhaseTiming(sections, globalIndex, bpm);
}

export function getCountData(
  countData: Record<number, CountData>,
  count: number,
): CountData {
  if (!countData[count]) {
    countData[count] = { positions: {}, memo: "" };
  }
  return countData[count];
}

export function getMemberPos(
  memberId: number,
  count: number,
  countData: Record<number, CountData>,
  members: Member[],
): Position {
  for (let c = count; c >= 1; c--) {
    const d = countData[c];
    if (d?.positions[memberId]) return { ...d.positions[memberId] };
  }
  const idx = members.findIndex((m) => m.id === memberId);
  if (idx >= 0) return defaultPosForIndex(idx, members.length);
  return gridCellCenter(0, 0, DEFAULT_STAGE.bamiriHalfWidth, DEFAULT_STAGE.bamiriDepth);
}

export function getHiddenMembers(
  count: number,
  countData: Record<number, CountData>,
): number[] {
  for (let c = count; c >= 1; c--) {
    const d = countData[c];
    if (d?.hidden !== undefined) return d.hidden;
  }
  return [];
}

export function isMemberVisible(
  memberId: number,
  count: number,
  countData: Record<number, CountData>,
): boolean {
  return !getHiddenMembers(count, countData).includes(memberId);
}

export function snapshotFormation(
  count: number,
  countData: Record<number, CountData>,
  members: Member[],
): import("./types").FormationClipboard {
  const positions: Record<number, Position> = {};
  for (const m of members) {
    if (isMemberVisible(m.id, count, countData)) {
      positions[m.id] = getMemberPos(m.id, count, countData, members);
    }
  }
  return {
    positions,
    hidden: [...getHiddenMembers(count, countData)],
  };
}

export function countHasData(cd: CountData | undefined): boolean {
  if (!cd) return false;
  return (
    Object.keys(cd.positions).length > 0 || (cd.hidden?.length ?? 0) > 0
  );
}

function emptyState(): ChoreoState {
  return {
    songTitle: "新曲タイトル",
    sections: createDefaultSections(),
    members: [],
    removedMembers: [],
    bpm: DEFAULT_BPM,
    currentCount: 1,
    countData: {},
    stage: { ...DEFAULT_STAGE },
    nextId: 1,
    isPlaying: false,
  };
}

export function createDemoState(): ChoreoState {
  const state = emptyState();
  state.members = createMembers(DEFAULT_MEMBER_COUNT);
  state.nextId = DEFAULT_MEMBER_COUNT + 1;

  const d1 = getCountData(state.countData, 1);
  state.members.forEach((m, i) => {
    d1.positions[m.id] = defaultPosForIndex(i, state.members.length);
  });

  return state;
}

export function createInitialState(): ChoreoState {
  return createDemoState();
}

interface LegacyCountData {
  pos?: Record<number, Position>;
  positions?: Record<number, Position>;
  memo?: string;
}

interface LegacyPayload {
  songTitle?: string;
  sections?: Parameters<typeof migrateSections>[0];
  totalCounts?: number;
  cur?: number;
  currentCount?: number;
  scaleW?: number;
  scaleH?: number;
  snap?: boolean;
  bpm?: number;
  nextId?: number;
  members?: Member[];
  removedMembers?: Member[];
  cdata?: Record<number, LegacyCountData>;
  countData?: Record<number, LegacyCountData>;
  stage?: Partial<ChoreoState["stage"]> & {
    gridFineness?: number;
    scaleW?: number;
    scaleH?: number;
  };
}

function migrateCountData(raw: Record<number, LegacyCountData & { hidden?: number[] }>): Record<number, CountData> {
  const out: Record<number, CountData> = {};
  for (const [k, v] of Object.entries(raw)) {
    out[+k] = {
      positions: v.positions ?? v.pos ?? {},
      memo: v.memo ?? "",
      hidden: v.hidden,
    };
  }
  return out;
}

function migrateStage(raw: LegacyPayload): ChoreoState["stage"] {
  const st = raw.stage ?? {};
  return normalizeStage({
    bamiriHalfWidth: st.bamiriHalfWidth,
    bamiriDepth: st.bamiriDepth,
    scaleW: raw.scaleW ?? st.scaleW,
    scaleH: raw.scaleH ?? st.scaleH,
  });
}

function migrateLegacy(raw: LegacyPayload): ChoreoState | null {
  if (!raw.members?.length) return null;
  const sections = migrateSections(raw.sections);
  const total = getTotalSlots(sections);
  const currentCount = raw.currentCount ?? raw.cur ?? 1;
  return {
    songTitle: raw.songTitle ?? "新曲タイトル",
    sections,
    members: raw.members,
    removedMembers: raw.removedMembers ?? [],
    bpm: raw.bpm ?? DEFAULT_BPM,
    currentCount: Math.min(Math.max(1, currentCount), total),
    countData: migrateCountData(raw.cdata ?? raw.countData ?? {}),
    stage: migrateStage(raw),
    nextId: raw.nextId ?? raw.members.length + 1,
    isPlaying: false,
  };
}

export function serializeState(state: ChoreoState): string {
  return JSON.stringify({ ...state, isPlaying: false });
}

export function deserializeState(json: string): ChoreoState | null {
  try {
    const parsed = JSON.parse(json) as LegacyPayload;
    return migrateLegacy(parsed);
  } catch {
    return null;
  }
}

export { clampStagePos } from "./gridUtils";
