import { describe, expect, it } from "vitest";
import { DEMO_ACCOUNT_EMAIL } from "@/lib/passwordPolicy";
import { pickWorkspaceSource, resolveUserWorkspace } from "@/lib/cloudSync";
import { createEmptyWorkspace } from "@/lib/projectStore";
import { makeTestWorkspace } from "./helpers/fixtures";

describe("cloudSync workspace resolution", () => {
  it("prefers newer cloud workspace when timestamps favor cloud", () => {
    const local = makeTestWorkspace();
    const cloudWorkspace = makeTestWorkspace();
    cloudWorkspace.projects[0].state.songTitle = "クラウド版";
    const picked = pickWorkspaceSource(local, {
      workspace: cloudWorkspace,
      updatedAt: Date.now() + 10_000,
    });
    expect(picked?.projects[0].state.songTitle).toBe("クラウド版");
  });

  it("keeps local when it is newer than cloud", () => {
    const local = makeTestWorkspace();
    local.projects[0].updatedAt = Date.now() + 99_000;
    const cloudWorkspace = makeTestWorkspace();
    const picked = pickWorkspaceSource(local, {
      workspace: cloudWorkspace,
      updatedAt: 1,
    });
    expect(picked).toBe(local);
  });

  it("seeds demo account when cloud is empty", () => {
    const resolution = resolveUserWorkspace(DEMO_ACCOUNT_EMAIL, null, null);
    expect(resolution?.kind).toBe("demo-seed");
    expect(resolution?.workspace.projects.length).toBeGreaterThan(0);
  });

  it("returns empty workspace for new non-demo users", () => {
    const resolution = resolveUserWorkspace("user@example.com", null, null);
    expect(resolution?.kind).toBe("empty");
    expect(resolution?.workspace).toEqual(createEmptyWorkspace());
  });

  it("uses cloud when available", () => {
    const cloudWorkspace = makeTestWorkspace();
    const resolution = resolveUserWorkspace("user@example.com", null, {
      workspace: cloudWorkspace,
      updatedAt: 100,
    });
    expect(resolution?.kind).toBe("cloud");
  });
});
