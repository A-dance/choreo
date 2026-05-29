export const COLORS = [
  "#7c5cfc", "#fc5c7d", "#5cc8fc", "#fcb45c", "#5cfc8f",
  "#fc5cf0", "#c8fc5c", "#fc8e5c", "#5c8efc", "#fc5cba",
  "#a78bfa", "#34d399", "#f472b6", "#fb923c", "#38bdf8",
  "#e879f9", "#4ade80", "#facc15", "#f87171", "#60a5fa",
];

export const COUNTS_PER_SECTION = 8;

export const DEFAULT_SECTION_NAMES = [
  "イントロ",
  "Aメロ",
  "サビ",
  "アウトロ",
] as const;

export function createCountSlots(count = COUNTS_PER_SECTION): import("./types").CountSlot[] {
  return Array.from({ length: count }, (_, i) => ({
    type: "count" as const,
    num: i + 1,
  }));
}

export function createDefaultSections(): import("./types").Section[] {
  return DEFAULT_SECTION_NAMES.map((name, i) => ({
    id: `sec-${i + 1}`,
    name,
    slots: createCountSlots(),
  }));
}

export const MIN_MEMBERS = 1;
export const MAX_MEMBERS = 150;
export const STORAGE_KEY = "choreo-v2-state";
export const DEFAULT_BPM = 128;
export const DEFAULT_MEMBER_COUNT = 5;

export const BAMIRI_HALF_MIN = 1;
export const BAMIRI_HALF_MAX = 20;
export const BAMIRI_DEPTH_MIN = 1;
export const BAMIRI_DEPTH_MAX = 20;

export const STAGE_SCALE_MIN = 30;
export const STAGE_SCALE_MAX = 98;

export const DEFAULT_STAGE = {
  bamiriHalfWidth: 4,
  bamiriDepth: 5,
  scaleW: 85,
  scaleH: 88,
};
