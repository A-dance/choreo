"use client";

import {
  getGridXLabels,
  getGridXLineMeta,
  getGridYLabels,
  getGridYLineMeta,
  gridCols,
  gridLabelFontPx,
  gridRows,
} from "@/lib/gridUtils";

interface Props {
  halfW: number;
  depth: number;
}

function lineClass(kind: string): string {
  if (kind === "center") return "grid-line center-line";
  if (kind === "edge") return "grid-line edge-line";
  return "grid-line";
}

export function StageFloor({ halfW, depth }: Props) {
  const xLineMeta = getGridXLineMeta(halfW);
  const yLineMeta = getGridYLineMeta(depth);
  const xLabels = getGridXLabels(halfW);
  const yLabels = getGridYLabels(depth);
  const cols = gridCols(halfW);
  const rows = gridRows(depth);
  const dense = cols > 13 || rows > 13;
  const lblSize = gridLabelFontPx(cols, rows);

  return (
    <div
      className={"stage-floor s-grid" + (dense ? " dense" : "")}
      style={{ "--grid-lbl-size": `${lblSize}px` } as React.CSSProperties}
      aria-hidden
    >
      <svg className="floor-grid-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {yLineMeta.map((line) => (
          <line
            key={`h${line.row}`}
            x1={0}
            y1={line.y}
            x2={100}
            y2={line.y}
            className={lineClass(line.kind)}
          />
        ))}
        {xLineMeta.map((line) => (
          <line
            key={`v${line.col}`}
            x1={line.x}
            y1={0}
            x2={line.x}
            y2={100}
            className={lineClass(line.kind)}
          />
        ))}
      </svg>

      <div className="floor-lbl-x">
        {xLabels.map(({ col, x, label }) => (
          <span
            key={`xl${col}`}
            className={
              "grid-lbl grid-lbl-x" +
              (col === 0 ? " key-lbl" : "") +
              (Math.abs(col) === halfW ? " edge-lbl" : "")
            }
            style={{ left: `${x}%` }}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="floor-lbl-y">
        {yLabels.map(({ row, y, label }) => (
          <span
            key={`yl${row}`}
            className={
              "grid-lbl grid-lbl-y" +
              (row === 0 ? " key-lbl" : "") +
              (row === depth ? " edge-lbl" : "")
            }
            style={{ top: `${y}%` }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
