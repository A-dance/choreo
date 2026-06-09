"use client";

import { useEffect, useState } from "react";
import { useChoreo } from "@/context/ChoreoContext";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ShareDialog({ open, onClose }: ShareDialogProps) {
  const {
    strings: UI,
    appMode,
    canExitViewMode,
    copyShareLink,
    enterViewPreview,
    exitViewMode,
  } = useChoreo();
  const [copying, setCopying] = useState(false);

  const viewOnly = appMode === "view";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleCopy = async () => {
    setCopying(true);
    try {
      await copyShareLink();
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose} role="presentation">
      <div
        className="dialog-panel share-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
      >
        <h2 id="share-dialog-title" className="dialog-title">
          {UI.shareTitle}
        </h2>
        {viewOnly && (
          <p className="view-mode-banner">{UI.viewModeBanner}</p>
        )}

        <section className="share-dialog-section">
          {!viewOnly && (
            <p className="dialog-desc">{UI.shareViewSectionDesc}</p>
          )}
          <div className="share-media-actions">
            <button
              type="button"
              className="dialog-btn primary"
              disabled={copying}
              onClick={() => void handleCopy()}
            >
              {copying ? UI.shareLinkCopying : UI.copyShareLink}
            </button>
            {!viewOnly && (
              <button
                type="button"
                className="dialog-btn secondary"
                disabled={copying}
                onClick={() => {
                  enterViewPreview();
                  onClose();
                }}
              >
                {UI.previewViewMode}
              </button>
            )}
            {canExitViewMode && (
              <button
                type="button"
                className="dialog-btn secondary"
                onClick={() => {
                  exitViewMode();
                  onClose();
                }}
              >
                {UI.exitViewMode}
              </button>
            )}
          </div>
        </section>

        <div className="dialog-actions">
          <button type="button" className="dialog-btn primary" onClick={onClose}>
            {UI.close}
          </button>
        </div>
      </div>
    </div>
  );
}
