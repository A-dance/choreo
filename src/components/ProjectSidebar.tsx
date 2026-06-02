"use client";

import { useEffect, useState } from "react";
import { useChoreo } from "@/context/ChoreoContext";
import { NewProjectDialog } from "@/components/NewProjectDialog";

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
    strings: UI,
  } = useChoreo();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    songTitle: string;
  } | null>(null);

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
    onClose();
  };

  const handleDeleteClick = (projectId: string, songTitle: string) => {
    if (projects.length <= 1) return;
    setDeleteTarget({ id: projectId, songTitle });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteProject(deleteTarget.id);
    setDeleteTarget(null);
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
          <span className="project-sidebar-logo">◈</span>
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

        <div className="project-sidebar-list">
          {projects.map((project) => {
            const active = project.id === activeProjectId;
            return (
              <div
                key={project.id}
                className={"project-item" + (active ? " active" : "")}
              >
                <button
                  type="button"
                  className="project-item-main"
                  onClick={() => handleSwitch(project.id)}
                  title={project.songTitle}
                >
                  <span className="project-item-title">{project.songTitle}</span>
                  <span className="project-item-meta">{project.bpm} BPM</span>
                </button>
                <button
                  type="button"
                  className="project-item-delete"
                  disabled={projects.length <= 1}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteClick(project.id, project.songTitle);
                  }}
                  title={
                    projects.length <= 1
                      ? UI.cannotDeleteLastProject
                      : UI.deleteProject
                  }
                  aria-label={UI.deleteProjectAria(project.songTitle)}
                >
                  <svg
                    className="project-item-delete-icon"
                    viewBox="0 0 16 16"
                    width="14"
                    height="14"
                    aria-hidden
                  >
                    <path
                      fill="currentColor"
                      d="M5.5 1.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V2h2.5a.5.5 0 0 1 0 1h-.55l-.73 9.8A1.5 1.5 0 0 1 10.7 14H5.3a1.5 1.5 0 0 1-1.49-1.7L3.05 3H2.5a.5.5 0 0 1 0-1H5v-.5zm1.5-.5v.5h2V1H7zM4.06 3l.7 9.4a.5.5 0 0 0 .5.6h5.48a.5.5 0 0 0 .5-.6L11.94 3H4.06zM6 5.5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5z"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="project-new-btn"
          onClick={() => setDialogOpen(true)}
        >
          {UI.newProject}
        </button>
      </aside>

      {dialogOpen && (
        <NewProjectDialog onClose={() => setDialogOpen(false)} />
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
