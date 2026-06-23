/** Mirrors src/lib/demoWorkspace.ts — keep in sync for scripts + CI smoke tests. */
export const DEMO_FOLDER_ID = "demo-folder-1";
export const DEMO_REFERENCE_PROJECT_ID = "demo-reference-project";
export const DEMO_SONG_B_ID = "demo-song-b";
export const DEMO_SONG_OTHER_ID = "demo-song-other";

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
    slots:
      name === "アウトロ"
        ? [{ type: "count", num: 1 }]
        : createCountSlots(countsPerSection),
  }));
}

function buildMembers(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: String(i + 1),
    color: COLORS[i % COLORS.length],
  }));
}

function buildReferenceState() {
  const members = buildMembers(5);
  const sections = createDefaultSectionsJa(8);

  const positions1 = {};
  const positions2 = {};
  const positions3 = {};
  members.forEach((member, index) => {
    positions1[member.id] = defaultPos(index, members.length);
    positions2[member.id] = defaultPos(
      (index + 1) % members.length,
      members.length,
    );
    positions3[member.id] = defaultPos(
      (index + 2) % members.length,
      members.length,
    );
  });

  return {
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
  };
}

function buildSimpleState(songTitle, bpm = 120) {
  const members = buildMembers(4);
  const sections = createDefaultSectionsJa(4);
  const positions = {};
  members.forEach((member, index) => {
    positions[member.id] = defaultPos(index, members.length);
  });
  return {
    songTitle,
    language: "ja",
    sections,
    members,
    removedMembers: [],
    bpm,
    currentCount: 1,
    countData: {
      1: { positions, memo: "" },
    },
    stage: {
      bamiriHalfWidth: 4,
      bamiriDepth: 5,
      scaleW: 85,
      scaleH: 88,
      memberDotPx: null,
    },
    nextId: 5,
    isPlaying: false,
  };
}

function emptyMedia() {
  return { audioTracks: [], referenceVideos: [] };
}

export function buildDemoReferenceWorkspace() {
  const now = Date.now();
  return {
    version: 2,
    activeProjectId: DEMO_REFERENCE_PROJECT_ID,
    folders: [
      {
        id: DEMO_FOLDER_ID,
        name: "デモセット",
        createdAt: now,
        collapsed: false,
        bookmarked: false,
      },
    ],
    projects: [
      {
        id: DEMO_REFERENCE_PROJECT_ID,
        createdAt: now,
        updatedAt: now,
        folderId: DEMO_FOLDER_ID,
        bookmarked: true,
        state: buildReferenceState(),
        media: emptyMedia(),
      },
      {
        id: DEMO_SONG_B_ID,
        createdAt: now,
        updatedAt: now,
        folderId: DEMO_FOLDER_ID,
        bookmarked: false,
        state: buildSimpleState("サンプル B", 132),
        media: emptyMedia(),
      },
      {
        id: DEMO_SONG_OTHER_ID,
        createdAt: now,
        updatedAt: now,
        folderId: null,
        bookmarked: false,
        state: buildSimpleState("その他の曲", 110),
        media: emptyMedia(),
      },
    ],
  };
}
