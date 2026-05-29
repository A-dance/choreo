"use client";

import { ChoreoProvider } from "@/context/ChoreoContext";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { SmartHeader } from "@/components/SmartHeader";
import { StageArea } from "@/components/StageArea";
import { Toast } from "@/components/Toast";

export function ChoreoApp() {
  return (
    <ChoreoProvider>
      <div className="app-shell">
        <KeyboardShortcuts />
        <SmartHeader />
        <StageArea />
        <Toast />
      </div>
    </ChoreoProvider>
  );
}
