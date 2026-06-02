"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MAX_MEMBERS } from "@/lib/constants";
import { getFlatSlot } from "@/lib/choreoUtils";
import { useChoreo } from "@/context/ChoreoContext";

interface MemberPanelProps {
  open: boolean;
  onClose: () => void;
}

interface MemberNameInputProps {
  memberId: number;
  name: string;
  nameAria: (name: string) => string;
  onCommit: (memberId: number, name: string) => void;
}

function MemberNameInput({ memberId, name, nameAria, onCommit }: MemberNameInputProps) {
  const [draft, setDraft] = useState(name);

  useEffect(() => {
    setDraft(name);
  }, [memberId, name]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) {
      onCommit(memberId, trimmed);
      setDraft(trimmed);
    } else {
      setDraft(name);
    }
  };

  return (
    <input
      className="m-cname"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      aria-label={nameAria(name)}
    />
  );
}

export function MemberPanel({ open, onClose }: MemberPanelProps) {
  const {
    state,
    strings: UI,
    setMemberCount,
    renameMember,
    deleteMember,
    restoreMember,
    toggleMemberVisibility,
    isMemberVisibleOnCurrent,
  } = useChoreo();

  const [countInp, setCountInp] = useState(String(state.members.length));
  const [mounted, setMounted] = useState(false);
  const currentFlat = getFlatSlot(state.sections, state.currentCount);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) setCountInp(String(state.members.length));
  }, [open, state.members.length]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const applyCount = () => {
    const n = parseInt(countInp, 10);
    if (!Number.isFinite(n) || n < 1) {
      setCountInp(String(state.members.length));
      return;
    }
    setMemberCount(n);
  };

  return createPortal(
    <>
      <div className="popup-overlay" onClick={onClose} />
      <div
        className="popup member-popup"
        role="dialog"
        aria-label={UI.editMembers}
      >
        <div className="popup-title">
          <span>👥 {UI.editMembers}</span>
          <button type="button" className="popup-x" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="member-hint">
          <p className="member-hint-position">
            <span className="member-hint-label">{UI.editingPosition}</span>
            <span className="member-hint-value">
              {currentFlat?.sectionName ?? "—"} ·{" "}
              {currentFlat?.label ?? state.currentCount}
            </span>
          </p>
        </div>

        <div className="member-count-row">
          <span className="member-count-lbl">{UI.memberCount}</span>
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
        </div>

        <div className="p-div" />

        <div className="m-cards">
          {state.members.length === 0 && (
            <p className="member-empty-hint">{UI.noVisibleMembers}</p>
          )}
          {state.members.map((m) => {
            const visible = isMemberVisibleOnCurrent(m.id);
            return (
              <div
                key={m.id}
                className={"m-card" + (visible ? "" : " hidden-member")}
              >
                <div className="m-cdot" style={{ background: m.color }} />
                <MemberNameInput
                  memberId={m.id}
                  name={m.name}
                  nameAria={UI.memberNameAria}
                  onCommit={renameMember}
                />
                <div className="m-card-actions">
                  <button
                    type="button"
                    className={
                      "vis-btn hide-btn" + (visible ? "" : " inactive")
                    }
                    onClick={() => visible && toggleMemberVisibility(m.id)}
                    disabled={!visible}
                    title={UI.hideOnCount}
                  >
                    {UI.hide}
                  </button>
                  <button
                    type="button"
                    className={
                      "vis-btn show-btn" + (visible ? " inactive" : " on")
                    }
                    onClick={() => !visible && toggleMemberVisibility(m.id)}
                    disabled={visible}
                    title={UI.showOnCount}
                  >
                    {UI.show}
                  </button>
                  <button
                    type="button"
                    className="del-member-btn"
                    onClick={() => deleteMember(m.id)}
                    title={UI.removeFromList}
                  >
                    {UI.delete}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {state.removedMembers.length > 0 && (
          <>
            <div className="p-div" />
            <p className="member-removed-title">{UI.removed}</p>
            <div className="m-cards removed-cards">
              {state.removedMembers.map((m) => (
                <div key={m.id} className="m-card removed-member">
                  <div
                    className="m-cdot"
                    style={{ background: m.color, opacity: 0.5 }}
                  />
                  <span className="m-removed-name">{m.name}</span>
                  <button
                    type="button"
                    className="vis-btn on restore-btn"
                    onClick={() => restoreMember(m.id)}
                    title={UI.restoreToList}
                  >
                    {UI.show}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>,
    document.body,
  );
}
