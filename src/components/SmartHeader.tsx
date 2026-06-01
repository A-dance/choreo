"use client";

import { useEffect, useState } from "react";
import {
  BAMIRI_DEPTH_MAX,
  BAMIRI_DEPTH_MIN,
  BAMIRI_HALF_MAX,
  BAMIRI_HALF_MIN,
} from "@/lib/constants";
import { MemberPanel } from "@/components/MemberPanel";
import { useChoreo } from "@/context/ChoreoContext";

export function SmartHeader() {
  const {
    state,
    setSongTitle,
    setBpm,
    togglePlayback,
    setBamiriHalfWidth,
    setBamiriDepth,
    saveProject,
    copyFormation,
    pasteFormation,
    hasClipboard,
  } = useChoreo();

  const [halfWInp, setHalfWInp] = useState(String(state.stage.bamiriHalfWidth));
  const [depthInp, setDepthInp] = useState(String(state.stage.bamiriDepth));
  const [bpmInp, setBpmInp] = useState(String(state.bpm));
  const [memberPanelOpen, setMemberPanelOpen] = useState(false);

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

  return (
    <>
      <div className="smart-header">
        <div className="hdr-row">
          <span className="logo">◈ CHOREO</span>

          <input
            className="title-inp"
            value={state.songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            aria-label="曲名"
          />

          <div className="ctrl-grp compact">
            <span>♩</span>
            <input
              className="bpm-inp"
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

          <div className="bamiri-block">
            <span className="bamiri-title">ばみり</span>
            <label className="bamiri-inp-grp" title="横ばみり（0番から左右）">
              <span className="bamiri-lbl">横</span>
              <input
                className="bamiri-inp"
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
                aria-label="横ばみり"
              />
            </label>

            <label className="bamiri-inp-grp" title="縦ばみり（0番から奥）">
              <span className="bamiri-lbl">縦</span>
              <input
                className="bamiri-inp"
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
                aria-label="縦ばみり"
              />
            </label>
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
              title="メンバー一覧を開く"
            >
              <span className="member-select-lbl">人数</span>
              <span className="member-select-val">{state.members.length}</span>
              <span className="member-select-chevron" aria-hidden>
                ▾
              </span>
            </button>
          </div>

          <div className="hdr-actions">
            <button
              type="button"
              className="save-btn"
              onClick={saveProject}
              title="保存（⌘S / Ctrl+S）"
            >
              保存
            </button>
            <button
              type="button"
              className="copy-btn"
              onClick={copyFormation}
              title="現在の配置をコピー"
            >
              コピー
            </button>
            <button
              type="button"
              className="paste-btn"
              onClick={pasteFormation}
              disabled={!hasClipboard}
              title="コピーした配置をペースト"
            >
              ペースト
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
              再生中
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
