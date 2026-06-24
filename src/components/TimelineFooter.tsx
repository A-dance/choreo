"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { countHasData, flattenTimeline } from "@/lib/choreoUtils";
import { MAX_COUNTS_PER_SECTION } from "@/lib/constants";
import { useChoreo } from "@/context/ChoreoContext";

export function TimelineFooter() {
  const {
    state,
    strings: UI,
    isViewOnly,
    navigateTo,
    insertHalfAfter,
    removeCountAt,
    renameSectionName,
    addSection,
    deleteSection,
    addCountToSection,
    reorderSections,
  } = useChoreo();

  const countsRef = useRef<HTMLDivElement>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionNameDraft, setSectionNameDraft] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [dragSectionId, setDragSectionId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const flatSlots = useMemo(() => flattenTimeline(state.sections), [state.sections]);
  const canDeleteSection = !isViewOnly && state.sections.length > 1;
  const playbackSectionId =
    flatSlots.find((f) => f.globalIndex === state.currentCount)?.sectionId ??
    state.sections[0]?.id ??
    null;

  useEffect(() => {
    if (playbackSectionId) setSelectedSectionId(playbackSectionId);
  }, [playbackSectionId]);

  const selectedSection = state.sections.find((s) => s.id === selectedSectionId);
  const selectedSectionIndex = selectedSection
    ? state.sections.findIndex((s) => s.id === selectedSection.id) + 1
    : 1;
  const activeFullCount =
    selectedSection?.slots.filter((s) => s.type === "count").length ?? 0;
  const canAddCount = activeFullCount < MAX_COUNTS_PER_SECTION;
  const canDeleteCountInSection = selectedSection
    ? selectedSection.slots.length > 1
    : false;

  const startEditSection = (sectionId: string, name: string) => {
    if (isViewOnly) return;
    setEditingSectionId(sectionId);
    setSectionNameDraft(name);
  };

  const commitSectionName = (sectionId: string) => {
    renameSectionName(sectionId, sectionNameDraft);
    setEditingSectionId(null);
  };

  const firstGlobalInSection = (sectionId: string) =>
    flatSlots.find((s) => s.sectionId === sectionId)?.globalIndex ?? 1;

  const handleDeleteSection = (sectionId: string, name: string) => {
    if (isViewOnly || state.sections.length <= 1) return;
    if (!window.confirm(UI.deleteSectionConfirm(name))) {
      return;
    }
    deleteSection(sectionId);
    setEditingSectionId(null);
  };

  const handleSectionDoubleClick = (
    sectionId: string,
    name: string,
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    if (isViewOnly) return;
    setSelectedSectionId(sectionId);
    startEditSection(sectionId, name);
  };

  const exitSectionEdit = (sectionId: string, commit: boolean) => {
    if (commit) commitSectionName(sectionId);
    setEditingSectionId(null);
  };

  const handleDeleteCount = (sectionId: string, slotIndex: number, label: string) => {
    if (isViewOnly) return;
    const sec = state.sections.find((s) => s.id === sectionId);
    if (!sec || sec.slots.length <= 1) return;
    const global =
      flatSlots.find((f) => f.sectionId === sectionId && f.slotIndex === slotIndex)
        ?.globalIndex ?? 0;
    const hasData = countHasData(state.countData[global]);
    const confirmMessage = hasData
      ? UI.deleteCountWithDataConfirm(label)
      : UI.deleteCountConfirm(label);
    if (!window.confirm(confirmMessage)) {
      return;
    }
    removeCountAt(sectionId, slotIndex);
  };

  const renderSectionDeleteButton = (
    sectionId: string,
    name: string,
    show: boolean,
  ) => {
    if (!canDeleteSection || !show || state.isPlaying) return null;
    return (
      <button
        type="button"
        className="sec-tab-section-del"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteSection(sectionId, name);
        }}
        title={UI.deleteSection}
        aria-label={UI.deleteSectionAria(name)}
      >
        ×
      </button>
    );
  };

  const handleTabClick = (sectionId: string) => {
    if (editingSectionId && editingSectionId !== sectionId) {
      exitSectionEdit(editingSectionId, true);
    }
    setSelectedSectionId(sectionId);
    navigateTo(firstGlobalInSection(sectionId));
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    sectionId: string,
  ) => {
    if (isViewOnly || editingSectionId) {
      e.preventDefault();
      return;
    }
    setDragSectionId(sectionId);
    setSelectedSectionId(sectionId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", sectionId);
  };

  const handleDragEnd = () => {
    setDragSectionId(null);
    setDropTargetId(null);
  };

  const handleDrop = (
    e: React.DragEvent<HTMLButtonElement>,
    targetSectionId: string,
  ) => {
    if (isViewOnly) return;
    e.preventDefault();
    const fromId = dragSectionId ?? e.dataTransfer.getData("text/plain");
    if (!fromId || fromId === targetSectionId) return;
    const fromIndex = state.sections.findIndex((s) => s.id === fromId);
    const toIndex = state.sections.findIndex((s) => s.id === targetSectionId);
    if (fromIndex < 0 || toIndex < 0) return;
    reorderSections(fromIndex, toIndex);
    setSelectedSectionId(fromId);
    setDragSectionId(null);
    setDropTargetId(null);
  };

  const onCountsPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, input")) return;
    const el = countsRef.current;
    if (!el) return;
    const startX = e.clientX;
    const startScrollLeft = el.scrollLeft;
    const onMove = (ev: PointerEvent) => {
      el.scrollLeft = startScrollLeft - (ev.clientX - startX);
    };
    const onUp = () => {
      el.classList.remove("is-dragging");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    el.classList.add("is-dragging");
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, []);

  return (
    <div
      className={
        "timeline-footer" +
        (state.isPlaying ? " is-playing" : "") +
        (isViewOnly ? " view-only" : "")
      }
    >
      <div
        className={"section-tabs-bar" + (state.isPlaying ? " playing" : "")}
        role="tablist"
        aria-label={UI.sections}
      >
        {state.sections.map((sec) => {
          const isSelected = sec.id === selectedSectionId;
          const isNow = sec.id === playbackSectionId;
          const isPlayingTab = state.isPlaying && isNow;
          const isDragging = dragSectionId === sec.id;
          const isDropTarget = dropTargetId === sec.id && !isDragging;

          if (editingSectionId === sec.id) {
            return (
              <div key={sec.id} className="sec-tab-wrap selected editing">
                <input
                  className="sec-tab-inp"
                  value={sectionNameDraft}
                  autoFocus
                  onChange={(e) => setSectionNameDraft(e.target.value)}
                  onBlur={() => exitSectionEdit(sec.id, true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") exitSectionEdit(sec.id, true);
                    if (e.key === "Escape") exitSectionEdit(sec.id, false);
                  }}
                  aria-label={UI.sectionName}
                />
                {renderSectionDeleteButton(sec.id, sec.name, true)}
              </div>
            );
          }

          return (
            <div
              key={sec.id}
              className={"sec-tab-wrap" + (isSelected ? " selected" : "")}
            >
              <button
                type="button"
                role="tab"
                draggable={!isViewOnly}
                aria-selected={isSelected}
                className={
                  "sec-tab" +
                  (isSelected ? " selected" : "") +
                  (isNow ? " now" : "") +
                  (isPlayingTab ? " playing" : "") +
                  (isDragging ? " dragging" : "") +
                  (isDropTarget ? " drop-target" : "")
                }
                onClick={() => handleTabClick(sec.id)}
                onDoubleClick={(e) => handleSectionDoubleClick(sec.id, sec.name, e)}
                onDragStart={(e) => handleDragStart(e, sec.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragSectionId && dragSectionId !== sec.id) {
                    setDropTargetId(sec.id);
                  }
                }}
                onDragLeave={() => {
                  if (dropTargetId === sec.id) setDropTargetId(null);
                }}
                onDrop={(e) => handleDrop(e, sec.id)}
                title={UI.sectionTabHint}
              >
                {isNow && !state.isPlaying && (
                  <span className="sec-tab-now-dot" aria-hidden />
                )}
                {sec.name}
              </button>
              {renderSectionDeleteButton(sec.id, sec.name, isSelected)}
            </div>
          );
        })}
        {!isViewOnly && (
          <button type="button" className="sec-tab add" onClick={() => addSection()}>
            + Add section
          </button>
        )}
      </div>

      {selectedSection && (
        <div
          className={
            "timeline-bar section-counts" + (state.isPlaying ? " playing" : "")
          }
        >
          <div
            className="timeline-counts-row"
            ref={countsRef}
            onPointerDown={onCountsPointerDown}
          >
            <div className="tl-counts">
              <span className="timeline-phrase-label" aria-hidden>
                S{selectedSectionIndex}
              </span>
              {selectedSection.slots.map((slot, slotIdx) => {
                const global = flatSlots.find(
                  (f) => f.sectionId === selectedSection.id && f.slotIndex === slotIdx,
                )?.globalIndex;
                if (!global) return null;
                const hasD = countHasData(state.countData[global]);
                const isHalf = slot.type === "half";
                const label = isHalf ? "&" : String(slot.num);
                const isActive = global === state.currentCount;
                return (
                  <Fragment key={`${selectedSection.id}-${slotIdx}`}>
                    {slotIdx > 0 && !isViewOnly && (
                      <button
                        type="button"
                        className="ins-half-btn"
                        onClick={() => insertHalfAfter(selectedSection.id, slotIdx - 1)}
                        title={UI.insertHalfCount}
                        aria-label={UI.insertHalfCount}
                      >
                        +
                      </button>
                    )}
                    <div className={"cnt-wrap" + (isActive ? " selected" : "")}>
                      <button
                        type="button"
                        className={
                          "cnt-btn" +
                          (isActive ? " active" : "") +
                          (isActive && state.isPlaying ? " playing" : "") +
                          (hasD ? " has-d" : "") +
                          (isHalf ? " half" : "")
                        }
                        onClick={() => navigateTo(global)}
                        title={UI.countDeleteHint}
                      >
                        {label}
                      </button>
                      {!isViewOnly &&
                        canDeleteCountInSection &&
                        isActive &&
                        !state.isPlaying && (
                          <button
                            type="button"
                            className="cnt-slot-del"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCount(selectedSection.id, slotIdx, label);
                            }}
                            title={UI.deleteCount}
                            aria-label={UI.deleteCountAria(label)}
                          >
                            ×
                          </button>
                        )}
                    </div>
                  </Fragment>
                );
              })}
              {!isViewOnly && (
                <>
                  <button
                    type="button"
                    className="ins-half-btn"
                    onClick={() =>
                      insertHalfAfter(
                        selectedSection.id,
                        selectedSection.slots.length - 1,
                      )
                    }
                    title={UI.insertHalfCount}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="add-count-btn"
                    disabled={!canAddCount}
                    onClick={() => addCountToSection(selectedSection.id)}
                  >
                    + Add count
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
