"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  countHasData,
  flattenTimeline,
  getFlatSlot,
  getPositionDisplayInfo,
  sectionHidesCountButtons,
} from "@/lib/choreoUtils";
import { useChoreo } from "@/context/ChoreoContext";

function PositionBar({
  isPlaying,
  pos,
}: {
  isPlaying: boolean;
  pos: ReturnType<typeof getPositionDisplayInfo>;
}) {
  const progressPct = (pos.globalIndex / pos.totalSlots) * 100;

  return (
    <div
      className={"position-bar" + (isPlaying ? " playing" : "")}
      aria-live="polite"
    >
      <div className="position-bar-head">
        {isPlaying && <span className="position-bar-dot" aria-hidden />}
        <span className={"position-bar-label" + (isPlaying ? " playing" : "")}>
          Now
        </span>
      </div>

      <div className="position-bar-main">
        <span className="position-bar-count">
          {pos.globalIndex}/{pos.totalSlots}
        </span>
        <span className="position-bar-sections">
          {pos.sectionCount} section
        </span>
      </div>

      <div className="position-bar-progress">
        <div
          className="position-bar-progress-track"
          role="progressbar"
          aria-valuenow={pos.globalIndex}
          aria-valuemin={1}
          aria-valuemax={pos.totalSlots}
          aria-label={`${pos.globalIndex}/${pos.totalSlots}、${pos.sectionCount} section`}
        >
          <div
            className="position-bar-progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function TimelineFooter() {
  const {
    state,
    navigateTo,
    insertHalfAfter,
    removeHalfAt,
    renameSectionName,
    addSection,
  } = useChoreo();

  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineDragRef = useRef<{
    startX: number;
    startScrollLeft: number;
  } | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionNameDraft, setSectionNameDraft] = useState("");

  const flatSlots = useMemo(
    () => flattenTimeline(state.sections),
    [state.sections],
  );
  const currentFlat = getFlatSlot(state.sections, state.currentCount);
  const activeSectionId = currentFlat?.sectionId ?? null;
  const positionInfo = useMemo(
    () => getPositionDisplayInfo(state.sections, state.currentCount),
    [state.sections, state.currentCount],
  );

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

  const onTimelinePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, input, .sec-name-inp")) return;
    const el = timelineRef.current;
    if (!el) return;
    timelineDragRef.current = {
      startX: e.clientX,
      startScrollLeft: el.scrollLeft,
    };
    el.setPointerCapture(e.pointerId);
    el.classList.add("is-dragging");
  }, []);

  const onTimelinePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = timelineDragRef.current;
    const el = timelineRef.current;
    if (!drag || !el) return;
    el.scrollLeft = drag.startScrollLeft - (e.clientX - drag.startX);
  }, []);

  const endTimelineDrag = useCallback((e: React.PointerEvent) => {
    const el = timelineRef.current;
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    el?.classList.remove("is-dragging");
    timelineDragRef.current = null;
  }, []);

  return (
    <div className="timeline-footer">
      <PositionBar isPlaying={state.isPlaying} pos={positionInfo} />

      <div
        className={"timeline-bar" + (state.isPlaying ? " playing" : "")}
      >
        <div
          className="timeline timeline-focus"
          ref={timelineRef}
          onPointerDown={onTimelinePointerDown}
          onPointerMove={onTimelinePointerMove}
          onPointerUp={endTimelineDrag}
          onPointerCancel={endTimelineDrag}
        >
          {state.sections.map((sec) => {
            const expanded = activeSectionId === sec.id;
            const hideCounts = sectionHidesCountButtons(sec);
            const sectionSlots = flatSlots.filter(
              (f) => f.sectionId === sec.id,
            );
            const hasSectionData = sectionSlots.some((f) =>
              countHasData(state.countData[f.globalIndex]),
            );
            const isPlayingHere =
              state.isPlaying && expanded && activeSectionId === sec.id;
            return (
              <div
                key={sec.id}
                data-section-id={sec.id}
                className={
                  "tl-group" +
                  (expanded ? " expanded" : " collapsed") +
                  (isPlayingHere ? " playing-section" : "")
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
                      "sec-pill" +
                      (expanded ? " cur" : "") +
                      (hasSectionData ? " has-d" : "") +
                      (isPlayingHere ? " playing" : "")
                    }
                    onClick={() => navigateTo(firstGlobalInSection(sec.id))}
                    onDoubleClick={() => startEditSection(sec.id, sec.name)}
                    title="ダブルクリックで名前変更"
                  >
                    {sec.name}
                  </button>
                )}

                {!hideCounts && (
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
                                (global === state.currentCount ? " active" : "") +
                                (global === state.currentCount && state.isPlaying
                                  ? " playing"
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
                                  : state.isPlaying
                                    ? "ここから再生"
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
                )}
              </div>
            );
          })}
          <button
            type="button"
            className="add-sec-btn"
            onClick={() => addSection()}
            title="Add section（8 counts）"
          >
            + Add section
          </button>
        </div>
      </div>
    </div>
  );
}
