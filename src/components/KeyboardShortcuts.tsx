"use client";

import { useEffect } from "react";
import { useChoreo } from "@/context/ChoreoContext";

export function KeyboardShortcuts() {
  const {
    state,
    selectedMemberId,
    hideMemberFromCurrentCount,
    selectMember,
    removeCurrentCount,
    prevCount,
    nextCount,
    togglePlayback,
    stopPlayback,
    undo,
    canUndo,
    copyFormation,
    pasteFormation,
    hasClipboard,
  } = useChoreo();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
        return;
      }
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "ArrowRight" || e.key === "]") nextCount();
      if (e.key === "ArrowLeft" || e.key === "[") prevCount();
      if (e.key === " ") {
        e.preventDefault();
        togglePlayback();
      }
      if (e.key === "Escape") {
        if (selectedMemberId !== null) {
          selectMember(null);
          return;
        }
        if (state.isPlaying) stopPlayback();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedMemberId !== null) {
          e.preventDefault();
          hideMemberFromCurrentCount(selectedMemberId);
          return;
        }
        e.preventDefault();
        removeCurrentCount();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        e.preventDefault();
        copyFormation();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "v" && hasClipboard) {
        e.preventDefault();
        pasteFormation();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [
    state.isPlaying,
    selectedMemberId,
    hideMemberFromCurrentCount,
    selectMember,
    removeCurrentCount,
    nextCount,
    prevCount,
    togglePlayback,
    stopPlayback,
    undo,
    canUndo,
    copyFormation,
    pasteFormation,
    hasClipboard,
  ]);

  return null;
}
