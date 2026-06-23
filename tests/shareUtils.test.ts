import { describe, expect, it } from "vitest";
import { createInitialState } from "@/lib/choreoUtils";
import { isShareId } from "@/lib/shareRemote";
import {
  applySharedViewBundle,
  applySharedWorkspaceBundle,
  buildFolderShareWorkspace,
  buildSharedViewWorkspace,
  decodeLegacyShareToken,
  encodeLegacyShareToken,
  emptyProjectMedia,
  isPublicShareUrl,
  isSharedViewUrl,
  normalizeProjectMedia,
  normalizeShareWorkspace,
  parseShareFromLocation,
} from "@/lib/shareUtils";
import { makeTestWorkspace } from "./helpers/fixtures";

describe("shareUtils", () => {
  it("parses share query parameters", () => {
    expect(parseShareFromLocation("?mode=view&shareId=abc")).toEqual({
      viewOnly: true,
      shareId: "abc",
      legacyToken: null,
    });
    expect(parseShareFromLocation("?share=token123")).toEqual({
      viewOnly: false,
      shareId: null,
      legacyToken: "token123",
    });
  });

  it("detects public share URLs", () => {
    expect(isPublicShareUrl("?shareId=x")).toBe(true);
    expect(isPublicShareUrl("?mode=edit")).toBe(false);
    expect(isSharedViewUrl("?mode=view")).toBe(true);
    expect(isSharedViewUrl("?share=legacy")).toBe(true);
  });

  it("round-trips legacy share tokens", () => {
    const state = createInitialState();
    const media = emptyProjectMedia();
    const token = encodeLegacyShareToken(state, media);
    const decoded = decodeLegacyShareToken(token);
    expect(decoded?.state.songTitle).toBe(state.songTitle);
    expect(decoded?.media).toEqual(media);
  });

  it("normalizes incomplete project media", () => {
    expect(normalizeProjectMedia(null)).toEqual(emptyProjectMedia());
    expect(
      normalizeProjectMedia({
        audioTracks: [{ id: "a1", name: "Track", source: "file", createdAt: 1 }],
      }).audioTracks,
    ).toHaveLength(1);
  });

  it("normalizes share workspace and picks valid active project", () => {
    const workspace = makeTestWorkspace();
    const normalized = normalizeShareWorkspace(workspace);
    expect(normalized?.version).toBe(2);
    expect(normalized?.projects).toHaveLength(3);
    expect(normalized?.activeProjectId).toBe("proj-a");
  });

  it("rejects workspace without projects", () => {
    expect(normalizeShareWorkspace({ version: 2, projects: [] })).toBeNull();
    expect(normalizeShareWorkspace(null)).toBeNull();
  });

  it("builds folder-scoped share workspace", () => {
    const workspace = makeTestWorkspace();
    const folderShare = buildFolderShareWorkspace(workspace, "folder-a", "proj-a");
    expect(folderShare?.projects).toHaveLength(2);
    expect(folderShare?.folders).toHaveLength(1);
  });

  it("builds uncategorized folder share", () => {
    const workspace = makeTestWorkspace();
    const uncategorized = buildFolderShareWorkspace(
      workspace,
      "uncategorized",
      "proj-uncat",
    );
    expect(uncategorized?.projects).toHaveLength(1);
    expect(uncategorized?.folders).toHaveLength(0);
  });

  it("returns null when folder has no projects", () => {
    const workspace = makeTestWorkspace();
    expect(buildFolderShareWorkspace(workspace, "missing-folder", "proj-a")).toBeNull();
  });

  it("applies live state to active project in folder share", () => {
    const workspace = makeTestWorkspace();
    const live = createInitialState();
    live.songTitle = "ライブ編集中";
    const shared = buildFolderShareWorkspace(workspace, "folder-a", "proj-a", live);
    const active = shared?.projects.find((p) => p.id === "proj-a");
    expect(active?.state.songTitle).toBe("ライブ編集中");
  });

  it("builds shared view workspace with synthetic project id", () => {
    const state = createInitialState();
    const ws = buildSharedViewWorkspace(state);
    expect(ws.projects[0].id).toBe("__shared_view__");
    expect(ws.folders).toHaveLength(0);
  });

  it("applies legacy and workspace share bundles", () => {
    const state = createInitialState();
    const media = emptyProjectMedia();
    const legacy = applySharedViewBundle({ state, media }, true);
    expect(legacy.appMode).toBe("view");

    const workspace = makeTestWorkspace();
    const fromWorkspace = applySharedWorkspaceBundle(workspace, false);
    expect(fromWorkspace.appMode).toBe("edit");
    expect(fromWorkspace.state.songTitle).toBeTruthy();
  });

  it("decodes legacy token v1 without media", () => {
    const state = createInitialState();
    const payload = JSON.stringify({ v: 1, state });
    const token = Buffer.from(payload, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const decoded = decodeLegacyShareToken(token);
    expect(decoded?.state.songTitle).toBe(state.songTitle);
    expect(decoded?.media).toEqual(emptyProjectMedia());
  });

  it("rejects invalid legacy tokens", () => {
    expect(decodeLegacyShareToken("not-valid")).toBeNull();
  });
});

describe("shareRemote isShareId", () => {
  it("accepts UUID v4 style ids", () => {
    expect(isShareId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("rejects invalid ids", () => {
    expect(isShareId(null)).toBe(false);
    expect(isShareId("not-a-uuid")).toBe(false);
    expect(isShareId("")).toBe(false);
  });
});
