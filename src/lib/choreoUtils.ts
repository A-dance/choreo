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
  shiftCountDataInsert,
  shiftCountDataRemove,
  slotGlobalIndex,
} from "./sectionUtils";

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

export function beatIntervalMs(bpm: number): number {
  return (60 / Math.max(40, bpm)) * 1000;
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
