"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import type { Position, StageAnnotation } from "@/lib/types";
import {
  annColor,
  annMarkSize,
  annMarkStroke,
  annStroke,
  penPathFromPoints,
} from "@/lib/stageAnnotations";

type Preview =
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

export type StageAnnotationsLayerHandle = {
  svg: SVGSVGElement | null;
};

interface Props {
  annotations: StageAnnotation[];
  preview: Preview | null;
  selectedId: string | null;
}

function arrowMarkerId(id: string) {
  return `stage-ann-head-${id}`;
}

function renderVisual(ann: StageAnnotation, selected: boolean) {
  const color = annColor(ann);
  const stroke = annStroke(ann);
  const selectedClass = selected ? " selected" : "";

  if (ann.type === "arrow") {
    return (
      <g key={ann.id} className={"stage-ann-group" + selectedClass}>
        <line
          x1={ann.x1}
          y1={ann.y1}
          x2={ann.x2}
          y2={ann.y2}
          className="stage-ann-arrow"
          stroke={color}
          strokeWidth={stroke}
          vectorEffect="non-scaling-stroke"
          markerEnd={`url(#${arrowMarkerId(ann.id)})`}
        />
      </g>
    );
  }

  if (ann.type === "mark") {
    const s = annMarkSize(ann);
    const stroke = annMarkStroke(ann);
    return (
      <g
        key={ann.id}
        className={"stage-ann-mark stage-ann-group" + selectedClass}
        stroke={color}
        strokeWidth={stroke}
        vectorEffect="non-scaling-stroke"
      >
        <line x1={ann.x - s} y1={ann.y - s} x2={ann.x + s} y2={ann.y + s} />
        <line x1={ann.x + s} y1={ann.y - s} x2={ann.x - s} y2={ann.y + s} />
      </g>
    );
  }

  if (ann.points.length < 2) return null;
  return (
    <g key={ann.id} className={"stage-ann-group" + selectedClass}>
      <polyline
        points={penPathFromPoints(ann.points)}
        className="stage-ann-pen"
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

function renderPreview(preview: Preview) {
  if (preview.type === "arrow") {
    return (
      <g className="preview">
        <line
          x1={preview.x1}
          y1={preview.y1}
          x2={preview.x2}
          y2={preview.y2}
          className="stage-ann-arrow preview"
          stroke={preview.color}
          strokeWidth={preview.strokeWidth}
          vectorEffect="non-scaling-stroke"
          markerEnd="url(#stage-ann-head-preview)"
        />
      </g>
    );
  }

  if (preview.points.length < 2) return null;
  return (
    <polyline
      points={penPathFromPoints(preview.points)}
      className="stage-ann-pen preview"
      fill="none"
      stroke={preview.color}
      strokeWidth={preview.strokeWidth}
      vectorEffect="non-scaling-stroke"
    />
  );
}

export const StageAnnotationsLayer = forwardRef<StageAnnotationsLayerHandle, Props>(
  function StageAnnotationsLayer({ annotations, preview, selectedId }, ref) {
    const svgRef = useRef<SVGSVGElement>(null);
    useImperativeHandle(ref, () => ({ svg: svgRef.current }));

    const arrowAnnotations = annotations.filter((a) => a.type === "arrow");

    return (
      <svg
        ref={svgRef}
        className="stage-annotations"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          {arrowAnnotations.map((ann) => (
            <marker
              key={ann.id}
              id={arrowMarkerId(ann.id)}
              markerWidth="5"
              markerHeight="5"
              refX="4"
              refY="2.5"
              orient="auto"
            >
              <path d="M0,0 L0,5 L5,2.5 z" fill={annColor(ann)} />
            </marker>
          ))}
          {preview?.type === "arrow" ? (
            <marker
              id="stage-ann-head-preview"
              markerWidth="5"
              markerHeight="5"
              refX="4"
              refY="2.5"
              orient="auto"
            >
              <path d="M0,0 L0,5 L5,2.5 z" fill={preview.color} />
            </marker>
          ) : null}
        </defs>
        {annotations.map((ann) => renderVisual(ann, ann.id === selectedId))}
        {preview ? renderPreview(preview) : null}
      </svg>
    );
  },
);
