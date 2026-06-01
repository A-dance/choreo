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
  onCommit: (memberId: number, name: string) => void;
}

function MemberNameInput({ memberId, name, onCommit }: MemberNameInputProps) {
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
      aria-label={`${name}の名前`}
    />
  );
}

export function MemberPanel({ open, onClose }: MemberPanelProps) {
  const {
    state,
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
        aria-label="メンバー編集"
      >
        <div className="popup-title">
          <span>👥 メンバー編集</span>
          <button type="button" className="popup-x" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="member-hint">
          <p className="member-hint-position">
            <span className="member-hint-label">編集中の位置</span>
            <span className="member-hint-value">
              {currentFlat?.sectionName ?? "—"} ·{" "}
              {currentFlat?.label ?? state.currentCount}
            </span>
          </p>
        </div>

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
        </div>

        <div className="p-div" />

        <div className="m-cards">
          {state.members.length === 0 && (
            <p className="member-empty-hint">表示中のメンバーがいません</p>
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
                    title="このカウントで非表示にする"
                  >
                    非表示
                  </button>
                  <button
                    type="button"
                    className={
                      "vis-btn show-btn" + (visible ? " inactive" : " on")
                    }
                    onClick={() => !visible && toggleMemberVisibility(m.id)}
                    disabled={visible}
                    title="このカウントで表示する"
                  >
                    表示
                  </button>
                  <button
                    type="button"
                    className="del-member-btn"
                    onClick={() => deleteMember(m.id)}
                    title="リストから削除"
                  >
                    削除
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {state.removedMembers.length > 0 && (
          <>
            <div className="p-div" />
            <p className="member-removed-title">削除済み</p>
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
                    title="リストに戻す"
                  >
                    表示
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
