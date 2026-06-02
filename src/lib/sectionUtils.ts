import {
  COUNTS_PER_SECTION,
  createCountSlots,
  createDefaultSections,
  isOutroSectionName,
} from "./constants";
import type { CountSlot, FlatSlot, Section } from "./types";
import type { ProjectLanguage } from "./uiStrings";
import { getStrings } from "./uiStrings";

export function sectionHidesCountButtons(section: Pick<Section, "name">): boolean {
  return isOutroSectionName(section.name);
}

export function slotLabel(slot: CountSlot): string {
  return slot.type === "half" ? "&" : String(slot.num);
}

export function flattenTimeline(sections: Section[]): FlatSlot[] {
  const out: FlatSlot[] = [];
  let globalIndex = 0;
  for (const sec of sections) {
    sec.slots.forEach((slot, slotIndex) => {
      globalIndex += 1;
      out.push({
        globalIndex,
        sectionId: sec.id,
        sectionName: sec.name,
        slotIndex,
        slot,
        label: slotLabel(slot),
        isHalf: slot.type === "half",
      });
    });
  }
  return out;
}

export function getTotalSlots(sections: Section[]): number {
  return sections.reduce((n, s) => n + s.slots.length, 0);
}

export function getFlatSlot(
  sections: Section[],
  globalIndex: number,
): FlatSlot | undefined {
  return flattenTimeline(sections).find((s) => s.globalIndex === globalIndex);
}

export function getCurrentSection(
  sections: Section[],
  globalIndex: number,
): Section | undefined {
  const flat = getFlatSlot(sections, globalIndex);
  if (!flat) return sections[0];
  return sections.find((s) => s.id === flat.sectionId) ?? sections[0];
}

export function slotGlobalIndex(
  sections: Section[],
  sectionId: string,
  slotIndex: number,
): number {
  let idx = 0;
  for (const sec of sections) {
    for (let i = 0; i < sec.slots.length; i++) {
      idx += 1;
      if (sec.id === sectionId && i === slotIndex) return idx;
    }
  }
  return idx;
}

export function insertHalfSlot(
  sections: Section[],
  sectionId: string,
  afterSlotIndex: number,
): Section[] {
  return sections.map((sec) => {
    if (sec.id !== sectionId) return sec;
    const slots = [...sec.slots];
    slots.splice(afterSlotIndex + 1, 0, { type: "half" });
    return { ...sec, slots };
  });
}

export function removeHalfSlot(
  sections: Section[],
  sectionId: string,
  slotIndex: number,
): Section[] {
  return sections.map((sec) => {
    if (sec.id !== sectionId) return sec;
    if (sec.slots[slotIndex]?.type !== "half") return sec;
    const slots = [...sec.slots];
    slots.splice(slotIndex, 1);
    return { ...sec, slots: renumberCountSlots(slots) };
  });
}

function renumberCountSlots(slots: CountSlot[]): CountSlot[] {
  let num = 1;
  return slots.map((s) =>
    s.type === "half" ? s : { type: "count" as const, num: num++ },
  );
}

/** 半カウント・フルカウントを問わず1スロット削除（セクション最低1スロット） */
export function removeSlotAt(
  sections: Section[],
  sectionId: string,
  slotIndex: number,
): Section[] | null {
  let changed = false;
  const next = sections.map((sec) => {
    if (sec.id !== sectionId) return sec;
    if (sec.slots.length <= 1) return sec;
    if (slotIndex < 0 || slotIndex >= sec.slots.length) return sec;
    const slots = [...sec.slots];
    slots.splice(slotIndex, 1);
    changed = true;
    return { ...sec, slots: renumberCountSlots(slots) };
  });
  return changed ? next : null;
}

export function appendSection(
  sections: Section[],
  name?: string,
  language: ProjectLanguage = "en",
): Section[] {
  let maxId = 0;
  for (const s of sections) {
    const m = /^sec-(\d+)$/.exec(s.id);
    if (m) maxId = Math.max(maxId, +m[1]);
  }
  const id = `sec-${maxId + 1}`;
  const label =
    name?.trim() || getStrings(language).sectionNameDefault(sections.length + 1);
  return [
    ...sections,
    { id, name: label, slots: createCountSlots() },
  ];
}

export function renameSection(
  sections: Section[],
  sectionId: string,
  name: string,
): Section[] {
  const trimmed = name.trim();
  if (!trimmed) return sections;
  return sections.map((sec) =>
    sec.id === sectionId ? { ...sec, name: trimmed } : sec,
  );
}

export function removeSection(
  sections: Section[],
  sectionId: string,
): Section[] | null {
  if (sections.length <= 1) return null;
  return sections.filter((sec) => sec.id !== sectionId);
}

export function appendCountToSection(
  sections: Section[],
  sectionId: string,
  maxCounts = COUNTS_PER_SECTION,
): Section[] {
  return sections.map((sec) => {
    if (sec.id !== sectionId) return sec;
    const fullSlots = sec.slots.filter((s) => s.type === "count");
    if (fullSlots.length >= maxCounts) return sec;
    let nextNum = 1;
    for (const slot of sec.slots) {
      if (slot.type === "count") nextNum = Math.max(nextNum, slot.num + 1);
    }
    return {
      ...sec,
      slots: [...sec.slots, { type: "count" as const, num: nextNum }],
    };
  });
}

