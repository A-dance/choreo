const DEMO_REFERENCE_PROJECT_ID = "demo-reference-project";

function defaultPos(index, total) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return {
    x: 50 + Math.cos(angle) * 28,
    y: 50 + Math.sin(angle) * 18,
  };
}

function buildMembers(count) {
  const colors = ["#7c5cfc", "#fc5c7d", "#3ddc84", "#ffd166", "#5cc9fc", "#ff9f43", "#a29bfe", "#55efc4"];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `M${i + 1}`,
    color: colors[i % colors.length],
  }));
}

export function buildDemoReferenceWorkspace() {
  const now = Date.now();
  const members = buildMembers(8);
  const positions1 = {};
  const positions2 = {};
  const positions3 = {};
  members.forEach((member, index) => {
    positions1[member.id] = defaultPos(index, members.length);
    positions2[member.id] = defaultPos((index + 1) % members.length, members.length);
    positions3[member.id] = defaultPos((index + 2) % members.length, members.length);
  });

  const sections = [
    {
      id: "sec-intro",
      name: "Intro",
      slots: Array.from({ length: 8 }, (_, i) => ({ type: "count", num: i + 1 })),
    },
    {
      id: "sec-a",
      name: "A",
      slots: Array.from({ length: 8 }, (_, i) => ({ type: "count", num: i + 1 })),
    },
  ];

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
            bamiriDepth: 3,
            scaleW: 1,
            scaleH: 1,
            memberDotPx: null,
          },
          nextId: 9,
          isPlaying: false,
        },
        media: {
          audioTracks: [],
          referenceVideos: [],
          musicLink: null,
        },
      },
    ],
  };
}
