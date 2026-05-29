"use client";

import {
  getGridXLabels,
  getGridXLines,
  getGridYLabels,
  getGridYLines,
} from "@/lib/gridUtils";

interface Props {
  halfW: number;
  depth: number;
}

export function StageFloor({ halfW, depth }: Props) {
  const xLines = getGridXLines(halfW);
  const yLines = getGridYLines(depth);
  const xLabels = getGridXLabels(halfW);
  const yLabels = getGridYLabels(depth);
  const centerIdx = Math.floor(xLines.length / 2);
  const lblSize =
    xLabels.length > 18 || yLabels.length > 14
      ? 7
      : xLabels.length > 12
        ? 8
        : 9;

  return (
    <div
      className="stage-floor s-grid"
      style={{ "--grid-lbl-size": `${lblSize}px` } as React.CSSProperties}
      aria-hidden
    >
      <svg
        className="floor-grid-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {yLines.map((y, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={y}
            x2={100}
            y2={y}
            className={i === 0 ? "grid-line front-line" : "grid-line"}
          />
        ))}
        {xLines.map((x, i) => (
          <line
            key={`v${i}`}
            x1={x}
            y1={0}
            x2={x}
            y2={100}
            className={i === centerIdx ? "grid-line center-line" : "grid-line"}
          />
        ))}
      </svg>

      <div className="floor-lbl-x">
        {xLabels.map(({ col, x, label }) => (
          <span
            key={`xl${col}`}
            className="grid-lbl grid-lbl-x"
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
            className="grid-lbl grid-lbl-y"
            style={{ top: `${y}%` }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
