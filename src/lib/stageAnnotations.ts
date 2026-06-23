import type { Position, StageAnnotation } from "./types";

export const STAGE_DRAW_COLORS = [
  "#ffd166",
  "#7c5cfc",
  "#fc5c7d",
  "#3ddc84",
  "#e8ebf8",
] as const;

/** 矢印・ペンの線の太さ（画面 px 相当） */
export const STAGE_STROKE_WIDTHS = [1.6, 2.4, 3.4] as const;

export const DEFAULT_DRAW_COLOR = STAGE_DRAW_COLORS[0];
export const DEFAULT_ARROW_STROKE = STAGE_STROKE_WIDTHS[1];
export const DEFAULT_PEN_STROKE = STAGE_STROKE_WIDTHS[0];
export const DEFAULT_MARK_SIZE = 1.15;
export const DEFAULT_MARK_STROKE = 0.75;

/** @deprecated use DEFAULT_ARROW_STROKE or DEFAULT_PEN_STROKE */
export const DEFAULT_DRAW_STROKE = DEFAULT_ARROW_STROKE;

const HIT_THRESHOLD = 4.2;
/** 見た目のハンドルは出さず、端付近の当たり判定でリサイズ */
const HANDLE_HIT_THRESHOLD = 3.2;

export function clientToStagePercent(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): Position {
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;
  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
  };
}

export function clientToStageSvg(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): Position {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) {
    const rect = svg.getBoundingClientRect();
    return clientToStagePercent(clientX, clientY, rect);
  }
  const local = pt.matrixTransform(ctm.inverse());
  return {
    x: Math.max(0, Math.min(100, local.x)),
    y: Math.max(0, Math.min(100, local.y)),
  };
}

