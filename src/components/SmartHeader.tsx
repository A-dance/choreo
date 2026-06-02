"use client";

import { useEffect, useState } from "react";
import {
  BAMIRI_DEPTH_MAX,
  BAMIRI_DEPTH_MIN,
  BAMIRI_HALF_MAX,
  BAMIRI_HALF_MIN,
  MEMBER_DOT_MAX,
  MEMBER_DOT_MIN,
} from "@/lib/constants";
import { MemberPanel } from "@/components/MemberPanel";
import { useChoreo } from "@/context/ChoreoContext";

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
    saveProject,
    undo,
    canUndo,
    copyFormation,
    pasteFormation,
    hasClipboard,
  } = useChoreo();

  const [halfWInp, setHalfWInp] = useState(String(state.stage.bamiriHalfWidth));
  const [depthInp, setDepthInp] = useState(String(state.stage.bamiriDepth));
  const [bpmInp, setBpmInp] = useState(String(state.bpm));
  const [dotInp, setDotInp] = useState(String(memberDotPx));
  const [memberPanelOpen, setMemberPanelOpen] = useState(false);

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
    const n = parseInt(bpmInp, 10);
    if (!Number.isFinite(n)) {
      setBpmInp(String(state.bpm));
      return;
    }
    setBpm(n);
  };

  const applyHalfW = () => {
    const n = parseInt(halfWInp, 10);
    if (!Number.isFinite(n)) {
      setHalfWInp(String(state.stage.bamiriHalfWidth));
      return;
    }
    setBamiriHalfWidth(n);
  };

  const applyDepth = () => {
    const n = parseInt(depthInp, 10);
    if (!Number.isFinite(n)) {
      setDepthInp(String(state.stage.bamiriDepth));
      return;
    }
    setBamiriDepth(n);
  };

  const applyDotSize = () => {
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

          <span className="logo">◈ CHOREO</span>

          <input
            className="title-inp"
            value={state.songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
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
                      onChange={(e) => {
                        setHalfWInp(e.target.value);
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
                      onChange={(e) => {
                        setDepthInp(e.target.value);
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
                    onChange={(e) => {
                      setDotInp(e.target.value);
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
            <button
              type="button"
              className="copy-btn"
              onClick={copyFormation}
              title="Copy current formation"
            >
              Copy
            </button>
            <button
              type="button"
              className="paste-btn"
              onClick={pasteFormation}
              disabled={!hasClipboard}
              title="Paste copied formation"
            >
              Paste
            </button>
            <button
              type="button"
              className="save-btn"
              onClick={saveProject}
              title="Save (⌘S / Ctrl+S)"
            >
              Save
            </button>
            <button
              type="button"
              className="undo-btn"
              onClick={undo}
              disabled={!canUndo}
              title={UI.undoShortcut}
              aria-label={UI.undo}
            >
              <svg
                className="undo-btn-icon"
                viewBox="0 0 24 24"
                width="15"
                height="15"
                aria-hidden
              >
                <path
                  fill="currentColor"
                  d="M12.5 8c-2.65 0-5.05 1.25-6.75 3.25l1.42 1.42A5.97 5.97 0 0 1 12.5 10c3.31 0 6 2.69 6 6s-2.69 6-6 6H8v4l-5-5 5-5v4h4.5c4.14 0 7.5-3.36 7.5-7.5S16.64 8 12.5 8z"
                />
              </svg>
            </button>
            <button
              type="button"
              className={"play-btn" + (state.isPlaying ? " playing" : "")}
              onClick={togglePlayback}
            >
              {state.isPlaying ? "⏸" : "▶"}
            </button>
          </div>

          {state.isPlaying && (
            <span className="hdr-playing-badge">
              <span className="cnt-now-dot" />
              {UI.playing}
            </span>
          )}
        </div>
      </div>

      <MemberPanel
        open={memberPanelOpen}
        onClose={() => setMemberPanelOpen(false)}
      />
    </>
  );
}
