"use client";

import type { ReactNode } from "react";
import type { StageDrawTool } from "@/lib/types";
import { STAGE_DRAW_COLORS } from "@/lib/stageAnnotations";
import { TrashIcon } from "@/components/sidebarIcons";
import {
  StageArrowIcon,
  StageMarkIcon,
  StagePenIcon,
} from "@/components/stageToolIcons";

function ToolButton({
  icon,
  label,
  active,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={"stage-tool-btn" + (active ? " active" : "")}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
    >
      {icon}
    </button>
  );
}

interface Props {
  tool: StageDrawTool;
  onToolChange: (tool: StageDrawTool) => void;
  onDeleteSelected: () => void;
  canDeleteSelected: boolean;
  disabled?: boolean;
  drawColor: string;
  onDrawColorChange: (color: string) => void;
  onClose: () => void;
  labels: {
    heading: string;
    arrow: string;
    mark: string;
    pen: string;
    deleteSelected: string;
    close: string;
    color: string;
  };
}

export function StageToolbar({
  tool,
  onToolChange,
  onDeleteSelected,
  canDeleteSelected,
  disabled,
  drawColor,
  onDrawColorChange,
  onClose,
  labels,
}: Props) {
  const pick = (next: StageDrawTool) => {
    onToolChange(tool === next ? "move" : next);
  };

  return (
    <div className="stage-toolbar" role="toolbar" aria-label={labels.heading}>
      <div className="stage-toolbar-head">
        <div className="stage-toolbar-tools">
          <ToolButton
            icon={<StageArrowIcon />}
            label={labels.arrow}
            active={tool === "arrow"}
            onClick={() => pick("arrow")}
            disabled={disabled}
          />
          <ToolButton
            icon={<StageMarkIcon />}
            label={labels.mark}
            active={tool === "mark"}
            onClick={() => pick("mark")}
            disabled={disabled}
          />
          <ToolButton
            icon={<StagePenIcon />}
            label={labels.pen}
            active={tool === "pen"}
            onClick={() => pick("pen")}
            disabled={disabled}
          />
        </div>
        <div className="stage-toolbar-head-actions">
          <button
            type="button"
            className="undo-btn stage-toolbar-delete-btn"
            onClick={onDeleteSelected}
            disabled={disabled || !canDeleteSelected}
            title={labels.deleteSelected}
            aria-label={labels.deleteSelected}
          >
            <span className="undo-btn-icon">
              <TrashIcon />
            </span>
          </button>
          <button
            type="button"
            className="stage-tool-close-icon"
            onClick={onClose}
            disabled={disabled}
            aria-label={labels.close}
          >
            ×
          </button>
        </div>
      </div>

      <div className="stage-tool-colors">
        {STAGE_DRAW_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={"stage-tool-color-btn" + (drawColor === color ? " active" : "")}
            style={{ ["--swatch" as string]: color }}
            onClick={() => onDrawColorChange(color)}
            disabled={disabled}
            aria-label={labels.color}
            aria-pressed={drawColor === color}
          />
        ))}
      </div>
    </div>
  );
}
