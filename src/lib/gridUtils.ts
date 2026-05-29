import {
  BAMIRI_DEPTH_MAX,
  BAMIRI_DEPTH_MIN,
  BAMIRI_HALF_MAX,
  BAMIRI_HALF_MIN,
  DEFAULT_STAGE,
  STAGE_SCALE_MAX,
  STAGE_SCALE_MIN,
} from "./constants";
import type { Position, StageConfig } from "./types";

export function clampBamiriHalf(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_STAGE.bamiriHalfWidth;
  return Math.max(BAMIRI_HALF_MIN, Math.min(BAMIRI_HALF_MAX, Math.round(n)));
}

export function clampBamiriDepth(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_STAGE.bamiriDepth;
  return Math.max(BAMIRI_DEPTH_MIN, Math.min(BAMIRI_DEPTH_MAX, Math.round(n)));
}

export function clampScale(n: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.max(STAGE_SCALE_MIN, Math.min(STAGE_SCALE_MAX, Math.round(n)));
}

export function normalizeStage(stage: Partial<StageConfig>): StageConfig {
  return {
    bamiriHalfWidth: clampBamiriHalf(
      stage.bamiriHalfWidth ?? DEFAULT_STAGE.bamiriHalfWidth,
    ),
    bamiriDepth: clampBamiriDepth(
      stage.bamiriDepth ?? DEFAULT_STAGE.bamiriDepth,
    ),
    scaleW: clampScale(stage.scaleW ?? DEFAULT_STAGE.scaleW, DEFAULT_STAGE.scaleW),
    scaleH: clampScale(stage.scaleH ?? DEFAULT_STAGE.scaleH, DEFAULT_STAGE.scaleH),
  };
}

export function gridCols(halfW: number): number {
  return clampBamiriHalf(halfW) * 2 + 1;
}

export function gridRows(depth: number): number {
  return clampBamiriDepth(depth) + 1;
}

/** 列 col: -halfW〜0〜+halfW → X% */
export function colToX(col: number, halfW: number): number {
  const hw = clampBamiriHalf(halfW);
  const cols = hw * 2 + 1;
  const ci = col + hw;
  return ((ci + 0.5) / cols) * 100;
}

/** 行 row: 0=前（客席）〜depth=奥 → Y% */
export function rowToY(row: number, depth: number): number {
  const d = clampBamiriDepth(depth);
  const rows = d + 1;
  const ri = Math.max(0, Math.min(rows - 1, row));
  return 100 - ((ri + 0.5) / rows) * 100;
}

export function getGridXLines(halfW: number): number[] {
  const hw = clampBamiriHalf(halfW);
  const lines: number[] = [];
  for (let col = -hw; col <= hw; col++) {
    lines.push(colToX(col, hw));
  }
  return lines;
}

export function getGridYLines(depth: number): number[] {
  const d = clampBamiriDepth(depth);
  const lines: number[] = [];
  for (let row = 0; row <= d; row++) {
    lines.push(rowToY(row, d));
  }
  return lines;
}

export function getGridXLabels(halfW: number) {
  const hw = clampBamiriHalf(halfW);
  const labels: { col: number; x: number; label: string }[] = [];
  for (let col = -hw; col <= hw; col++) {
    labels.push({
      col,
      x: colToX(col, hw),
      label: col === 0 ? "0" : String(Math.abs(col)),
    });
  }
  return labels;
}

export function getGridYLabels(depth: number) {
  const d = clampBamiriDepth(depth);
  const labels: { row: number; y: number; label: string }[] = [];
  for (let row = 0; row <= d; row++) {
    labels.push({
      row,
      y: rowToY(row, d),
      label: String(row),
    });
  }
  return labels;
}

/** ばみり数とは独立 — scaleW/H で wrap 内の表示サイズを決定 */
export function calcStagePixelSize(
  wrapW: number,
  wrapH: number,
  scaleW: number,
  scaleH: number,
): { w: number; h: number } {
  return {
    w: Math.round(wrapW * (clampScale(scaleW, DEFAULT_STAGE.scaleW) / 100)),
    h: Math.round(wrapH * (clampScale(scaleH, DEFAULT_STAGE.scaleH) / 100)),
  };
}

export function clampStagePos(x: number, y: number): Position {
  return {
    x: Math.max(2, Math.min(98, x)),
    y: Math.max(2, Math.min(98, y)),
  };
}

export function gridCellCenter(
  col: number,
  row: number,
  halfW: number,
  depth: number,
): Position {
  return {
    x: colToX(col, halfW),
    y: rowToY(row, depth),
  };
}
