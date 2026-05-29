"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STAGE_SCALE_MAX, STAGE_SCALE_MIN } from "@/lib/constants";
import { calcStagePixelSize } from "@/lib/gridUtils";
import { dotSizePx } from "@/lib/choreoUtils";
import { useChoreo } from "@/context/ChoreoContext";
import { StageFloor } from "@/components/StageFloor";

type ResizeAxis = "e" | "s" | "se";

export function StageArea() {
  const {
    state,
    beatIntervalSec,
    draggingMemberId,
    stopPlayback,
    updateMemberPosition,
    setDraggingMemberId,
    setStageScaleW,
    setStageScaleH,
    getMemberPos,
    isMemberVisibleOnCurrent,
  } = useChoreo();

  const wrapRef = useRef<HTMLDivElement>(null);
  const conRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; ox: number; oy: number } | null>(null);
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
  const { bamiriHalfWidth, bamiriDepth, scaleW, scaleH } = state.stage;
  const dotPx = dotSizePx(state.members.length);
  const dotFont = dotPx <= 22 ? 7 : dotPx <= 30 ? 8 : 10;

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
      const d = dragRef.current;
      const con = conRef.current;
      if (!d || !con) return;
      const rect = con.getBoundingClientRect();
      const x = ((cx - d.ox - rect.left) / rect.width) * 100;
      const y = ((cy - d.oy - rect.top) / rect.height) * 100;
      updateMemberPosition(d.id, x, y);
    },
    [updateMemberPosition],
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
        setStageScaleW(
          Math.max(STAGE_SCALE_MIN, Math.min(STAGE_SCALE_MAX, pct)),
        );
      }
      if (axis === "s" || axis === "se") {
        const newH = Math.max(80, r.startH + dy);
        const pct = Math.round((newH / r.wrapH) * 100);
        setStageScaleH(
          Math.max(STAGE_SCALE_MIN, Math.min(STAGE_SCALE_MAX, pct)),
        );
      }
    },
    [setStageScaleW, setStageScaleH],
  );

  const endResize = useCallback(() => {
    resizeRef.current = null;
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      onMove(e.clientX, e.clientY);
      onResizeMove(e.clientX, e.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (dragRef.current) {
        e.preventDefault();
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      } else if (resizeRef.current) {
        e.preventDefault();
        onResizeMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onEnd = () => {
      endDrag();
      endResize();
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
  }, [onMove, onResizeMove, endDrag, endResize]);

  const startMemberDrag = (
    e: React.MouseEvent | React.TouchEvent,
    mid: number,
  ) => {
    if (state.isPlaying) stopPlayback();
    e.preventDefault();
    e.stopPropagation();
    const con = conRef.current;
    if (!con) return;
    const rect = con.getBoundingClientRect();
    const p = getMemberPos(mid);
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragRef.current = {
      id: mid,
      ox: cx - (rect.left + (p.x / 100) * rect.width),
      oy: cy - (rect.top + (p.y / 100) * rect.height),
    };
    setDraggingMemberId(mid);
  };

  const startResize = (
    e: React.MouseEvent | React.TouchEvent,
    axis: ResizeAxis,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const wrap = wrapRef.current;
    if (!wrap) return;
    const wr = wrap.getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    resizeRef.current = {
      axis,
      startX: cx,
      startY: cy,
      startW: stageSize.w,
      startH: stageSize.h,
      wrapW: wr.width,
      wrapH: wr.height,
    };
  };

  const dotTransition =
    draggingMemberId !== null
      ? "none"
      : state.isPlaying
        ? `left ${beatIntervalSec}s linear, top ${beatIntervalSec}s linear`
        : "left 0.28s ease-in-out, top 0.28s ease-in-out";

  return (
    <div className="stage-main">
      <div className="stage-area">
        <div className="stage-wrap" ref={wrapRef}>
          <div
            className="stage-frame"
            style={{ width: stageSize.w, height: stageSize.h }}
          >
            <div className="stage-con" ref={conRef}>
              <StageFloor
                key={`${bamiriHalfWidth}-${bamiriDepth}`}
                halfW={bamiriHalfWidth}
                depth={bamiriDepth}
              />
              <div className="s-lbl back">B A C K</div>
              <div className="s-lbl front">A U D I E N C E</div>

              {state.members.map((m) => {
                if (!isMemberVisibleOnCurrent(m.id)) return null;
                const pos = getMemberPos(m.id);
                return (
                  <div
                    key={m.id}
                    className={
                      "m-dot" + (draggingMemberId === m.id ? " dragging" : "")
                    }
                    style={{
                      background: m.color,
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      width: dotPx,
                      height: dotPx,
                      fontSize: dotFont,
                      transition: dotTransition,
                    }}
                    onMouseDown={(e) => startMemberDrag(e, m.id)}
                    onTouchStart={(e) => startMemberDrag(e, m.id)}
                    title={m.name}
                  >
                    {dotPx >= 24 ? m.name : m.name.slice(0, 3)}
                  </div>
                );
              })}
            </div>

            <div
              className="resize-e"
              onMouseDown={(e) => startResize(e, "e")}
              onTouchStart={(e) => startResize(e, "e")}
              title="横幅を調整"
            />
            <div
              className="resize-s"
              onMouseDown={(e) => startResize(e, "s")}
              onTouchStart={(e) => startResize(e, "s")}
              title="高さを調整"
            />
            <div
              className="resize-se"
              onMouseDown={(e) => startResize(e, "se")}
              onTouchStart={(e) => startResize(e, "se")}
              title="サイズを調整"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
