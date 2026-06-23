"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STAGE_SCALE_MAX, STAGE_SCALE_MIN } from "@/lib/constants";
import { calcStagePixelSize } from "@/lib/gridUtils";
import { dotFontPx } from "@/lib/choreoUtils";
import {
  applyHandleDrag,
  clientToStagePercent,
  clientToStageSvg,
  DEFAULT_ARROW_STROKE,
  DEFAULT_DRAW_COLOR,
  DEFAULT_MARK_SIZE,
  DEFAULT_MARK_STROKE,
  DEFAULT_PEN_STROKE,
  getCountAnnotations,
  hitTestAnnotations,
  hitTestHandle,
  isArrowLongEnough,
  newAnnotationId,
  shouldAppendPenPoint,
  translateAnnotation,
  type AnnotationHandle,
} from "@/lib/stageAnnotations";
import { useChoreo } from "@/context/ChoreoContext";
import { StageFloor } from "@/components/StageFloor";
import { StageToolbar } from "@/components/StageToolbar";
import {
  StageAnnotationsLayer,
  type StageAnnotationsLayerHandle,
} from "@/components/StageAnnotationsLayer";
import { StageDrawToggleIcon } from "@/components/stageToolIcons";
import type { Position, StageAnnotation, StageDrawTool } from "@/lib/types";

type ResizeAxis = "e" | "s" | "se";

type DrawPreview =
  | {
      type: "arrow";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      strokeWidth: number;
    }
  | {
      type: "pen";
      points: Position[];
      color: string;
      strokeWidth: number;
    };

type ActiveDraw =
  | { type: "arrow"; x1: number; y1: number; x2: number; y2: number }
  | { type: "pen"; points: Position[] };

const DRAG_THRESHOLD_PX = 8;

