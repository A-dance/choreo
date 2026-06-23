"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useChoreo } from "@/context/ChoreoContext";
import { useProfile } from "@/context/ProfileContext";
import {
  buildSidebarProjectSections,
  sidebarSectionsHaveResults,
} from "@/lib/projectOrganize";
import type { SidebarProjectSection } from "@/lib/projectOrganize";
import { canCreateProject } from "@/lib/subscription";
import type { ProjectFolder, ProjectSummary } from "@/lib/types";
import { formatProjectSavedAt } from "@/lib/videoLinkUtils";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { MediaPanel, type MediaPanelSection } from "@/components/MediaPanel";
import {
  ChevronIcon,
  FolderIcon,
  FolderPlusIcon,
  ProjectIcon,
  SearchIcon,
  StarIcon,
} from "@/components/sidebarIcons";

interface ProjectSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ open, onClose }: ProjectSidebarProps) {
  const {
    projects,
    folders,
    activeProjectId,
    switchProject,
    deleteProject,
    renameProject,
    reorderProjects,
    createFolder,
    renameFolder,
    deleteFolder,
    toggleFolderCollapsed,
    toggleFolderBookmark,
    setProjectFolder,
    toggleProjectBookmark,
    isViewOnly,
    externalShareView,
    language,
    strings: UI,
  } = useChoreo();
  const { plan } = useProfile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [mediaPanelOpen, setMediaPanelOpen] = useState(false);
  const [mediaSection, setMediaSection] = useState<MediaPanelSection>("audio");
  const [dragProjectId, setDragProjectId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderRenameDraft, setFolderRenameDraft] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectRenameDraft, setProjectRenameDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    songTitle: string;
  } | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const switchClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canDragProject =
    !isViewOnly &&
    !searchQuery.trim() &&
    (projects.length > 1 || folders.length > 0);

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const visibleProjects = isViewOnly
    ? externalShareView
      ? projects
      : projects.filter((p) => p.id === activeProjectId)
    : projects;

  const folderNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const folder of folders) map.set(folder.id, folder.name);
    return map;
  }, [folders]);

  const sections = useMemo(() => {
    if (isViewOnly) return [];
    return buildSidebarProjectSections(projects, folders, searchQuery, {
      bookmarks: UI.bookmarksSection,
      uncategorized: UI.uncategorizedSection,
    });
  }, [isViewOnly, projects, folders, searchQuery, UI.bookmarksSection, UI.uncategorizedSection]);

  const hasSearchResults = useMemo(() => {
    return sidebarSectionsHaveResults(sections, searchQuery);
  }, [sections, searchQuery]);

  const sectionBlocks = useMemo(() => {
    const blocks: Array<{
      id: string;
      kind: "bookmarks" | "folders" | "uncategorized";
      sections: SidebarProjectSection[];
    }> = [];

    const bookmarkSections = sections.filter(
      (section) =>
        section.kind === "bookmarks" || section.kind === "bookmarked-folder",
    );
    const folderSections = sections.filter((section) => section.kind === "folder");
    const uncategorizedSections = sections.filter(
      (section) => section.kind === "uncategorized",
    );

    if (bookmarkSections.length) {
      blocks.push({
        id: "bookmarks",
        kind: "bookmarks",
        sections: bookmarkSections,
      });
    }
    if (folderSections.length) {
      blocks.push({
        id: "folders",
        kind: "folders",
        sections: folderSections,
      });
    }
    if (uncategorizedSections.length) {
      blocks.push({
        id: "uncategorized",
        kind: "uncategorized",
        sections: uncategorizedSections,
      });
    }

    return blocks;
  }, [sections]);

  useEffect(() => {
    if (!open && !deleteTarget && !deleteFolderTarget) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (deleteFolderTarget) {
        setDeleteFolderTarget(null);
        return;
      }
      if (deleteTarget) {
        setDeleteTarget(null);
        return;
      }
      if (editingProjectId) {
        setEditingProjectId(null);
        return;
      }
      if (editingFolderId) {
        setEditingFolderId(null);
        return;
      }
      if (open) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    open,
    onClose,
    deleteTarget,
    deleteFolderTarget,
    editingFolderId,
    editingProjectId,
  ]);

  const handleSwitch = (projectId: string) => {
    if (editingProjectId) return;
    switchProject(projectId);
  };

  const scheduleProjectSwitch = (projectId: string) => {
    if (editingProjectId) return;
    if (switchClickTimerRef.current) {
      clearTimeout(switchClickTimerRef.current);
    }
    switchClickTimerRef.current = setTimeout(() => {
      switchClickTimerRef.current = null;
      handleSwitch(projectId);
    }, 220);
  };

  const startProjectRename = (projectId: string, songTitle: string) => {
    if (switchClickTimerRef.current) {
      clearTimeout(switchClickTimerRef.current);
      switchClickTimerRef.current = null;
    }
    setEditingProjectId(projectId);
    setProjectRenameDraft(songTitle);
  };

  const commitProjectRename = () => {
    if (!editingProjectId) return;
    const nextTitle = projectRenameDraft.trim();
    if (nextTitle) {
      renameProject(editingProjectId, nextTitle);
    }
    setEditingProjectId(null);
    setProjectRenameDraft("");
  };

  const handleDeleteClick = (projectId: string, songTitle: string) => {
    setDeleteTarget({ id: projectId, songTitle });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteProject(deleteTarget.id);
    setDeleteTarget(null);
  };

  const confirmDeleteFolder = () => {
    if (!deleteFolderTarget) return;
    deleteFolder(deleteFolderTarget.id);
    setDeleteFolderTarget(null);
  };

  const openMedia = (section: MediaPanelSection) => {
    setMediaSection(section);
    setMediaPanelOpen(true);
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    projectId: string,
  ) => {
    setDragProjectId(projectId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", projectId);
  };

  const handleDragEnd = () => {
    setDragProjectId(null);
    setDropTargetId(null);
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetProjectId: string,
  ) => {
    e.preventDefault();
    const fromId = dragProjectId ?? e.dataTransfer.getData("text/plain");
    if (!fromId || fromId === targetProjectId) return;
    const fromProject = projects.find((p) => p.id === fromId);
    const targetProject = projects.find((p) => p.id === targetProjectId);
    if (fromProject?.folderId && !targetProject?.folderId) {
      setProjectFolder(fromId, null);
    }
    const fromIndex = projects.findIndex((p) => p.id === fromId);
    const toIndex = projects.findIndex((p) => p.id === targetProjectId);
    if (fromIndex < 0 || toIndex < 0) return;
    reorderProjects(fromIndex, toIndex);
    setDragProjectId(null);
    setDropTargetId(null);
  };

  const handleUncategorizedDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fromId = dragProjectId ?? e.dataTransfer.getData("text/plain");
    if (!fromId) return;
    const fromProject = projects.find((p) => p.id === fromId);
    if (fromProject?.folderId) {
      setProjectFolder(fromId, null);
    }
    setDragProjectId(null);
    setDropTargetId(null);
  };

  const handleFolderDrop = (
    e: React.DragEvent<HTMLDivElement>,
    folderId: string,
  ) => {
    e.preventDefault();
    const fromId = dragProjectId ?? e.dataTransfer.getData("text/plain");
    if (!fromId) return;
    setProjectFolder(fromId, folderId);
    setDragProjectId(null);
    setDropTargetId(null);
  };

  const startFolderRename = (folder: ProjectFolder) => {
    setEditingFolderId(folder.id);
    setFolderRenameDraft(folder.name);
  };

  const commitFolderRename = () => {
    if (!editingFolderId) return;
    renameFolder(editingFolderId, folderRenameDraft);
    setEditingFolderId(null);
    setFolderRenameDraft("");
  };

  const handleNewFolder = () => {
    createFolder(UI.newFolderDefaultName);
  };

  const renderProjectRow = (project: ProjectSummary, sectionKey: string) => {
    const active = project.id === activeProjectId;
    const isDragging = dragProjectId === project.id;
    const isDropTarget =
      dropTargetId === project.id && dragProjectId !== project.id;
    const folderName = project.folderId
      ? folderNameById.get(project.folderId)
      : null;

    return (
      <div
        key={`${sectionKey}:${project.id}`}
        className={
          "project-item" +
          (active ? " active" : "") +
          (editingProjectId === project.id ? " is-editing" : "") +
          (isDragging ? " dragging" : "") +
          (isDropTarget ? " drop-target" : "")
        }
        onDragOver={(e) => {
          e.preventDefault();
          if (dragProjectId && dragProjectId !== project.id) {
            setDropTargetId(project.id);
          }
        }}
        onDragLeave={() => {
          if (dropTargetId === project.id) setDropTargetId(null);
        }}
        onDrop={(e) => handleDrop(e, project.id)}
      >
        <div className="project-item-inner">
          {isViewOnly ? (
            externalShareView && projects.length > 1 ? (
              <button
                type="button"
                className="project-item-main"
                onClick={() => scheduleProjectSwitch(project.id)}
              >
                <span className="project-item-leading" aria-hidden>
                  <ProjectIcon />
                </span>
                <span className="project-item-body">
                  <span className="project-item-title">{project.songTitle}</span>
                </span>
              </button>
            ) : (
              <div className="project-item-main project-item-main-static">
                <span className="project-item-leading" aria-hidden>
                  <ProjectIcon />
                </span>
                <span className="project-item-body">
                  <span className="project-item-title">{project.songTitle}</span>
                </span>
              </div>
            )
          ) : editingProjectId === project.id ? (
            <div className="project-item-main project-item-editing">
              <span className="project-item-leading" aria-hidden>
                <ProjectIcon />
              </span>
              <span className="project-item-body">
                <input
                  className="project-sidebar-rename-input"
                  value={projectRenameDraft}
                  autoFocus
                  onChange={(e) => setProjectRenameDraft(e.target.value)}
                  onBlur={commitProjectRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitProjectRename();
                    if (e.key === "Escape") {
                      setEditingProjectId(null);
                      setProjectRenameDraft("");
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={UI.renameProject}
                />
              </span>
            </div>
          ) : (
            <button
              type="button"
              className={"project-item-main" + (canDragProject ? " draggable" : "")}
              draggable={canDragProject}
              onClick={() => scheduleProjectSwitch(project.id)}
              onDoubleClick={(e) => {
                e.preventDefault();
                startProjectRename(project.id, project.songTitle);
              }}
              onDragStart={(e) => handleDragStart(e, project.id)}
              onDragEnd={handleDragEnd}
              title={`${project.songTitle} — ${UI.projectRenameHint}`}
            >
              <span className="project-item-leading" aria-hidden>
                <ProjectIcon />
              </span>
              <span className="project-item-body">
                <span className="project-item-title">{project.songTitle}</span>
                <span className="project-item-meta">
                  {UI.projectLastSaved(
                    formatProjectSavedAt(project.updatedAt, language),
                  )}
                </span>
                {folderName ? (
                  <span className="project-item-folder-badge">
                    <FolderIcon />
                    <span>{folderName}</span>
                  </span>
                ) : null}
              </span>
            </button>
          )}

          {!isViewOnly ? (
            <div className="project-item-actions">
              <button
                type="button"
                className={
                  "project-sidebar-bookmark-btn" +
                  (project.bookmarked ? " on" : "")
                }
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleProjectBookmark(project.id);
                }}
                title={project.bookmarked ? UI.bookmarkOn : UI.bookmarkOff}
                aria-label={project.bookmarked ? UI.bookmarkOn : UI.bookmarkOff}
              >
                <StarIcon filled={project.bookmarked} />
              </button>
              <button
                type="button"
                className="project-folder-delete"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteClick(project.id, project.songTitle);
                }}
                title={UI.deleteProject}
                aria-label={UI.deleteProjectAria(project.songTitle)}
              >
                ×
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderSection = (
    section: ReturnType<typeof buildSidebarProjectSections>[number],
  ) => {
    const isFolderSection =
      section.kind === "folder" || section.kind === "bookmarked-folder";
    const collapsed = section.folder?.collapsed ?? false;
    const isFolderDropTarget =
      isFolderSection &&
      dragProjectId &&
      dropTargetId === `folder:${section.key}`;
    const isUncategorizedSection = section.kind === "uncategorized";
    const isUncategorizedDropTarget =
      isUncategorizedSection &&
      dragProjectId &&
      dropTargetId === "uncategorized";

    return (
      <div key={section.key} className="project-sidebar-section">
        {section.kind !== "uncategorized" || folders.length > 0 ? (
          <div
            className={
              "project-sidebar-section-head" +
              (section.kind === "bookmarks" ? " is-bookmarks" : "") +
              (isFolderSection ? " is-folder" : "") +
              (isUncategorizedSection ? " is-uncategorized" : "") +
              (isFolderDropTarget || isUncategorizedDropTarget ? " drop-target" : "")
            }
            onDragOver={
              isFolderSection
                ? (e) => {
                    e.preventDefault();
                    if (dragProjectId) setDropTargetId(`folder:${section.key}`);
                  }
                : isUncategorizedSection
                  ? (e) => {
                      e.preventDefault();
                      if (dragProjectId) setDropTargetId("uncategorized");
                    }
                  : undefined
            }
            onDragLeave={
              isFolderSection
                ? () => {
                    if (dropTargetId === `folder:${section.key}`) {
                      setDropTargetId(null);
                    }
                  }
                : isUncategorizedSection
                  ? () => {
                      if (dropTargetId === "uncategorized") {
                        setDropTargetId(null);
                      }
                    }
                  : undefined
            }
            onDrop={
              isFolderSection && section.folder
                ? (e) => handleFolderDrop(e, section.folder!.id)
                : isUncategorizedSection
                  ? handleUncategorizedDrop
                  : undefined
            }
          >
            {isFolderSection && section.folder ? (
              <>
                <button
                  type="button"
                  className="project-folder-toggle"
                  onClick={() => toggleFolderCollapsed(section.folder!.id)}
                  title={collapsed ? UI.expandFolder : UI.collapseFolder}
                  aria-label={collapsed ? UI.expandFolder : UI.collapseFolder}
                >
                  <ChevronIcon direction={collapsed ? "right" : "down"} />
                </button>
                <span className="project-section-icon" aria-hidden>
                  <FolderIcon open={!collapsed} />
                </span>
                {editingFolderId === section.folder.id ? (
                  <input
                    className="project-sidebar-rename-input project-sidebar-rename-input-folder"
                    value={folderRenameDraft}
                    autoFocus
                    onChange={(e) => setFolderRenameDraft(e.target.value)}
                    onBlur={commitFolderRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitFolderRename();
                      if (e.key === "Escape") setEditingFolderId(null);
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className="project-folder-name"
                    onClick={() => startFolderRename(section.folder!)}
                    title={UI.renameFolder}
                  >
                    {section.title}
                  </button>
                )}
                <span className="project-section-count">
                  {section.projects.length}
                </span>
                <button
                  type="button"
                  className={
                    "project-sidebar-bookmark-btn" +
                    (section.folder.bookmarked ? " on" : "")
                  }
                  onClick={() => toggleFolderBookmark(section.folder!.id)}
                  title={
                    section.folder.bookmarked ? UI.bookmarkOn : UI.bookmarkOff
                  }
                  aria-label={
                    section.folder.bookmarked ? UI.bookmarkOn : UI.bookmarkOff
                  }
                >
                  <StarIcon filled={Boolean(section.folder.bookmarked)} />
                </button>
                <button
                  type="button"
                  className="project-folder-delete"
                  onClick={() =>
                    setDeleteFolderTarget({
                      id: section.folder!.id,
                      name: section.folder!.name,
                    })
                  }
                  title={UI.deleteFolder}
                  aria-label={UI.deleteFolder}
                >
                  ×
                </button>
              </>
            ) : (
              <>
                {section.kind === "bookmarks" ? (
                  <span className="project-section-icon on" aria-hidden>
                    <StarIcon filled />
                  </span>
                ) : (
                  <span className="project-section-icon" aria-hidden>
                    <ProjectIcon />
                  </span>
                )}
                <span className="project-sidebar-section-label">{section.title}</span>
                <span className="project-section-count">
                  {section.projects.length}
                </span>
              </>
            )}
          </div>
        ) : null}
        {(!section.folder?.collapsed || !isFolderSection) && (
          <div
            className={
              "project-sidebar-section-list" +
              (isUncategorizedDropTarget ? " drop-target" : "")
            }
            onDragOver={
              isUncategorizedSection
                ? (e) => {
                    e.preventDefault();
                    if (dragProjectId) setDropTargetId("uncategorized");
                  }
                : undefined
            }
            onDragLeave={
              isUncategorizedSection
                ? () => {
                    if (dropTargetId === "uncategorized") {
                      setDropTargetId(null);
                    }
                  }
                : undefined
            }
            onDrop={isUncategorizedSection ? handleUncategorizedDrop : undefined}
          >
            {section.projects.map((project) =>
              renderProjectRow(project, section.key),
            )}
            {isUncategorizedSection &&
            !section.projects.length &&
            dragProjectId ? (
              <p className="project-uncategorized-hint is-dragging">
                {UI.uncategorizedDropHint}
              </p>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  const renderSectionBlock = (
    block: (typeof sectionBlocks)[number],
  ) => (
    <div
      key={block.id}
      className={`project-sidebar-block is-${block.kind}`}
    >
      {block.kind === "folders" ? (
        <div className="project-sidebar-block-label">
          <span className="project-sidebar-block-label-icon" aria-hidden>
            <FolderIcon />
          </span>
          <span>{UI.foldersGroupLabel}</span>
        </div>
      ) : null}
      {block.sections.map((section) => renderSection(section))}
    </div>
  );

  return (
    <>
      <div
        className={"project-drawer-backdrop" + (open ? " open" : "")}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={"project-sidebar" + (open ? " open" : "")}
        aria-label={UI.projectList}
        aria-hidden={!open}
      >
        <div className="project-sidebar-head">
          <Link
            href="/mypage"
            className="profile-avatar-link"
            onClick={onClose}
            aria-label={UI.myPage}
            title={UI.myPage}
          >
            <ProfileAvatar size="sm" />
            {plan === "pro" ? (
              <span className="sidebar-pro-badge">{UI.myPageProModeBadge}</span>
            ) : null}
          </Link>
          <span className="project-sidebar-title">{UI.projects}</span>
          <button
            type="button"
            className="project-sidebar-close"
            onClick={onClose}
            aria-label={UI.close}
          >
            ×
          </button>
        </div>

        {!isViewOnly && (
          <div className="project-sidebar-tools">
            <label className="project-search-field">
              <span className="project-search-icon" aria-hidden>
                <SearchIcon />
              </span>
              <input
                type="search"
                className="project-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={UI.projectSearchPlaceholder}
                aria-label={UI.projectSearchPlaceholder}
              />
            </label>
            <div className="project-sidebar-tool-actions">
              <button
                type="button"
                className="project-new-btn"
                onClick={() => {
                  if (!canCreateProject(projects.length, plan)) {
                    setUpgradeOpen(true);
                    return;
                  }
                  setDialogOpen(true);
                }}
              >
                {UI.newProject}
              </button>
              <button
                type="button"
                className="project-new-folder-btn"
                onClick={handleNewFolder}
                title={UI.newFolder}
                aria-label={UI.newFolder}
              >
                <FolderPlusIcon />
                <span className="project-new-folder-label">
                  {UI.foldersGroupLabel}
                </span>
              </button>
            </div>
          </div>
        )}

        <div
          className="project-sidebar-projects"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="project-sidebar-list">
            {isViewOnly && (
              <p className="project-view-only-hint">{UI.viewOnlyProjectHint}</p>
            )}
            {isViewOnly
              ? visibleProjects.map((project) =>
                  renderProjectRow(project, "view"),
                )
              : hasSearchResults
                ? sectionBlocks.map((block) => renderSectionBlock(block))
                : (
                    <p className="project-search-empty">{UI.projectSearchEmpty}</p>
                  )}
          </div>
        </div>

        {activeProject && (
          <div className="project-sidebar-media">
            <button
              type="button"
              className="project-sidebar-menu-item"
              onClick={() => openMedia("audio")}
            >
              <span className="project-sidebar-menu-icon" aria-hidden>
                ♪
              </span>
              <span className="project-sidebar-menu-body">
                <span className="project-sidebar-menu-title">{UI.openAudio}</span>
                <span className="project-sidebar-menu-meta">
                  {UI.mediaAudioCount(activeProject.audioCount)}
                </span>
              </span>
            </button>
            <button
              type="button"
              className="project-sidebar-menu-item"
              onClick={() => openMedia("video")}
            >
              <span className="project-sidebar-menu-icon" aria-hidden>
                ▶
              </span>
              <span className="project-sidebar-menu-body">
                <span className="project-sidebar-menu-title">
                  {UI.openReferenceVideos}
                </span>
                <span className="project-sidebar-menu-meta">
                  {UI.mediaVideoCount(activeProject.videoCount)}
                </span>
              </span>
            </button>
          </div>
        )}
      </aside>

      {dialogOpen && (
        <NewProjectDialog onClose={() => setDialogOpen(false)} />
      )}

      {upgradeOpen && (
        <UpgradeDialog onClose={() => setUpgradeOpen(false)} />
      )}

      {mediaPanelOpen && (
        <MediaPanel
          open={mediaPanelOpen}
          initialSection={mediaSection}
          onClose={() => setMediaPanelOpen(false)}
        />
      )}

      {deleteTarget && (
        <div
          className="dialog-overlay"
          onClick={() => setDeleteTarget(null)}
          role="presentation"
        >
          <div
            className="dialog-panel"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            aria-describedby="delete-project-desc"
          >
            <h2 id="delete-project-title" className="dialog-title">
              {UI.deleteConfirmTitle}
            </h2>
            <p id="delete-project-desc" className="dialog-desc">
              {UI.deleteConfirmBody(deleteTarget.songTitle)}
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="dialog-btn secondary"
                onClick={() => setDeleteTarget(null)}
              >
                {UI.cancel}
              </button>
              <button
                type="button"
                className="dialog-btn danger"
                onClick={confirmDelete}
              >
                {UI.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteFolderTarget && (
        <div
          className="dialog-overlay"
          onClick={() => setDeleteFolderTarget(null)}
          role="presentation"
        >
          <div
            className="dialog-panel"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-folder-title"
            aria-describedby="delete-folder-desc"
          >
            <h2 id="delete-folder-title" className="dialog-title">
              {UI.deleteFolder}
            </h2>
            <p id="delete-folder-desc" className="dialog-desc">
              {UI.deleteFolderConfirm(deleteFolderTarget.name)}
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="dialog-btn secondary"
                onClick={() => setDeleteFolderTarget(null)}
              >
                {UI.cancel}
              </button>
              <button
                type="button"
                className="dialog-btn danger"
                onClick={confirmDeleteFolder}
              >
                {UI.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
