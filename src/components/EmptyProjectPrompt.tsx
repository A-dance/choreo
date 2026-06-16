"use client";

import { useState } from "react";
import { useChoreo } from "@/context/ChoreoContext";
import { NewProjectDialog } from "@/components/NewProjectDialog";

export function EmptyProjectPrompt() {
  const { hasActiveProject, isViewOnly, strings: UI } = useChoreo();
  const [dialogOpen, setDialogOpen] = useState(false);

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
            onClick={() => setDialogOpen(true)}
          >
            {UI.newProject}
          </button>
        </div>
      </div>
      {dialogOpen ? <NewProjectDialog onClose={() => setDialogOpen(false)} /> : null}
    </>
  );
}
