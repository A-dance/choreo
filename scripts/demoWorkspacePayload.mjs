/** Mirrors src/lib/demoWorkspace.ts + createDemoReferenceState (ja). */
export const DEMO_REFERENCE_PROJECT_ID = "demo-reference-project";

const COLORS = [
  "#7c5cfc", "#fc5c7d", "#5cc8fc", "#fcb45c", "#5cfc8f",
];

function defaultPos(index, total) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return {
    x: 50 + Math.cos(angle) * 28,
    y: 50 + Math.sin(angle) * 18,
  };
}

function createCountSlots(count) {
  return Array.from({ length: count }, (_, i) => ({
    type: "count",
    num: i + 1,
  }));
}

function createDefaultSectionsJa(countsPerSection = 8) {
  const names = ["イントロ", "Aメロ", "サビ", "アウトロ"];
  return names.map((name, i) => ({
    id: `sec-${i + 1}`,
    name,
    slots: name === "アウトロ" ? [{ type: "count", num: 1 }] : createCountSlots(countsPerSection),
  }));
}

function buildMembers(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: String(i + 1),
    color: COLORS[i % COLORS.length],
  }));
}

export function buildDemoReferenceWorkspace() {
  const now = Date.now();
  const members = buildMembers(5);
  const sections = createDefaultSectionsJa(8);

  const positions1 = {};
  const positions2 = {};
  const positions3 = {};
  members.forEach((member, index) => {
    positions1[member.id] = defaultPos(index, members.length);
    positions2[member.id] = defaultPos((index + 1) % members.length, members.length);
    positions3[member.id] = defaultPos((index + 2) % members.length, members.length);
  });

  return {
    version: 2,
    activeProjectId: DEMO_REFERENCE_PROJECT_ID,
    folders: [],
    projects: [
      {
        id: DEMO_REFERENCE_PROJECT_ID,
        createdAt: now,
        updatedAt: now,
        state: {
          songTitle: "サンプル（参考）",
          language: "ja",
          sections,
          members,
          removedMembers: [],
          bpm: 128,
          currentCount: 3,
          countData: {
            1: { positions: positions1, memo: "" },
            2: { positions: positions2, memo: "" },
            3: { positions: positions3, memo: "" },
          },
          stage: {
            bamiriHalfWidth: 4,
            bamiriDepth: 5,
            scaleW: 85,
            scaleH: 88,
            memberDotPx: null,
          },
          nextId: 6,
          isPlaying: false,
        },
        media: {
          audioTracks: [],
          referenceVideos: [],
          musicLink: null,
        },
        folderId: null,
        bookmarked: false,
      },
    ],
  };
}
