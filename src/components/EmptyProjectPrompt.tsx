"use client";

import { useState } from "react";
import { useChoreo } from "@/context/ChoreoContext";
import { useProfile } from "@/context/ProfileContext";
import { canCreateProject } from "@/lib/subscription";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { UpgradeDialog } from "@/components/UpgradeDialog";

export function EmptyProjectPrompt() {
  const { hasActiveProject, isViewOnly, projects, strings: UI } = useChoreo();
  const { plan } = useProfile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (hasActiveProject || isViewOnly) return null;

  return (
    <>
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
      {dialogOpen ? <NewProjectDialog onClose={() => setDialogOpen(false)} /> : null}
      {upgradeOpen ? <UpgradeDialog onClose={() => setUpgradeOpen(false)} /> : null}
    </>
  );
}
