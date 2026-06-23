"use client";

import { useEffect, useState } from "react";
import { useChoreo } from "@/context/ChoreoContext";
import { useProfile } from "@/context/ProfileContext";
import { canCreateProject } from "@/lib/subscription";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { UpgradeDialog } from "@/components/UpgradeDialog";

export function EmptyProjectPrompt() {
  const {
    hasActiveProject,
    isViewOnly,
    projects,
    workspaceSettled,
    strings: UI,
  } = useChoreo();
  const { plan } = useProfile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (!workspaceSettled || hasActiveProject || isViewOnly) {
      setDialogOpen(false);
      return;
    }
    setDialogOpen(true);
  }, [workspaceSettled, hasActiveProject, isViewOnly]);

  if (!workspaceSettled || hasActiveProject || isViewOnly) return null;

  return (
    <>
      {!dialogOpen ? (
        <div className="empty-project-prompt" role="status">
          <div className="empty-project-prompt-card">
            <h2 className="empty-project-prompt-title">{UI.emptyProjectTitle}</h2>
            <p className="empty-project-prompt-desc">{UI.emptyProjectDesc}</p>
            <button
              type="button"
              className="empty-project-prompt-btn"
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
          </div>
        </div>
      ) : null}
      {dialogOpen ? (
        <NewProjectDialog welcome onClose={() => setDialogOpen(false)} />
      ) : null}
      {upgradeOpen ? <UpgradeDialog onClose={() => setUpgradeOpen(false)} /> : null}
    </>
  );
}
