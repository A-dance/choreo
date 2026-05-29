import { COUNTS_PER_SECTION, createCountSlots, createDefaultSections } from "./constants";
import type { CountSlot, FlatSlot, Section } from "./types";

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
    return { ...sec, slots };
  });
}

export function appendSection(
  sections: Section[],
  name?: string,
): Section[] {
  let maxId = 0;
  for (const s of sections) {
    const m = /^sec-(\d+)$/.exec(s.id);
    if (m) maxId = Math.max(maxId, +m[1]);
  }
  const id = `sec-${maxId + 1}`;
  const label = name?.trim() || `セクション${sections.length + 1}`;
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
