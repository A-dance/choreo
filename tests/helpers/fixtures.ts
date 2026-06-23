import { createProjectState } from "@/lib/choreoUtils";
import { emptyProjectMedia } from "@/lib/shareUtils";
import type { ProjectFolder, ProjectRecord, Workspace } from "@/lib/types";

/** UT 用の最小ワークスペース（共有・サイドバー検索のテストで再利用） */
export function makeTestWorkspace(): Workspace {
  const folder: ProjectFolder = {
    id: "folder-a",
    name: "セットA",
    createdAt: 1,
    collapsed: false,
    bookmarked: false,
  };
  const stateA = createProjectState({
    songTitle: "曲アルファ",
    bpm: 120,
    countsPerSection: 4,
    memberCount: 3,
    language: "ja",
  });
  const stateB = createProjectState({
    songTitle: "曲ベータ",
    bpm: 100,
    countsPerSection: 4,
    memberCount: 3,
    language: "ja",
  });
  const projects: ProjectRecord[] = [
    {
      id: "proj-a",
      createdAt: 1,
      updatedAt: 2,
      folderId: folder.id,
      bookmarked: true,
      state: stateA,
      media: emptyProjectMedia(),
    },
    {
      id: "proj-b",
      createdAt: 1,
      updatedAt: 3,
      folderId: folder.id,
      bookmarked: false,
      state: stateB,
      media: emptyProjectMedia(),
    },
    {
      id: "proj-uncat",
      createdAt: 1,
      updatedAt: 4,
      folderId: null,
      bookmarked: false,
      state: createProjectState({
        songTitle: "未分類曲",
        bpm: 90,
        countsPerSection: 4,
        memberCount: 2,
        language: "ja",
      }),
      media: emptyProjectMedia(),
    },
  ];
  return {
    version: 2,
    activeProjectId: "proj-a",
    folders: [folder],
    projects,
  };
}
