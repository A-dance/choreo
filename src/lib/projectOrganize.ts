import type { ProjectFolder, ProjectSummary } from "./types";

export function projectMatchesQuery(title: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return title.toLowerCase().includes(q);
}

export function filterProjectsByQuery(
  projects: ProjectSummary[],
  query: string,
): ProjectSummary[] {
  return projects.filter((p) => projectMatchesQuery(p.songTitle, query));
}

export function projectsForFolderInSearch(
  folder: ProjectFolder,
  projects: ProjectSummary[],
  query: string,
): ProjectSummary[] {
  const inFolder = projects.filter((p) => p.folderId === folder.id);
  const q = query.trim();
  if (!q) return inFolder;
  if (projectMatchesQuery(folder.name, q)) return inFolder;
  return inFolder.filter((p) => projectMatchesQuery(p.songTitle, q));
}

export function folderMatchesSearch(
  folder: ProjectFolder,
  projects: ProjectSummary[],
  query: string,
): boolean {
  const q = query.trim();
  if (!q) return true;
  if (projectMatchesQuery(folder.name, q)) return true;
  return projects.some(
    (p) =>
      p.folderId === folder.id && projectMatchesQuery(p.songTitle, q),
  );
}

export interface SidebarProjectSection {
  key: string;
  kind: "bookmarks" | "bookmarked-folder" | "folder" | "uncategorized";
  title: string;
  folder?: ProjectFolder;
  projects: ProjectSummary[];
}

export function sidebarSectionsHaveResults(
  sections: SidebarProjectSection[],
  query: string,
): boolean {
  const q = query.trim();
  if (!q) return sections.length > 0;
  return sections.some(
    (section) =>
      section.projects.length > 0 ||
      (section.folder != null && projectMatchesQuery(section.folder.name, q)),
  );
}

export function buildSidebarProjectSections(
  projects: ProjectSummary[],
  folders: ProjectFolder[],
  query: string,
  labels: { bookmarks: string; uncategorized: string },
): SidebarProjectSection[] {
  const q = query.trim();
  const visibleProjects = filterProjectsByQuery(projects, query);
  const sections: SidebarProjectSection[] = [];

  const bookmarkedProjects = visibleProjects.filter((p) => p.bookmarked);
  const bookmarkedFolders = folders.filter((f) => f.bookmarked);

  if (bookmarkedProjects.length) {
    sections.push({
      key: "bookmarks",
      kind: "bookmarks",
      title: labels.bookmarks,
      projects: bookmarkedProjects,
    });
  }

  for (const folder of bookmarkedFolders) {
    if (!folderMatchesSearch(folder, projects, query)) continue;
    sections.push({
      key: `bookmark-folder-${folder.id}`,
      kind: "bookmarked-folder",
      title: folder.name,
      folder,
      projects: projectsForFolderInSearch(folder, projects, query),
    });
  }

  for (const folder of folders) {
    if (!folderMatchesSearch(folder, projects, query)) continue;
    sections.push({
      key: folder.id,
      kind: "folder",
      title: folder.name,
      folder,
      projects: projectsForFolderInSearch(folder, projects, query),
    });
  }

  const uncategorized = q
    ? projects.filter(
        (p) => !p.folderId && projectMatchesQuery(p.songTitle, query),
      )
    : projects.filter((p) => !p.folderId);

  if (uncategorized.length > 0 || !q) {
    sections.push({
      key: "uncategorized",
      kind: "uncategorized",
      title: labels.uncategorized,
      projects: uncategorized,
    });
  }

  return sections;
}
