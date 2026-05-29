"use client";

import { useEffect, useState } from "react";
import { COLORS, MAX_MEMBERS } from "@/lib/constants";
import { getFlatSlot } from "@/lib/choreoUtils";
import { useChoreo } from "@/context/ChoreoContext";

interface MemberPanelProps {
  open: boolean;
  onClose: () => void;
}

export function MemberPanel({ open, onClose }: MemberPanelProps) {
  const {
    state,
    setMemberCount,
    renameMember,
    toggleMemberVisibility,
    isMemberVisibleOnCurrent,
  } = useChoreo();

  const [countInp, setCountInp] = useState(String(state.members.length));
  const currentFlat = getFlatSlot(state.sections, state.currentCount);

  useEffect(() => {
    if (open) setCountInp(String(state.members.length));
  }, [open, state.members.length]);

  if (!open) return null;

  const applyCount = () => {
    const n = parseInt(countInp, 10);
    if (!Number.isFinite(n) || n < 1) {
      setCountInp(String(state.members.length));
      return;
    }
    setMemberCount(n);
  };

  return (
    <>
      <div className="popup-overlay" onClick={onClose} />
      <div className="popup member-popup" role="dialog" aria-label="メンバー編集">
        <div className="popup-title">
          <span>👥 メンバー編集</span>
          <button type="button" className="popup-x" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="hint-text">
          表示/非表示は現在のカウント（
          {currentFlat?.label ?? state.currentCount}
          {currentFlat?.sectionName ? ` · ${currentFlat.sectionName}` : ""}
          ）に適用されます
        </p>

        <div className="member-count-row">
          <span className="member-count-lbl">人数</span>
          <input
            className="member-count-inp"
            type="number"
            min={1}
            max={MAX_MEMBERS}
            value={countInp}
            onChange={(e) => setCountInp(e.target.value)}
            onBlur={applyCount}
            onKeyDown={(e) => e.key === "Enter" && applyCount()}
          />
          <div className="count-presets">
            {[3, 5, 7, 10, 15].map((n) => (
              <button
                key={n}
                type="button"
                className={
                  "preset-btn" + (state.members.length === n ? " on" : "")
                }
                onClick={() => {
                  setCountInp(String(n));
                  setMemberCount(n);
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="p-div" />

        <div className="m-cards">
          {state.members.map((m) => {
            const visible = isMemberVisibleOnCurrent(m.id);
            return (
              <div
                key={m.id}
                className={"m-card" + (visible ? "" : " hidden-member")}
              >
                <div className="m-cdot" style={{ background: m.color }} />
                <input
                  className="m-cname"
                  value={m.name}
                  onChange={(e) => renameMember(m.id, e.target.value)}
                  aria-label={`${m.name}の名前`}
                />
                <button
                  type="button"
                  className={"vis-btn" + (visible ? " on" : "")}
                  onClick={() => toggleMemberVisibility(m.id)}
                  title={
                    visible
                      ? "このカウントで非表示にする"
                      : "このカウントで表示する"
                  }
                >
                  {visible ? "表示" : "非表示"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-div" />

        <div className="swatches">
          {COLORS.slice(0, 10).map((c) => (
            <span
              key={c}
              className="sw"
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
      </div>
    </>
  );
}
