import assert from "node:assert/strict";
import { test } from "node:test";
import { buildDemoReferenceWorkspace } from "../scripts/demoWorkspacePayload.mjs";

test("demo workspace matches app reference shape", () => {
  const workspace = buildDemoReferenceWorkspace();
  assert.equal(workspace.version, 2);
  assert.equal(workspace.projects.length, 1);
  assert.equal(workspace.activeProjectId, workspace.projects[0].id);

  const project = workspace.projects[0];
  assert.equal(project.state.songTitle, "サンプル（参考）");
  assert.equal(project.state.members.length, 5);
  assert.equal(project.state.sections.length, 4);
  assert.ok(project.state.countData[1]?.positions);
  assert.ok(project.state.countData[3]?.positions);
});
