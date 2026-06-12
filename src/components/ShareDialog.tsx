"use client";

import { useEffect, useRef, useState } from "react";
import { useChoreo } from "@/context/ChoreoContext";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
}

type SnsTarget = "line" | "x" | "mail";

function LineIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M12 2.5C6.2 2.5 1.5 6.36 1.5 11.1c0 4.25 3.74 7.81 8.8 8.49.34.07.81.23.93.52.1.27.07.68.03.95l-.15.9c-.04.27-.21 1.06.92.58 1.13-.48 6.1-3.59 8.32-6.15 1.54-1.69 2.15-3.4 2.15-5.29 0-4.74-4.7-8.6-10.5-8.6Zm-4.9 11.32H5.04a.55.55 0 0 1-.55-.55V9.1a.55.55 0 0 1 1.1 0v3.62h1.51a.55.55 0 0 1 0 1.1Zm2.13-.55a.55.55 0 0 1-1.1 0V9.1a.55.55 0 0 1 1.1 0v4.17Zm4.97 0a.55.55 0 0 1-.99.33l-2.12-2.89v2.56a.55.55 0 0 1-1.1 0V9.1a.55.55 0 0 1 .99-.33l2.12 2.89V9.1a.55.55 0 0 1 1.1 0v4.17Zm3.34-2.64a.55.55 0 0 1 0 1.1h-1.51v.99h1.51a.55.55 0 0 1 0 1.1h-2.06a.55.55 0 0 1-.55-.55V9.1c0-.3.25-.55.55-.55h2.06a.55.55 0 0 1 0 1.1h-1.51v.98h1.51Z"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25h6.826l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.5 5.5h17a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Zm.5 1.5 8 6 8-6"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 14a4.5 4.5 0 0 0 6.36 0l3.18-3.18a4.5 4.5 0 0 0-6.36-6.36l-1.6 1.59M14 10a4.5 4.5 0 0 0-6.36 0l-3.18 3.18a4.5 4.5 0 0 0 6.36 6.36l1.59-1.59"
      />
    </svg>
  );
}

function MoreShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="6" cy="12" r="2.6" />
        <circle cx="17.5" cy="5.5" r="2.6" />
        <circle cx="17.5" cy="18.5" r="2.6" />
        <path strokeLinecap="round" d="m8.4 10.7 6.8-3.9m-6.8 6.5 6.8 3.9" />
      </g>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
        <circle cx="12" cy="12" r="3" />
      </g>
    </svg>
  );
}

export function ShareDialog({ open, onClose }: ShareDialogProps) {
  const {
    strings: UI,
    state,
    appMode,
    canExitViewMode,
    createShareUrl,
    enterViewPreview,
    exitViewMode,
  } = useChoreo();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createFailed, setCreateFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canWebShare, setCanWebShare] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const viewOnly = appMode === "view";
  const songTitle = state.songTitle || UI.defaultSongTitle;

  useEffect(() => {
    setCanWebShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  // Create the share link once each time the dialog opens.
  useEffect(() => {
    if (!open || viewOnly) return;
    let cancelled = false;
    setShareUrl(null);
    setCreateFailed(false);
    setCopied(false);
    setCreating(true);
    void createShareUrl()
      .then((url) => {
        if (cancelled) return;
        setShareUrl(url);
        setCreateFailed(!url);
      })
      .finally(() => {
        if (!cancelled) setCreating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, viewOnly, createShareUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const shareMessage = UI.shareSheetText(songTitle);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — user can select the URL text manually
    }
  };

  const handleWebShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.share({
        title: songTitle,
        text: shareMessage,
        url: shareUrl,
      });
    } catch {
      // user cancelled the share sheet — nothing to do
    }
  };

  const handleSnsShare = (target: SnsTarget) => {
    if (!shareUrl) return;
    let intent: string;
    if (target === "line") {
      intent = `https://line.me/R/share?text=${encodeURIComponent(`${shareMessage}\n${shareUrl}`)}`;
    } else if (target === "x") {
      intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareUrl)}`;
    } else {
      intent = `mailto:?subject=${encodeURIComponent(songTitle)}&body=${encodeURIComponent(`${shareMessage}\n${shareUrl}`)}`;
    }
    if (target === "mail") {
      window.location.href = intent;
    } else {
      window.open(intent, "_blank", "noopener");
    }
  };

  const ready = !!shareUrl;

  return (
    <div className="dialog-overlay" onClick={onClose} role="presentation">
      <div
        className="dialog-panel share-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
      >
        <div className="share-head">
          <div className="share-head-text">
            <h2 id="share-dialog-title" className="dialog-title">
              {UI.shareTitle}
            </h2>
            {!viewOnly && (
              <p className="share-subtitle">
                {songTitle} · {UI.shareSubtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            className="share-close"
            onClick={onClose}
            aria-label={UI.close}
          >
            ×
          </button>
        </div>

        <div className="share-body">
        {viewOnly && <p className="view-mode-banner">{UI.viewModeBanner}</p>}

        {!viewOnly && (
          <>
            <div className="share-url-box">
              <span className="share-url-icon">
                <LinkIcon />
              </span>
              <span className={"share-url-text" + (ready ? "" : " pending")}>
                {creating
                  ? UI.shareLinkCopying
                  : createFailed
                    ? UI.shareLinkCreateFailed
                    : shareUrl}
              </span>
              <button
                type="button"
                className="share-url-copy"
                disabled={!ready}
                onClick={() => void handleCopy()}
              >
                {copied ? UI.shareCopied : UI.shareCopy}
              </button>
            </div>

            <div
              className="share-icon-row"
              role="group"
              aria-label={UI.shareTitle}
            >
              <button
                type="button"
                className="share-icon-btn"
                disabled={!ready}
                onClick={() => handleSnsShare("line")}
              >
                <span className="share-icon-circle line">
                  <LineIcon />
                </span>
                <span className="share-icon-label">LINE</span>
              </button>
              <button
                type="button"
                className="share-icon-btn"
                disabled={!ready}
                onClick={() => handleSnsShare("x")}
              >
                <span className="share-icon-circle x">
                  <XIcon />
                </span>
                <span className="share-icon-label">X</span>
              </button>
              <button
                type="button"
                className="share-icon-btn"
                disabled={!ready}
                onClick={() => handleSnsShare("mail")}
              >
                <span className="share-icon-circle neutral">
                  <MailIcon />
                </span>
                <span className="share-icon-label">{UI.shareViaMail}</span>
              </button>
              <button
                type="button"
                className="share-icon-btn"
                disabled={!ready}
                onClick={() => void handleCopy()}
              >
                <span className="share-icon-circle outline">
                  <LinkIcon />
                </span>
                <span className="share-icon-label">
                  {copied ? UI.shareCopied : UI.shareViaCopy}
                </span>
              </button>
              {canWebShare && (
                <button
                  type="button"
                  className="share-icon-btn"
                  disabled={!ready}
                  onClick={() => void handleWebShare()}
                >
                  <span className="share-icon-circle outline">
                    <MoreShareIcon />
                  </span>
                  <span className="share-icon-label">{UI.shareViaMore}</span>
                </button>
              )}
            </div>

            <div className="share-preview-wrap">
              <button
                type="button"
                className="share-preview-btn"
                onClick={() => {
                  enterViewPreview();
                  onClose();
                }}
              >
                <EyeIcon />
                {UI.previewViewMode}
              </button>

              <p className="share-footer-hint">{UI.shareViewerHint}</p>
            </div>
          </>
        )}

        {canExitViewMode && (
          <div className="dialog-actions">
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
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
