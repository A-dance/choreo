import { describe, expect, it } from "vitest";
import {
  DEMO_FOLDER_ID,
  DEMO_REFERENCE_PROJECT_ID,
  buildDemoReferenceWorkspace,
} from "../scripts/demoWorkspacePayload.mjs";

/** CI スモーク: デモ用スクリプトと TypeScript 側の定数がずれていないか */
describe("demoWorkspacePayload", () => {
  it("exports stable demo ids", () => {
    expect(DEMO_FOLDER_ID).toBe("demo-folder-1");
    expect(DEMO_REFERENCE_PROJECT_ID).toBe("demo-reference-project");
  });

  it("builds a v2 workspace with folder and multiple songs", () => {
    const workspace = buildDemoReferenceWorkspace();
    expect(workspace.version).toBe(2);
    expect(workspace.folders.some((f) => f.id === DEMO_FOLDER_ID)).toBe(true);
    expect(workspace.projects.length).toBeGreaterThanOrEqual(3);
  });
});