export function StageArea() {
  const {
    state,
    strings: UI,
    currentBeatSec,
    draggingMemberId,
    selectedMemberId,
    selectMember,
    selectAnnotation,
    selectedAnnotationId,
    isMemberVisibleOnCurrent,
    stopPlayback,
    updateMemberPosition,
    setDraggingMemberId,
    pushUndoHistory,
    setStageScaleW,
    setStageScaleH,
    memberDotPx,
    getMemberPos,
    isViewOnly,
    displayCount,
    addStageAnnotation,
    updateStageAnnotation,
    removeStageAnnotation,
  } = useChoreo();

  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [stageTool, setStageTool] = useState<StageDrawTool>("move");
  const [drawColor, setDrawColor] = useState<string>(DEFAULT_DRAW_COLOR);
  const [drawPreview, setDrawPreview] = useState<DrawPreview | null>(null);

  const activeDrawRef = useRef<ActiveDraw | null>(null);
  const annDragRef = useRef<{
    id: string;
    origin: StageAnnotation;
    originPointer: Position;
  } | null>(null);
  const handleDragRef = useRef<{
    id: string;
    handle: AnnotationHandle;
    origin: StageAnnotation;
  } | null>(null);
  const annInteractRef = useRef<HTMLDivElement>(null);
  const annotationsLayerRef = useRef<StageAnnotationsLayerHandle>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const conRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; ox: number; oy: number } | null>(null);
  const pendingPointerRef = useRef<{
    id: number;
    ox: number;
    oy: number;
    startX: number;
    startY: number;
  } | null>(null);
  const resizeRef = useRef<{
    axis: ResizeAxis;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    wrapW: number;
    wrapH: number;
  } | null>(null);

  const [stageSize, setStageSize] = useState({ w: 400, h: 500 });
  const [isResizing, setIsResizing] = useState(false);
  const [stageHovered, setStageHovered] = useState(false);
  const showResizeHandles = stageHovered || isResizing;
  const { bamiriHalfWidth, bamiriDepth, scaleW, scaleH } = state.stage;
  const dotFont = dotFontPx(memberDotPx);
  const annotations = getCountAnnotations(state.countData, displayCount);
  const isArrowMarkTool =
    (stageTool === "arrow" || stageTool === "mark") &&
    !isViewOnly &&
    !state.isPlaying &&
    toolbarOpen;
  const isPenTool =
    stageTool === "pen" && !isViewOnly && !state.isPlaying && toolbarOpen;
  const annInteractive = !isViewOnly && !state.isPlaying && !isArrowMarkTool;
  const selectedAnnotation =
    selectedAnnotationId != null
      ? (annotations.find((a) => a.id === selectedAnnotationId) ?? null)
      : null;

  const getStagePoint = useCallback((clientX: number, clientY: number): Position => {
    const svg = annotationsLayerRef.current?.svg;
    if (svg) return clientToStageSvg(svg, clientX, clientY);
    const con = conRef.current;
    if (!con) return { x: 0, y: 0 };
    return clientToStagePercent(clientX, clientY, con.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (isViewOnly || state.isPlaying) {
      setStageTool("move");
      setDrawPreview(null);
      activeDrawRef.current = null;
      annDragRef.current = null;
      handleDragRef.current = null;
      setToolbarOpen(false);
    }
  }, [isViewOnly, state.isPlaying]);

  useEffect(() => {
    if (!selectedAnnotation?.color) return;
    setDrawColor(selectedAnnotation.color);
  }, [selectedAnnotationId, selectedAnnotation?.color]);

  useEffect(() => {
    selectAnnotation(null);
  }, [displayCount, selectAnnotation]);

  const resizeStage = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const wr = wrap.getBoundingClientRect();
    setStageSize(calcStagePixelSize(wr.width, wr.height, scaleW, scaleH));
  }, [scaleW, scaleH]);

  useEffect(() => {
    resizeStage();
    const ro = new ResizeObserver(resizeStage);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", resizeStage);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resizeStage);
    };
  }, [resizeStage]);

  const onMove = useCallback(
    (cx: number, cy: number) => {
      const handleDrag = handleDragRef.current;
      if (handleDrag) {
        const p = getStagePoint(cx, cy);
        updateStageAnnotation(
          handleDrag.id,
          applyHandleDrag(handleDrag.origin, handleDrag.handle, p),
        );
        return;
      }

      const annDrag = annDragRef.current;
      if (annDrag) {
        const now = getStagePoint(cx, cy);
        const dx = now.x - annDrag.originPointer.x;
        const dy = now.y - annDrag.originPointer.y;
        updateStageAnnotation(annDrag.id, translateAnnotation(annDrag.origin, dx, dy));
        return;
      }

      const pending = pendingPointerRef.current;
      if (pending && !dragRef.current) {
        if (Math.hypot(cx - pending.startX, cy - pending.startY) > DRAG_THRESHOLD_PX) {
          dragRef.current = {
            id: pending.id,
            ox: pending.ox,
            oy: pending.oy,
          };
          pushUndoHistory();
          setDraggingMemberId(pending.id);
          pendingPointerRef.current = null;
        }
      }

      const d = dragRef.current;
      const con = conRef.current;
      if (!d || !con) return;
      const rect = con.getBoundingClientRect();
      const x = ((cx - d.ox - rect.left) / rect.width) * 100;
      const y = ((cy - d.oy - rect.top) / rect.height) * 100;
      updateMemberPosition(d.id, x, y);
    },
    [
      updateMemberPosition,
      setDraggingMemberId,
      pushUndoHistory,
      getStagePoint,
      updateStageAnnotation,
    ],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setDraggingMemberId(null);
  }, [setDraggingMemberId]);

  const onResizeMove = useCallback(
    (cx: number, cy: number) => {
      const r = resizeRef.current;
      if (!r || r.wrapW <= 0 || r.wrapH <= 0) return;
      const dx = cx - r.startX;
      const dy = cy - r.startY;
      const { axis } = r;
      if (axis === "e" || axis === "se") {
        const newW = Math.max(80, r.startW + dx);
        const pct = Math.round((newW / r.wrapW) * 100);
        setStageScaleW(Math.max(STAGE_SCALE_MIN, Math.min(STAGE_SCALE_MAX, pct)));
      }
      if (axis === "s" || axis === "se") {
        const newH = Math.max(80, r.startH + dy);
        const pct = Math.round((newH / r.wrapH) * 100);
        setStageScaleH(Math.max(STAGE_SCALE_MIN, Math.min(STAGE_SCALE_MAX, pct)));
      }
    },
    [setStageScaleW, setStageScaleH],
  );

  const endResize = useCallback(() => {
    resizeRef.current = null;
  }, []);

  const finishPointer = useCallback(() => {
    const pending = pendingPointerRef.current;
    if (pending && !dragRef.current) {
      selectMember(pending.id);
    }
    pendingPointerRef.current = null;
    endDrag();
  }, [selectMember, endDrag]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      onMove(e.clientX, e.clientY);
      if (resizeRef.current) onResizeMove(e.clientX, e.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (
        pendingPointerRef.current ||
        dragRef.current ||
        annDragRef.current ||
        handleDragRef.current ||
        activeDrawRef.current
      ) {
        e.preventDefault();
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      } else if (resizeRef.current) {
        e.preventDefault();
        onResizeMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onEnd = () => {
      finishPointer();
      endResize();
      annDragRef.current = null;
      handleDragRef.current = null;
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [onMove, onResizeMove, finishPointer, endResize]);

  const startMemberPointer = (e: React.MouseEvent | React.TouchEvent, mid: number) => {
    if (isViewOnly || isArrowMarkTool) return;
    if (state.isPlaying) stopPlayback();
    e.preventDefault();
    e.stopPropagation();
    selectAnnotation(null);
    const con = conRef.current;
    if (!con) return;
    const rect = con.getBoundingClientRect();
    const p = getMemberPos(mid);
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    pendingPointerRef.current = {
      id: mid,
      ox: cx - (rect.left + (p.x / 100) * rect.width),
      oy: cy - (rect.top + (p.y / 100) * rect.height),
      startX: cx,
      startY: cy,
    };
  };

  const onStageBackgroundDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (isArrowMarkTool || annInteractive) return;
    if ((e.target as HTMLElement).closest(".m-dot")) return;
    selectMember(null);
    selectAnnotation(null);
  };

  const handleInteractPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!annInteractive || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const p = getStagePoint(e.clientX, e.clientY);

    if (isPenTool) {
      selectAnnotation(null);
      pushUndoHistory();
      activeDrawRef.current = { type: "pen", points: [p] };
      setDrawPreview({
        type: "pen",
        points: [p],
        color: drawColor,
        strokeWidth: DEFAULT_PEN_STROKE,
      });
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (selectedAnnotation) {
      const handle = hitTestHandle(selectedAnnotation, p);
      if (handle) {
        pushUndoHistory();
        handleDragRef.current = {
          id: selectedAnnotation.id,
          handle,
          origin: selectedAnnotation,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
    }

    const hitId = hitTestAnnotations(annotations, p);
    if (hitId) {
      const ann = annotations.find((a) => a.id === hitId);
      if (!ann) return;
      const handle = hitTestHandle(ann, p);
      if (handle) {
        pushUndoHistory();
        selectAnnotation(hitId);
        handleDragRef.current = {
          id: hitId,
          handle,
          origin: ann,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
      pushUndoHistory();
      selectAnnotation(hitId);
      annDragRef.current = {
        id: hitId,
        origin: ann,
        originPointer: p,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    selectAnnotation(null);
  };

  const handleInteractPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const draw = activeDrawRef.current;
    if (draw?.type === "pen") {
      activeDrawRef.current = null;
      setDrawPreview(null);
      finishDraw(draw);
    }
    annDragRef.current = null;
    handleDragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const finishDraw = useCallback(
    (draw: ActiveDraw): string | null => {
      if (draw.type === "arrow") {
        if (!isArrowLongEnough(draw.x1, draw.y1, draw.x2, draw.y2)) return null;
        const id = newAnnotationId();
        addStageAnnotation({
          id,
          type: "arrow",
          x1: draw.x1,
          y1: draw.y1,
          x2: draw.x2,
          y2: draw.y2,
          color: drawColor,
          strokeWidth: DEFAULT_ARROW_STROKE,
        });
        return id;
      }
      if (draw.points.length < 2) return null;
      const id = newAnnotationId();
      addStageAnnotation({
        id,
        type: "pen",
        points: draw.points,
        color: drawColor,
        strokeWidth: DEFAULT_PEN_STROKE,
      });
      return id;
    },
    [addStageAnnotation, drawColor],
  );

  const finishPlacement = useCallback(
    (newId: string | null) => {
      setStageTool("move");
      selectAnnotation(newId);
    },
    [selectAnnotation],
  );

  const handleDrawPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isArrowMarkTool || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    selectAnnotation(null);
    const p = getStagePoint(e.clientX, e.clientY);

    if (stageTool === "mark") {
      pushUndoHistory();
      const id = newAnnotationId();
      addStageAnnotation({
        id,
        type: "mark",
        x: p.x,
        y: p.y,
        color: drawColor,
        strokeWidth: DEFAULT_MARK_STROKE,
        size: DEFAULT_MARK_SIZE,
      });
      finishPlacement(id);
      return;
    }

    pushUndoHistory();
    if (stageTool === "arrow") {
      activeDrawRef.current = {
        type: "arrow",
        x1: p.x,
        y1: p.y,
        x2: p.x,
        y2: p.y,
      };
      setDrawPreview({
        type: "arrow",
        x1: p.x,
        y1: p.y,
        x2: p.x,
        y2: p.y,
        color: drawColor,
        strokeWidth: DEFAULT_ARROW_STROKE,
      });
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleDrawPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const draw = activeDrawRef.current;
    if (!draw) return;
    const p = getStagePoint(e.clientX, e.clientY);
    if (draw.type === "arrow") {
      draw.x2 = p.x;
      draw.y2 = p.y;
      setDrawPreview({
        type: "arrow",
        x1: draw.x1,
        y1: draw.y1,
        x2: p.x,
        y2: p.y,
        color: drawColor,
        strokeWidth: DEFAULT_ARROW_STROKE,
      });
      return;
    }
    if (shouldAppendPenPoint(draw.points, p)) {
      draw.points.push(p);
      setDrawPreview({
        type: "pen",
        points: [...draw.points],
        color: drawColor,
        strokeWidth: DEFAULT_PEN_STROKE,
      });
    }
  };

  const handleDrawPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const draw = activeDrawRef.current;
    if (!draw) return;
    activeDrawRef.current = null;
    setDrawPreview(null);
    const newId = finishDraw(draw);
    if (draw.type === "arrow") {
      finishPlacement(newId);
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleDrawColorChange = (color: string) => {
    setDrawColor(color);
    if (!selectedAnnotation) return;
    pushUndoHistory();
    updateStageAnnotation(selectedAnnotation.id, {
      ...selectedAnnotation,
      color,
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedAnnotationId) return;
    pushUndoHistory();
    removeStageAnnotation(selectedAnnotationId);
  };

  const startResize = (e: React.PointerEvent<HTMLDivElement>, axis: ResizeAxis) => {
    if (isViewOnly) return;
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const wrap = wrapRef.current;
    if (!wrap) return;
    const wr = wrap.getBoundingClientRect();
    pushUndoHistory();
    resizeRef.current = {
      axis,
      startX: e.clientX,
      startY: e.clientY,
      startW: stageSize.w,
      startH: stageSize.h,
      wrapW: wr.width,
      wrapH: wr.height,
    };
    setIsResizing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeRef.current) return;
    onResizeMove(e.clientX, e.clientY);
  };

  const endResizePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeRef.current) return;
    resizeRef.current = null;
    setIsResizing(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const dotTransition =
    draggingMemberId !== null
      ? "none"
      : state.isPlaying
        ? currentBeatSec <= 0
          ? "none"
          : `left ${currentBeatSec}s linear, top ${currentBeatSec}s linear, width 0.12s ease, height 0.12s ease, font-size 0.12s ease, opacity ${Math.min(currentBeatSec, 0.25)}s ease`
        : "left 0.28s ease-in-out, top 0.28s ease-in-out, width 0.12s ease, height 0.12s ease, font-size 0.12s ease";

  return (
    <div className="stage-main">
      <div className="stage-area">
        <div
          className="stage-wrap"
          ref={wrapRef}
          onMouseEnter={() => setStageHovered(true)}
          onMouseLeave={() => setStageHovered(false)}
        >
          <div
            className={
              "stage-frame" +
              (showResizeHandles ? " show-resize-handles" : "") +
              (isResizing ? " resizing" : "")
            }
            style={{ width: stageSize.w, height: stageSize.h }}
          >
            {!isViewOnly ? (
              <div className="stage-draw-toggle-wrap">
                <button
                  type="button"
                  className={"stage-draw-toggle" + (toolbarOpen ? " open" : "")}
                  onClick={() => {
                    setToolbarOpen((v) => {
                      if (!v) setStageTool("move");
                      else setStageTool("move");
                      return !v;
                    });
                  }}
                  disabled={state.isPlaying}
                  title={UI.stageToolToggle}
                  aria-label={UI.stageToolToggle}
                  aria-expanded={toolbarOpen}
                >
                  <span className="stage-draw-toggle-icon" aria-hidden>
                    <StageDrawToggleIcon />
                  </span>
                  <span className="stage-draw-toggle-label">
                    {UI.stageDrawToolLabel}
                  </span>
                </button>
              </div>
            ) : null}

            {toolbarOpen && !isViewOnly ? (
              <div className="stage-toolbar-float">
                <StageToolbar
                  tool={stageTool}
                  onToolChange={setStageTool}
                  onDeleteSelected={handleDeleteSelected}
                  canDeleteSelected={selectedAnnotationId != null}
                  disabled={state.isPlaying}
                  drawColor={drawColor}
                  onDrawColorChange={handleDrawColorChange}
                  onClose={() => {
                    setToolbarOpen(false);
                    setStageTool("move");
                  }}
                  labels={{
                    heading: UI.stageToolHeading,
                    arrow: UI.stageToolArrow,
                    mark: UI.stageToolMark,
                    pen: UI.stageToolPen,
                    deleteSelected: UI.stageToolDeleteSelected,
                    close: UI.stageToolClose,
                    color: UI.stageToolColor,
                  }}
                />
              </div>
            ) : null}

            <div
              className={
                "stage-con" +
                (isViewOnly ? " view-only" : "") +
                (isArrowMarkTool ? " is-drawing" : "") +
                (isPenTool ? " is-pen-tool" : "")
              }
              ref={conRef}
              onMouseDown={onStageBackgroundDown}
              onTouchStart={onStageBackgroundDown}
            >
              <StageFloor
                key={`${bamiriHalfWidth}-${bamiriDepth}`}
                halfW={bamiriHalfWidth}
                depth={bamiriDepth}
              />
              <StageAnnotationsLayer
                ref={annotationsLayerRef}
                annotations={annotations}
                preview={drawPreview}
                selectedId={selectedAnnotationId}
              />
              {annInteractive ? (
                <div
                  ref={annInteractRef}
                  className="stage-ann-interact"
                  onPointerDown={handleInteractPointerDown}
                  onPointerMove={(e) => {
                    if (annDragRef.current || handleDragRef.current) {
                      onMove(e.clientX, e.clientY);
                    } else if (activeDrawRef.current?.type === "pen") {
                      handleDrawPointerMove(e);
                    }
                  }}
                  onPointerUp={handleInteractPointerUp}
                  onPointerCancel={handleInteractPointerUp}
                />
              ) : null}
              {isArrowMarkTool ? (
                <div
                  className="stage-draw-overlay"
                  onPointerDown={handleDrawPointerDown}
                  onPointerMove={handleDrawPointerMove}
                  onPointerUp={handleDrawPointerUp}
                  onPointerCancel={handleDrawPointerUp}
                />
              ) : null}
              <div className="s-lbl back">B A C K</div>
              <div className="s-lbl front">A U D I E N C E</div>
              <div className="s-lbl side left" aria-hidden>
                STAGE RIGHT
              </div>
              <div className="s-lbl side right" aria-hidden>
                STAGE LEFT
              </div>

              {state.members.map((m) => {
                const visible = isMemberVisibleOnCurrent(m.id);
                if (!visible && !state.isPlaying) return null;
                const pos = getMemberPos(m.id);
                const selected = selectedMemberId === m.id;
                return (
                  <div
                    key={m.id}
                    className={
                      "m-dot" +
                      (draggingMemberId === m.id ? " dragging" : "") +
                      (selected ? " selected" : "")
                    }
                    style={{
                      ["--dot-color" as string]: m.color,
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      width: memberDotPx,
                      height: memberDotPx,
                      fontSize: dotFont,
                      opacity: visible ? 1 : 0,
                      pointerEvents: visible && !isArrowMarkTool ? "auto" : "none",
                      transition: dotTransition,
                    }}
                    onMouseDown={(e) => startMemberPointer(e, m.id)}
                    onTouchStart={(e) => startMemberPointer(e, m.id)}
                    title={m.name}
                  >
                    {memberDotPx >= 24 ? m.name : m.name.slice(0, 3)}
                  </div>
                );
              })}
            </div>

            {!isViewOnly && (
              <>
                <div
                  className="resize-e"
                  onPointerDown={(e) => startResize(e, "e")}
                  onPointerMove={onResizePointerMove}
                  onPointerUp={endResizePointer}
                  onPointerCancel={endResizePointer}
                  title={UI.resizeWidth}
                />
                <div
                  className="resize-s"
                  onPointerDown={(e) => startResize(e, "s")}
                  onPointerMove={onResizePointerMove}
                  onPointerUp={endResizePointer}
                  onPointerCancel={endResizePointer}
                  title={UI.resizeHeight}
                />
                <div
                  className="resize-se"
                  onPointerDown={(e) => startResize(e, "se")}
                  onPointerMove={onResizePointerMove}
                  onPointerUp={endResizePointer}
                  onPointerCancel={endResizePointer}
                  title={UI.resizeStage}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
