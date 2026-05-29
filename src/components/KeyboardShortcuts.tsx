"use client";

import { useEffect } from "react";
import { useChoreo } from "@/context/ChoreoContext";

export function KeyboardShortcuts() {
  const {
    state,
    prevCount,
    nextCount,
    togglePlayback,
    stopPlayback,
    copyFormation,
    pasteFormation,
    hasClipboard,
  } = useChoreo();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
      if (e.key === "Escape" && state.isPlaying) stopPlayback();
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
    nextCount,
    prevCount,
    togglePlayback,
    stopPlayback,
    copyFormation,
    pasteFormation,
    hasClipboard,
  ]);

  return null;
}