export function newAnnotationId(): string {
  return `ann-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function penPathFromPoints(points: Position[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

export function shouldAppendPenPoint(
  points: Position[],
  next: Position,
  minDist = 0.25,
): boolean {
  if (points.length === 0) return true;
  const last = points[points.length - 1];
  return Math.hypot(next.x - last.x, next.y - last.y) >= minDist;
}

export function isArrowLongEnough(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  minLen = 2,
): boolean {
  return Math.hypot(x2 - x1, y2 - y1) >= minLen;
}

export function getCountAnnotations(
  countData: Record<number, { annotations?: StageAnnotation[] }>,
  count: number,
): StageAnnotation[] {
  return countData[count]?.annotations ?? [];
}

export function annColor(ann: StageAnnotation): string {
  return ann.color ?? DEFAULT_DRAW_COLOR;
}

export function annStroke(ann: StageAnnotation): number {
  return ann.strokeWidth ?? DEFAULT_DRAW_STROKE;
}

export function annMarkSize(ann: StageAnnotation): number {
  if (ann.type !== "mark") return DEFAULT_MARK_SIZE;
  return ann.size ?? DEFAULT_MARK_SIZE;
}

export function annMarkStroke(ann: StageAnnotation): number {
  if (ann.type !== "mark") return annStroke(ann);
  return ann.strokeWidth ?? DEFAULT_MARK_STROKE;
}

function distPointToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function distToPolyline(points: Position[], p: Position): number {
  let min = Infinity;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    min = Math.min(min, distPointToSegment(p.x, p.y, a.x, a.y, b.x, b.y));
  }
  return min;
}

export function hitTestAnnotations(
  annotations: StageAnnotation[],
  p: Position,
  threshold = HIT_THRESHOLD,
): string | null {
  for (let i = annotations.length - 1; i >= 0; i--) {
    const ann = annotations[i];
    if (ann.type === "mark") {
      const s = annMarkSize(ann);
      if (Math.hypot(p.x - ann.x, p.y - ann.y) <= s + threshold * 0.6) {
        return ann.id;
      }
      continue;
    }
    if (ann.type === "arrow") {
      const lineDist = distPointToSegment(p.x, p.y, ann.x1, ann.y1, ann.x2, ann.y2);
      const endDist = Math.min(
        Math.hypot(p.x - ann.x1, p.y - ann.y1),
        Math.hypot(p.x - ann.x2, p.y - ann.y2),
      );
      if (lineDist <= threshold || endDist <= threshold * 1.2) {
        return ann.id;
      }
      continue;
    }
    if (ann.points.length >= 2) {
      if (distToPolyline(ann.points, p) <= threshold) return ann.id;
    }
  }
  return null;
}

export function translateAnnotation(
  ann: StageAnnotation,
  dx: number,
  dy: number,
): StageAnnotation {
  if (ann.type === "arrow") {
    return {
      ...ann,
      x1: ann.x1 + dx,
      y1: ann.y1 + dy,
      x2: ann.x2 + dx,
      y2: ann.y2 + dy,
    };
  }
  if (ann.type === "mark") {
    return { ...ann, x: ann.x + dx, y: ann.y + dy };
  }
  return {
    ...ann,
    points: ann.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })),
  };
}

export type AnnotationHandle =
  | { kind: "arrow-start" | "arrow-end" }
  | { kind: "mark-size" };

export function hitTestHandle(
  ann: StageAnnotation,
  p: Position,
  threshold = HANDLE_HIT_THRESHOLD,
): AnnotationHandle | null {
  if (ann.type === "arrow") {
    const dx = ann.x2 - ann.x1;
    const dy = ann.y2 - ann.y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return null;
    let t = ((p.x - ann.x1) * dx + (p.y - ann.y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const dStart = Math.hypot(p.x - ann.x1, p.y - ann.y1);
    const dEnd = Math.hypot(p.x - ann.x2, p.y - ann.y2);
    if (t <= 0.2 && dStart <= threshold) {
      return { kind: "arrow-start" };
    }
    if (t >= 0.8 && dEnd <= threshold) {
      return { kind: "arrow-end" };
    }
    return null;
  }
  if (ann.type === "mark") {
    const s = annMarkSize(ann);
    const distToCenter = Math.hypot(p.x - ann.x, p.y - ann.y);
    // 中心付近は常に移動。外側の先端だけリサイズ
    if (distToCenter <= s * 0.55) return null;
    const corners = [
      { x: ann.x - s, y: ann.y - s },
      { x: ann.x + s, y: ann.y - s },
      { x: ann.x - s, y: ann.y + s },
      { x: ann.x + s, y: ann.y + s },
    ];
    for (const c of corners) {
      if (Math.hypot(p.x - c.x, p.y - c.y) <= threshold) {
        return { kind: "mark-size" };
      }
    }
  }
  return null;
}

export function applyHandleDrag(
  ann: StageAnnotation,
  handle: AnnotationHandle,
  p: Position,
): StageAnnotation {
  if (ann.type === "arrow") {
    if (handle.kind === "arrow-start") {
      return { ...ann, x1: p.x, y1: p.y };
    }
    return { ...ann, x2: p.x, y2: p.y };
  }
  if (ann.type === "mark" && handle.kind === "mark-size") {
    const size = Math.max(
      0.7,
      Math.min(7, Math.hypot(p.x - ann.x, p.y - ann.y) / Math.SQRT2),
    );
    return { ...ann, size };
  }
  return ann;
}

export function annotationCenter(ann: StageAnnotation): Position {
  if (ann.type === "arrow") {
    return { x: (ann.x1 + ann.x2) / 2, y: (ann.y1 + ann.y2) / 2 };
  }
  if (ann.type === "mark") {
    return { x: ann.x, y: ann.y };
  }
  if (!ann.points.length) return { x: 50, y: 50 };
  const sum = ann.points.reduce((acc, pt) => ({ x: acc.x + pt.x, y: acc.y + pt.y }), {
    x: 0,
    y: 0,
  });
  return { x: sum.x / ann.points.length, y: sum.y / ann.points.length };
}

export function strokeWidthFromIndex(index: number): number {
  return STAGE_STROKE_WIDTHS[
    Math.max(0, Math.min(STAGE_STROKE_WIDTHS.length - 1, index))
  ];
}

export function strokeIndexFromWidth(width: number): number {
  let best = 0;
  let bestDiff = Infinity;
  STAGE_STROKE_WIDTHS.forEach((w, i) => {
    const d = Math.abs(w - width);
    if (d < bestDiff) {
      bestDiff = d;
      best = i;
    }
  });
  return best;
}
