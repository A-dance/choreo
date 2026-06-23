import { describe, expect, it } from "vitest";
import {
  buildSidebarProjectSections,
  filterProjectsByQuery,
  folderMatchesSearch,
  projectMatchesQuery,
  projectsForFolderInSearch,
  sidebarSectionsHaveResults,
} from "@/lib/projectOrganize";
import type { ProjectFolder, ProjectSummary } from "@/lib/types";
import { makeTestWorkspace } from "./helpers/fixtures";

function toSummaries(workspace = makeTestWorkspace()): ProjectSummary[] {
  return workspace.projects.map((p) => ({
    id: p.id,
    songTitle: p.state.songTitle,
    bpm: p.state.bpm,
    folderId: p.folderId ?? null,
    bookmarked: Boolean(p.bookmarked),
    updatedAt: p.updatedAt,
    audioCount: p.media.audioTracks.length,
    videoCount: p.media.referenceVideos.length,
  }));
}

describe("projectOrganize", () => {
  const workspace = makeTestWorkspace();
  const projects = toSummaries(workspace);
  const folders = workspace.folders;
  const labels = { bookmarks: "お気に入り", uncategorized: "未分類" };

  it("matches project titles case-insensitively", () => {
    expect(projectMatchesQuery("曲アルファ", "アル")).toBe(true);
    expect(projectMatchesQuery("曲アルファ", "GAMMA")).toBe(false);
    expect(projectMatchesQuery("Any", "")).toBe(true);
  });

  it("filters projects by query", () => {
    expect(filterProjectsByQuery(projects, "ベータ").map((p) => p.id)).toEqual([
      "proj-b",
    ]);
  });

  it("shows all folder projects when folder name matches", () => {
    const folder = folders[0];
    const inFolder = projectsForFolderInSearch(folder, projects, "セット");
    expect(inFolder).toHaveLength(2);
  });

  it("filters within folder when only song matches", () => {
    const folder = folders[0];
    const inFolder = projectsForFolderInSearch(folder, projects, "ベータ");
    expect(inFolder.map((p) => p.id)).toEqual(["proj-b"]);
  });

  it("detects folder match via name or child song", () => {
    const folder = folders[0];
    expect(folderMatchesSearch(folder, projects, "セット")).toBe(true);
    expect(folderMatchesSearch(folder, projects, "未分類")).toBe(false);
    expect(folderMatchesSearch(folder, projects, "ベータ")).toBe(true);
  });

  it("builds sidebar sections with bookmarks and folders", () => {
    const sections = buildSidebarProjectSections(projects, folders, "", labels);
    expect(sections.some((s) => s.kind === "bookmarks")).toBe(true);
    expect(sections.some((s) => s.kind === "folder")).toBe(true);
    expect(sections.some((s) => s.kind === "uncategorized")).toBe(true);
  });

  it("reports whether search has visible sections", () => {
    const matching = buildSidebarProjectSections(projects, folders, "ベータ", labels);
    expect(sidebarSectionsHaveResults(matching, "ベータ")).toBe(true);

    const none = buildSidebarProjectSections(projects, folders, "存在しない", labels);
    expect(sidebarSectionsHaveResults(none, "存在しない")).toBe(false);
  });

  it("matches empty folder name only when query empty", () => {
    const emptyFolder: ProjectFolder = {
      id: "empty",
      name: "空フォルダ",
      createdAt: 1,
      collapsed: false,
      bookmarked: false,
    };
    expect(folderMatchesSearch(emptyFolder, projects, "")).toBe(true);
    expect(folderMatchesSearch(emptyFolder, projects, "空")).toBe(true);
  });
});
