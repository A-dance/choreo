"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  BAMIRI_DEPTH_MAX,
  BAMIRI_DEPTH_MIN,
  BAMIRI_HALF_MAX,
  BAMIRI_HALF_MIN,
  MEMBER_DOT_MAX,
  MEMBER_DOT_MIN,
} from "@/lib/constants";
import {
  CopyIcon,
  PasteIcon,
  PauseIcon,
  PlayIcon,
  ShareIcon,
  UndoIcon,
} from "@/components/headerIcons";
import { BrandLogo } from "@/components/BrandLogo";
import { MemberPanel } from "@/components/MemberPanel";
import { ShareDialog } from "@/components/ShareDialog";
import { useChoreo } from "@/context/ChoreoContext";

function HeaderAction({
  icon,
  label,
  onClick,
  disabled,
  active,
  title,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      className={"hdr-action-btn" + (active ? " active" : "")}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={label}
    >
      <span className="hdr-action-icon">{icon}</span>
      <span className="hdr-action-label">{label}</span>
    </button>
  );
}

interface SmartHeaderProps {
  projectsOpen: boolean;
  onToggleProjects: () => void;
}

export function SmartHeader({ projectsOpen, onToggleProjects }: SmartHeaderProps) {
  const {
    state,
    strings: UI,
    setSongTitle,
    setBpm,
    togglePlayback,
    setBamiriHalfWidth,
    setBamiriDepth,
    setMemberDotPx,
    memberDotPx,
    undo,
    canUndo,
    copyFormation,
    pasteFormation,
    hasClipboard,
    isViewOnly,
    canExitViewMode,
    exitViewMode,
  } = useChoreo();

  const [halfWInp, setHalfWInp] = useState(String(state.stage.bamiriHalfWidth));
  const [depthInp, setDepthInp] = useState(String(state.stage.bamiriDepth));
  const [bpmInp, setBpmInp] = useState(String(state.bpm));
  const [dotInp, setDotInp] = useState(String(memberDotPx));
  const [memberPanelOpen, setMemberPanelOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    setDotInp(String(memberDotPx));
  }, [memberDotPx]);

  useEffect(() => {
    setHalfWInp(String(state.stage.bamiriHalfWidth));
    setDepthInp(String(state.stage.bamiriDepth));
  }, [state.stage.bamiriHalfWidth, state.stage.bamiriDepth]);

  useEffect(() => {
    setBpmInp(String(state.bpm));
  }, [state.bpm]);

  const applyBpm = () => {
    if (isViewOnly) return;
    const n = parseInt(bpmInp, 10);
    if (!Number.isFinite(n)) {
      setBpmInp(String(state.bpm));
      return;
    }
    setBpm(n);
  };

  const applyHalfW = () => {
    if (isViewOnly) return;
    const n = parseInt(halfWInp, 10);
    if (!Number.isFinite(n)) {
      setHalfWInp(String(state.stage.bamiriHalfWidth));
      return;
    }
    setBamiriHalfWidth(n);
  };

  const applyDepth = () => {
    if (isViewOnly) return;
    const n = parseInt(depthInp, 10);
    if (!Number.isFinite(n)) {
      setDepthInp(String(state.stage.bamiriDepth));
      return;
    }
    setBamiriDepth(n);
  };

  const applyDotSize = () => {
    if (isViewOnly) return;
    const n = parseInt(dotInp, 10);
    if (!Number.isFinite(n)) {
      setDotInp(String(memberDotPx));
      return;
    }
    setMemberDotPx(n);
  };

  return (
    <>
      <div className="smart-header">
        <div className="hdr-row">
          <button
            type="button"
            className={"project-menu-btn" + (projectsOpen ? " open" : "")}
            onClick={onToggleProjects}
            aria-label={UI.projectList}
            aria-expanded={projectsOpen}
            title={UI.projects}
          >
            <span className="project-menu-icon" aria-hidden />
          </button>

          <BrandLogo />

          <input
            className="title-inp"
            value={state.songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            readOnly={isViewOnly}
            aria-label={UI.songTitle}
          />

          <div className="header-tools" aria-label={UI.tools}>
            <div className="header-tools-body">
              <div className="tool-section">
                <span className="tool-section-title">BPM</span>
                <div className="tool-section-controls">
                  <input
                    className="tool-inp"
                    type="number"
                    min={40}
                    max={240}
                    value={bpmInp}
                    readOnly={isViewOnly}
                    onChange={(e) => setBpmInp(e.target.value)}
                    onBlur={applyBpm}
                    onKeyDown={(e) => e.key === "Enter" && applyBpm()}
                    aria-label="BPM"
                  />
                </div>
              </div>

              <div className="tool-section">
                <span className="tool-section-title">{UI.grid}</span>
                <div className="tool-section-controls tool-section-row">
                  <label className="tool-inline-field">
                    <span className="tool-inline-lbl">{UI.widthShort}</span>
                    <input
                      className="tool-inp"
                      type="number"
                      min={BAMIRI_HALF_MIN}
                      max={BAMIRI_HALF_MAX}
                      value={halfWInp}
                      readOnly={isViewOnly}
                      onChange={(e) => {
                        setHalfWInp(e.target.value);
                        if (isViewOnly) return;
                        const n = parseInt(e.target.value, 10);
                        if (Number.isFinite(n)) setBamiriHalfWidth(n);
                      }}
                      onBlur={applyHalfW}
                      onKeyDown={(e) => e.key === "Enter" && applyHalfW()}
                      aria-label={UI.gridWidth}
                    />
                  </label>
                  <label className="tool-inline-field">
                    <span className="tool-inline-lbl">{UI.depthShort}</span>
                    <input
                      className="tool-inp"
                      type="number"
                      min={BAMIRI_DEPTH_MIN}
                      max={BAMIRI_DEPTH_MAX}
                      value={depthInp}
                      readOnly={isViewOnly}
                      onChange={(e) => {
                        setDepthInp(e.target.value);
                        if (isViewOnly) return;
                        const n = parseInt(e.target.value, 10);
                        if (Number.isFinite(n)) setBamiriDepth(n);
                      }}
                      onBlur={applyDepth}
                      onKeyDown={(e) => e.key === "Enter" && applyDepth()}
                      aria-label={UI.gridDepth}
                    />
                  </label>
                </div>
              </div>

              <div className="tool-section">
                <span className="tool-section-title">{UI.dots}</span>
                <div className="tool-section-controls">
                  <input
                    className="tool-inp"
                    type="number"
                    min={MEMBER_DOT_MIN}
                    max={MEMBER_DOT_MAX}
                    value={dotInp}
                    readOnly={isViewOnly}
                    onChange={(e) => {
                      setDotInp(e.target.value);
                      if (isViewOnly) return;
                      const n = parseInt(e.target.value, 10);
                      if (Number.isFinite(n)) setMemberDotPx(n);
                    }}
                    onBlur={applyDotSize}
                    onKeyDown={(e) => e.key === "Enter" && applyDotSize()}
                    aria-label={UI.dotSize}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="member-dropdown">
            <button
              type="button"
              className={
                "member-select-trigger" + (memberPanelOpen ? " open" : "")
              }
              onClick={() => setMemberPanelOpen((v) => !v)}
              disabled={isViewOnly}
              aria-expanded={memberPanelOpen}
              aria-haspopup="dialog"
              title={UI.openMembers}
            >
              <span className="member-select-lbl">{UI.members}</span>
              <span className="member-select-val">{state.members.length}</span>
              <span className="member-select-chevron" aria-hidden>
                ▾
              </span>
            </button>
          </div>

          <div className="hdr-actions">
            {canExitViewMode && (
              <button
                type="button"
                className="view-exit-btn"
                onClick={exitViewMode}
                title={UI.exitViewMode}
              >
                {UI.exitViewMode}
              </button>
            )}
            <HeaderAction
              icon={state.isPlaying ? <PauseIcon /> : <PlayIcon />}
              label="Play"
              onClick={togglePlayback}
              active={state.isPlaying}
            />
            <span className="hdr-action-divider" aria-hidden />
            <HeaderAction
              icon={<CopyIcon />}
              label="Copy"
              onClick={copyFormation}
              disabled={isViewOnly}
              title="Copy current formation"
            />
            <HeaderAction
              icon={<PasteIcon />}
              label="Paste"
              onClick={pasteFormation}
              disabled={!hasClipboard || isViewOnly}
              title="Paste copied formation"
            />
            <HeaderAction
              icon={<UndoIcon />}
              label="Undo"
              onClick={undo}
              disabled={!canUndo || isViewOnly}
              title={UI.undoShortcut}
            />
            {!isViewOnly && (
              <HeaderAction
                icon={<ShareIcon />}
                label={UI.share}
                onClick={() => setShareOpen(true)}
                title={UI.shareTitle}
              />
            )}
          </div>

        </div>
      </div>

      <MemberPanel
        open={memberPanelOpen}
        onClose={() => setMemberPanelOpen(false)}
      />
      {shareOpen && (
        <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} />
      )}
    </>
  );
}
