"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useChoreo } from "@/context/ChoreoContext";
import { formatProjectSavedAt } from "@/lib/videoLinkUtils";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { MediaPanel, type MediaPanelSection } from "@/components/MediaPanel";

interface ProjectSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ open, onClose }: ProjectSidebarProps) {
  const {
    projects,
    activeProjectId,
    switchProject,
    deleteProject,
    reorderProjects,
    isViewOnly,
    language,
    strings: UI,
  } = useChoreo();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mediaPanelOpen, setMediaPanelOpen] = useState(false);
  const [mediaSection, setMediaSection] = useState<MediaPanelSection>("audio");
  const [dragProjectId, setDragProjectId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    songTitle: string;
  } | null>(null);
  const canReorder = !isViewOnly && projects.length > 1;

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const visibleProjects = isViewOnly
    ? projects.filter((p) => p.id === activeProjectId)
    : projects;

  useEffect(() => {
    if (!open && !deleteTarget) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (deleteTarget) {
        setDeleteTarget(null);
        return;
      }
      if (open) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, deleteTarget]);

  const handleSwitch = (projectId: string) => {
    switchProject(projectId);
  };

  const handleDeleteClick = (projectId: string, songTitle: string) => {
    setDeleteTarget({ id: projectId, songTitle });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteProject(deleteTarget.id);
    setDeleteTarget(null);
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
    const fromIndex = projects.findIndex((p) => p.id === fromId);
    const toIndex = projects.findIndex((p) => p.id === targetProjectId);
    if (fromIndex < 0 || toIndex < 0) return;
    reorderProjects(fromIndex, toIndex);
    setDragProjectId(null);
    setDropTargetId(null);
  };

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
          <button
            type="button"
            className="project-new-btn"
            onClick={() => setDialogOpen(true)}
          >
            {UI.newProject}
          </button>
        )}

        <div className="project-sidebar-list">
          {isViewOnly && (
            <p className="project-view-only-hint">{UI.viewOnlyProjectHint}</p>
          )}
          {visibleProjects.map((project) => {
            const active = project.id === activeProjectId;
            const isDragging = dragProjectId === project.id;
            const isDropTarget =
              dropTargetId === project.id && dragProjectId !== project.id;
            return (
              <div
                key={project.id}
                className={
                  "project-item" +
                  (active ? " active" : "") +
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
                {isViewOnly ? (
                  <div className="project-item-main project-item-main-static">
                    <span className="project-item-title">{project.songTitle}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={
                      "project-item-main" + (canReorder ? " draggable" : "")
                    }
                    draggable={canReorder}
                    onClick={() => handleSwitch(project.id)}
                    onDragStart={(e) => handleDragStart(e, project.id)}
                    onDragEnd={handleDragEnd}
                    title={
                      canReorder
                        ? `${project.songTitle} — ${UI.projectReorderHint}`
                        : project.songTitle
                    }
                  >
                    <span className="project-item-title">{project.songTitle}</span>
                    <span className="project-item-meta">
                      {UI.projectLastSaved(
                        formatProjectSavedAt(project.updatedAt, language),
                      )}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  className="project-item-delete"
                  disabled={isViewOnly}
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
            );
          })}
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
    </>
  );
}
