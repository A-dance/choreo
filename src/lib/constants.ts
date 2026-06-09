import type { ProjectLanguage } from "./uiStrings";

export const COLORS = [
  "#7c5cfc", "#fc5c7d", "#5cc8fc", "#fcb45c", "#5cfc8f",
  "#fc5cf0", "#c8fc5c", "#fc8e5c", "#5c8efc", "#fc5cba",
  "#a78bfa", "#34d399", "#f472b6", "#fb923c", "#38bdf8",
  "#e879f9", "#4ade80", "#facc15", "#f87171", "#60a5fa",
];

export const COUNTS_PER_SECTION = 8;

const SECTION_NAMES: Record<ProjectLanguage, readonly string[]> = {
  en: ["Intro", "Verse A", "Chorus", "Outro"],
  ja: ["イントロ", "Aメロ", "サビ", "アウトロ"],
};

const OUTRO_NAMES: Record<ProjectLanguage, string> = {
  en: "Outro",
  ja: "アウトロ",
};

export function getDefaultSectionNames(
  language: ProjectLanguage = "en",
): readonly string[] {
  return SECTION_NAMES[language];
}

export function getOutroSectionName(language: ProjectLanguage = "en"): string {
  return OUTRO_NAMES[language];
}

export function isOutroSectionName(name: string): boolean {
  return name === OUTRO_NAMES.en || name === OUTRO_NAMES.ja;
}

/** @deprecated use getOutroSectionName(language) */
export const OUTRO_SECTION_NAME = OUTRO_NAMES.en;

/** @deprecated use getDefaultSectionNames(language) */
export const DEFAULT_SECTION_NAMES = SECTION_NAMES.en;

export function createCountSlots(count = COUNTS_PER_SECTION): import("./types").CountSlot[] {
  return Array.from({ length: count }, (_, i) => ({
    type: "count" as const,
    num: i + 1,
  }));
}

export function createDefaultSections(
  countsPerSection = COUNTS_PER_SECTION,
  language: ProjectLanguage = "en",
): import("./types").Section[] {
  const counts = Math.max(1, Math.min(64, Math.round(countsPerSection)));
  const outroName = getOutroSectionName(language);
  return getDefaultSectionNames(language).map((name, i) => ({
    id: `sec-${i + 1}`,
    name,
    slots:
      name === outroName
        ? [{ type: "count" as const, num: 1 }]
        : createCountSlots(counts),
  }));
}

export const MIN_MEMBERS = 1;
export const MAX_MEMBERS = 500;
export const LEGACY_STORAGE_KEY = "choreo-v2-state";
export const WORKSPACE_STORAGE_KEY = "choreo-v3-workspace";
/** @deprecated use WORKSPACE_STORAGE_KEY */
export const STORAGE_KEY = LEGACY_STORAGE_KEY;

export const MIN_COUNTS_PER_SECTION = 1;
export const MAX_COUNTS_PER_SECTION = 64;
export const DEFAULT_BPM = 128;
export const DEFAULT_MEMBER_COUNT = 5;

export const BAMIRI_HALF_MIN = 1;
export const BAMIRI_HALF_MAX = 20;
export const BAMIRI_DEPTH_MIN = 1;
export const BAMIRI_DEPTH_MAX = 20;

export const STAGE_SCALE_MIN = 30;
export const STAGE_SCALE_MAX = 95;

export const MEMBER_DOT_MIN = 14;
export const MEMBER_DOT_MAX = 64;

export const DEFAULT_STAGE = {
  bamiriHalfWidth: 4,
  bamiriDepth: 5,
  scaleW: 85,
  scaleH: 88,
  memberDotPx: null as number | null,
};
