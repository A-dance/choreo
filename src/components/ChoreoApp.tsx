"use client";

import { useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { ChoreoProvider } from "@/context/ChoreoContext";
import { ChoreoErrorBoundary } from "@/components/ChoreoErrorBoundary";
import { EmptyProjectPrompt } from "@/components/EmptyProjectPrompt";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { SmartHeader } from "@/components/SmartHeader";
import { StageArea } from "@/components/StageArea";
import { TimelineFooter } from "@/components/TimelineFooter";
import { Toast } from "@/components/Toast";

export function ChoreoApp() {
  const [projectsOpen, setProjectsOpen] = useState(false);

  return (
    <ChoreoErrorBoundary>
      <AuthGate allowShareGuest>
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
              <EmptyProjectPrompt />
              <StageArea />
              <TimelineFooter />
              <Toast />
            </div>
          </div>
        </ChoreoProvider>
      </AuthGate>
    </ChoreoErrorBoundary>
  );
}
