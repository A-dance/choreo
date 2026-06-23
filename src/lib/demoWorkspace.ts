import { createDemoReferenceState, createProjectState } from "./choreoUtils";
import { DEMO_ACCOUNT_EMAIL } from "./passwordPolicy";
import { createProjectRecord } from "./projectStore";
import type { Workspace } from "./types";

export const DEMO_FOLDER_ID = "demo-folder-1";
export const DEMO_REFERENCE_PROJECT_ID = "demo-reference-project";
export const DEMO_SONG_B_ID = "demo-song-b";
export const DEMO_SONG_OTHER_ID = "demo-song-other";

export function isDemoAccountEmail(email: string): boolean {
  return email.trim().toLowerCase() === DEMO_ACCOUNT_EMAIL;
}

/** 評価用デモ: Pro 想定・フォルダー + 複数曲（scripts/demoWorkspacePayload.mjs と同期） */
export function createDemoReferenceWorkspace(): Workspace {
  const now = Date.now();
  const main = createProjectRecord(
    createDemoReferenceState("ja"),
    DEMO_REFERENCE_PROJECT_ID,
  );
  const songB = createProjectRecord(
    createProjectState({
      songTitle: "サンプル B",
      bpm: 132,
      countsPerSection: 4,
      memberCount: 4,
      language: "ja",
    }),
    DEMO_SONG_B_ID,
  );
  const songOther = createProjectRecord(
    createProjectState({
      songTitle: "その他の曲",
      bpm: 110,
      countsPerSection: 4,
      memberCount: 4,
      language: "ja",
    }),
    DEMO_SONG_OTHER_ID,
  );

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
      { ...main, folderId: DEMO_FOLDER_ID, bookmarked: true },
      { ...songB, folderId: DEMO_FOLDER_ID },
      { ...songOther, folderId: null },
    ],
  };
}