export function moveSection(
  sections: Section[],
  sectionId: string,
  delta: -1 | 1,
): Section[] {
  const idx = sections.findIndex((s) => s.id === sectionId);
  if (idx < 0) return sections;
  const target = idx + delta;
  if (target < 0 || target >= sections.length) return sections;
  const next = [...sections];
  [next[idx], next[target]] = [next[target], next[idx]];
  return next;
}

export function swapSections(
  sections: Section[],
  sectionIdA: string,
  sectionIdB: string,
): Section[] {
  const idxA = sections.findIndex((s) => s.id === sectionIdA);
  const idxB = sections.findIndex((s) => s.id === sectionIdB);
  if (idxA < 0 || idxB < 0 || idxA === idxB) return sections;
  const next = [...sections];
  [next[idxA], next[idxB]] = [next[idxB], next[idxA]];
  return next;
}

export function reorderSections(
  sections: Section[],
  fromIndex: number,
  toIndex: number,
): Section[] {
  if (fromIndex === toIndex) return sections;
  if (fromIndex < 0 || toIndex < 0) return sections;
  if (fromIndex >= sections.length || toIndex >= sections.length) return sections;
  const next = [...sections];
  const [removed] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, removed);
  return next;
}

export function slotDataKey(sectionId: string, slotIndex: number): string {
  return `${sectionId}:${slotIndex}`;
}

export function remapCountDataBySlots(
  oldSections: Section[],
  newSections: Section[],
  countData: Record<number, import("./types").CountData>,
): Record<number, import("./types").CountData> {
  const oldFlat = flattenTimeline(oldSections);
  const newFlat = flattenTimeline(newSections);
  const byKey = new Map<string, import("./types").CountData>();
  for (const f of oldFlat) {
    const cd = countData[f.globalIndex];
    if (cd) byKey.set(slotDataKey(f.sectionId, f.slotIndex), cd);
  }
  const out: Record<number, import("./types").CountData> = {};
  for (const f of newFlat) {
    const cd = byKey.get(slotDataKey(f.sectionId, f.slotIndex));
    if (cd) out[f.globalIndex] = cd;
  }
  return out;
}

export function remapCurrentCount(
  oldSections: Section[],
  newSections: Section[],
  currentCount: number,
  deletedSectionId?: string,
): number {
  const oldFlat = flattenTimeline(oldSections);
  const newFlat = flattenTimeline(newSections);
  if (!newFlat.length) return 1;
  const current = oldFlat.find((f) => f.globalIndex === currentCount);
  if (!current) return 1;

  if (deletedSectionId && current.sectionId === deletedSectionId) {
    const oldIdx = oldSections.findIndex((s) => s.id === deletedSectionId);
    const fallbackSection = newSections[Math.min(oldIdx, newSections.length - 1)];
    return (
      newFlat.find((f) => f.sectionId === fallbackSection?.id)?.globalIndex ?? 1
    );
  }

  const mapped = newFlat.find(
    (f) =>
      f.sectionId === current.sectionId && f.slotIndex === current.slotIndex,
  );
  return mapped?.globalIndex ?? Math.min(currentCount, newFlat.length);
}

interface LegacySection {
  id?: string;
  name: string;
  start?: number;
  end?: number;
  slots?: CountSlot[];
}

export function migrateSections(raw: LegacySection[] | undefined): Section[] {
  if (!raw?.length) {
    return createDefaultSections();
  }

  if ("slots" in raw[0] && Array.isArray(raw[0].slots)) {
    return raw.map((sec, i) => ({
      id: sec.id ?? `sec-${i + 1}`,
      name: sec.name,
      slots: normalizeSlots(sec.slots ?? []),
    }));
  }

  return raw.map((sec, i) => {
    const len =
      sec.start != null && sec.end != null
        ? Math.max(1, sec.end - sec.start + 1)
        : COUNTS_PER_SECTION;
    return {
      id: sec.id ?? `sec-${i + 1}`,
      name: sec.name,
      slots: Array.from({ length: len }, (_, j) => ({
        type: "count" as const,
        num: (j % COUNTS_PER_SECTION) + 1,
      })),
    };
  });
}

function normalizeSlots(slots: CountSlot[]): CountSlot[] {
  return slots.map((s) =>
    s.type === "half" ? { type: "half" } : { type: "count", num: clampCountNum(s.num) },
  );
}

function clampCountNum(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(COUNTS_PER_SECTION, Math.round(n)));
}

export function shiftCountDataInsert(
  countData: Record<number, import("./types").CountData>,
  insertAt: number,
): Record<number, import("./types").CountData> {
  const out = { ...countData };
  const keys = Object.keys(out)
    .map(Number)
    .filter((k) => k >= insertAt)
    .sort((a, b) => b - a);
  for (const k of keys) {
    out[k + 1] = out[k];
    delete out[k];
  }
  return out;
}

export function shiftCountDataRemove(
  countData: Record<number, import("./types").CountData>,
  removeAt: number,
): Record<number, import("./types").CountData> {
  const out = { ...countData };
  delete out[removeAt];
  const keys = Object.keys(out)
    .map(Number)
    .filter((k) => k > removeAt)
    .sort((a, b) => a - b);
  for (const k of keys) {
    out[k - 1] = out[k];
    delete out[k];
  }
  return out;
}
