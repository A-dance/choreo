"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  BAMIRI_DEPTH_MAX,
  BAMIRI_DEPTH_MIN,
  BAMIRI_HALF_MAX,
  BAMIRI_HALF_MIN,
} from "@/lib/constants";
import {
  countHasData,
  flattenTimeline,
  getCurrentSection,
  getFlatSlot,
} from "@/lib/choreoUtils";
import { MemberPanel } from "@/components/MemberPanel";
import { useChoreo } from "@/context/ChoreoContext";

export function SmartHeader() {
  const {
    state,
    totalSlots,
    setSongTitle,
    setBpm,
    togglePlayback,
    setBamiriHalfWidth,
    setBamiriDepth,
    navigateTo,
    copyFormation,
    pasteFormation,
    hasClipboard,
    insertHalfAfter,
    removeHalfAt,
    renameSectionName,
    addSection,
  } = useChoreo();

  const timelineRef = useRef<HTMLDivElement>(null);
  const [halfWInp, setHalfWInp] = useState(String(state.stage.bamiriHalfWidth));
  const [depthInp, setDepthInp] = useState(String(state.stage.bamiriDepth));
  const [memberPanelOpen, setMemberPanelOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionNameDraft, setSectionNameDraft] = useState("");

  const flatSlots = useMemo(
    () => flattenTimeline(state.sections),
    [state.sections],
  );
  const currentFlat = getFlatSlot(state.sections, state.currentCount);
  const currentSection = getCurrentSection(state.sections, state.currentCount);
  const activeSectionId = currentFlat?.sectionId ?? null;

  useEffect(() => {
    setHalfWInp(String(state.stage.bamiriHalfWidth));
    setDepthInp(String(state.stage.bamiriDepth));
  }, [state.stage.bamiriHalfWidth, state.stage.bamiriDepth]);

  useEffect(() => {
    if (!activeSectionId || !timelineRef.current) return;
    const group = timelineRef.current.querySelector(
      `[data-section-id="${activeSectionId}"]`,
    );
    group?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeSectionId]);

  useEffect(() => {
    timelineRef.current
      ?.querySelector(".cnt-btn.active")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [state.currentCount]);

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

  const startEditSection = (sectionId: string, name: string) => {
    setEditingSectionId(sectionId);
    setSectionNameDraft(name);
  };

  const commitSectionName = (sectionId: string) => {
    renameSectionName(sectionId, sectionNameDraft);
    setEditingSectionId(null);
  };

  const firstGlobalInSection = (sectionId: string) =>
    flatSlots.find((s) => s.sectionId === sectionId)?.globalIndex ?? 1;

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
              value={state.bpm}
              onChange={(e) => setBpm(parseInt(e.target.value, 10) || 128)}
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

          <button
            type="button"
            className="member-open-btn"
            onClick={() => setMemberPanelOpen(true)}
            title="メンバー編集"
          >
            <span className="bamiri-lbl">👥</span>
            <span className="member-open-num">{state.members.length}</span>
          </button>

          <div className="hdr-actions">
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

          <span className="cnt-now">
            {currentFlat?.label ?? state.currentCount}/{totalSlots}
            {currentSection?.name ? ` · ${currentSection.name}` : ""}
          </span>
        </div>

        <div className="timeline-bar compact">
          <div className="timeline timeline-focus" ref={timelineRef}>
            {state.sections.map((sec) => {
              const expanded = activeSectionId === sec.id;
              const sectionSlots = flatSlots.filter(
                (f) => f.sectionId === sec.id,
              );
              const hasSectionData = sectionSlots.some((f) =>
                countHasData(state.countData[f.globalIndex]),
              );
              return (
                <div
                  key={sec.id}
                  data-section-id={sec.id}
                  className={
                    "tl-group" + (expanded ? " expanded" : " collapsed")
                  }
                >
                  {editingSectionId === sec.id ? (
                    <input
                      className="sec-name-inp"
                      value={sectionNameDraft}
                      autoFocus
                      onChange={(e) => setSectionNameDraft(e.target.value)}
                      onBlur={() => commitSectionName(sec.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitSectionName(sec.id);
                        if (e.key === "Escape") setEditingSectionId(null);
                      }}
                      aria-label="セクション名"
                    />
                  ) : (
                    <button
                      type="button"
                      className={
                        "sec-pill" + (expanded ? " cur" : "") +
                        (hasSectionData ? " has-d" : "")
                      }
                      onClick={() => navigateTo(firstGlobalInSection(sec.id))}
                      onDoubleClick={() => startEditSection(sec.id, sec.name)}
                      title="ダブルクリックで名前変更"
                    >
                      {sec.name}
                    </button>
                  )}

                  <div className="tl-body" aria-hidden={!expanded}>
                    <div className="tl-div" />
                    <div className="tl-counts">
                      {sec.slots.map((slot, slotIdx) => {
                        const global = flatSlots.find(
                          (f) =>
                            f.sectionId === sec.id && f.slotIndex === slotIdx,
                        )?.globalIndex;
                        if (!global) return null;
                        const hasD = countHasData(state.countData[global]);
                        const isHalf = slot.type === "half";
                        const label = isHalf ? "&" : String(slot.num);
                        return (
                          <Fragment key={`${sec.id}-${slotIdx}`}>
                            {slotIdx > 0 && (
                              <button
                                type="button"
                                className="ins-half-btn"
                                onClick={() =>
                                  insertHalfAfter(sec.id, slotIdx - 1)
                                }
                                title="＆を挿入（半カウント）"
                              >
                                +
                              </button>
                            )}
                            <button
                              type="button"
                              className={
                                "cnt-btn" +
                                (global === state.currentCount
                                  ? " active"
                                  : "") +
                                (hasD ? " has-d" : "") +
                                (isHalf ? " half" : "")
                              }
                              onClick={() => navigateTo(global)}
                              onDoubleClick={
                                isHalf
                                  ? () => removeHalfAt(sec.id, slotIdx)
                                  : undefined
                              }
                              title={
                                isHalf
                                  ? "半カウント — ダブルクリックで削除"
                                  : undefined
                              }
                            >
                              {label}
                            </button>
                          </Fragment>
                        );
                      })}
                      <button
                        type="button"
                        className="ins-half-btn"
                        onClick={() =>
                          insertHalfAfter(sec.id, sec.slots.length - 1)
                        }
                        title="＆を挿入（半カウント）"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              className="add-sec-btn"
              onClick={() => addSection()}
              title="セクションを追加（8カウント）"
            >
              + 追加
            </button>
          </div>
        </div>
      </div>

      <MemberPanel
        open={memberPanelOpen}
        onClose={() => setMemberPanelOpen(false)}
      />
    </>
  );
}
