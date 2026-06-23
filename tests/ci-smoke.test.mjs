import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEMO_FOLDER_ID,
  DEMO_REFERENCE_PROJECT_ID,
  DEMO_SONG_B_ID,
  DEMO_SONG_OTHER_ID,
  buildDemoReferenceWorkspace,
} from "../scripts/demoWorkspacePayload.mjs";

test("demo workspace matches app reference shape", () => {
  const workspace = buildDemoReferenceWorkspace();
  assert.equal(workspace.version, 2);
  assert.equal(workspace.projects.length, 3);
  assert.equal(workspace.folders.length, 1);
  assert.equal(workspace.folders[0].id, DEMO_FOLDER_ID);
  assert.equal(workspace.activeProjectId, DEMO_REFERENCE_PROJECT_ID);

  const main = workspace.projects.find((p) => p.id === DEMO_REFERENCE_PROJECT_ID);
  const songB = workspace.projects.find((p) => p.id === DEMO_SONG_B_ID);
  const songOther = workspace.projects.find((p) => p.id === DEMO_SONG_OTHER_ID);

  assert.ok(main);
  assert.equal(main.folderId, DEMO_FOLDER_ID);
  assert.equal(main.state.songTitle, "サンプル（参考）");
  assert.equal(main.state.members.length, 5);
  assert.equal(main.state.sections.length, 4);
  assert.ok(main.state.countData[1]?.positions);
  assert.ok(main.state.countData[3]?.positions);

  assert.ok(songB);
  assert.equal(songB.folderId, DEMO_FOLDER_ID);
  assert.equal(songB.state.songTitle, "サンプル B");

  assert.ok(songOther);
  assert.equal(songOther.folderId, null);
  assert.equal(songOther.state.songTitle, "その他の曲");
});
