"use client";

import { useState } from "react";
import { ChoreoProvider } from "@/context/ChoreoContext";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { SmartHeader } from "@/components/SmartHeader";
import { StageArea } from "@/components/StageArea";
import { TimelineFooter } from "@/components/TimelineFooter";
import { Toast } from "@/components/Toast";

export function ChoreoApp() {
  const [projectsOpen, setProjectsOpen] = useState(false);

  return (
    <ChoreoProvider>
      <div className="app-shell">
        <ProjectSidebar
          open={projectsOpen}
          onClose={() => setProjectsOpen(false)}
        />
        <div className="app-main">
          <KeyboardShortcuts />
          <SmartHeader
            projectsOpen={projectsOpen}
            onToggleProjects={() => setProjectsOpen((v) => !v)}
          />
          <StageArea />
          <TimelineFooter />
          <Toast />
        </div>
      </div>
    </ChoreoProvider>
  );
}
