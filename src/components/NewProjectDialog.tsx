"use client";

import { useState } from "react";
import {
  DEFAULT_BPM,
  COUNTS_PER_SECTION,
  DEFAULT_MEMBER_COUNT,
  MIN_COUNTS_PER_SECTION,
  MAX_COUNTS_PER_SECTION,
  MIN_MEMBERS,
  MAX_MEMBERS,
} from "@/lib/constants";
import { useChoreo } from "@/context/ChoreoContext";

interface NewProjectDialogProps {
  onClose: () => void;
}

export function NewProjectDialog({ onClose }: NewProjectDialogProps) {
  const { createProject, strings: UI } = useChoreo();
  const [songTitle, setSongTitle] = useState("");
  const [bpm, setBpm] = useState(String(DEFAULT_BPM));
  const [counts, setCounts] = useState(String(COUNTS_PER_SECTION));
  const [memberCount, setMemberCount] = useState(String(DEFAULT_MEMBER_COUNT));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bpmNum = parseInt(bpm, 10);
    const countsNum = parseInt(counts, 10);
    const membersNum = parseInt(memberCount, 10);
    if (
      !Number.isFinite(bpmNum) ||
      !Number.isFinite(countsNum) ||
      !Number.isFinite(membersNum)
    ) {
      return;
    }
    createProject({
      songTitle: songTitle.trim() || UI.defaultSongTitle,
      bpm: bpmNum,
      countsPerSection: countsNum,
      memberCount: membersNum,
    });
    onClose();
  };

  return (
    <div
      className="dialog-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="dialog-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
      >
        <h2 id="new-project-title" className="dialog-title">
          {UI.newProjectTitle}
        </h2>
        <p className="dialog-desc">{UI.newProjectDesc}</p>

        <form className="dialog-form" onSubmit={handleSubmit}>
          <label className="dialog-field">
            <span className="dialog-label">{UI.songTitleLabel}</span>
            <input
              type="text"
              className="dialog-input"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder={UI.defaultSongTitle}
              autoFocus
            />
          </label>

          <label className="dialog-field">
            <span className="dialog-label">BPM</span>
            <input
              type="number"
              className="dialog-input"
              value={bpm}
              min={40}
              max={240}
              onChange={(e) => setBpm(e.target.value)}
            />
          </label>

          <label className="dialog-field">
            <span className="dialog-label">{UI.memberCount}</span>
            <input
              type="number"
              className="dialog-input"
              value={memberCount}
              min={MIN_MEMBERS}
              max={MAX_MEMBERS}
              onChange={(e) => setMemberCount(e.target.value)}
            />
          </label>

          <label className="dialog-field">
            <span className="dialog-label">{UI.countsPerSection}</span>
            <input
              type="number"
              className="dialog-input"
              value={counts}
              min={MIN_COUNTS_PER_SECTION}
              max={MAX_COUNTS_PER_SECTION}
              onChange={(e) => setCounts(e.target.value)}
            />
          </label>

          <div className="dialog-actions">
            <button type="button" className="dialog-btn secondary" onClick={onClose}>
              {UI.cancel}
            </button>
            <button type="submit" className="dialog-btn primary">
              {UI.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
