"use client";

import { useEffect, useRef, useState } from "react";
import { useChoreo } from "@/context/ChoreoContext";
import { formatMediaDate } from "@/lib/musicLinkUtils";
import { getReferenceVideoEmbedUrl } from "@/lib/videoLinkUtils";
import { MusicSection } from "@/components/MusicSection";
import type { ReferenceVideoMeta } from "@/lib/types";

export type MediaPanelSection = "audio" | "video";

interface MediaPanelProps {
  open: boolean;
  onClose: () => void;
  initialSection?: MediaPanelSection;
}

export function MediaPanel({
  open,
  onClose,
  initialSection = "audio",
}: MediaPanelProps) {
  const {
    state,
    strings: UI,
    appMode,
    media,
    addMusicLink,
    setMusicTrackName,
    removeMusicTrack,
    getMusicFileUrl,
    addReferenceVideoLink,
    setReferenceVideoName,
    setReferenceVideoMessage,
    removeReferenceVideo,
    getVideoUrl,
  } = useChoreo();

  const [videoLinkInput, setVideoLinkInput] = useState("");
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoSectionRef = useRef<HTMLElement>(null);

  const viewOnly = appMode === "view";
  const audioOnly = initialSection === "audio";
  const videoOnly = initialSection === "video";
  const panelTitle = audioOnly
    ? UI.audioSection
    : videoOnly
      ? UI.referenceVideosSection
      : UI.mediaPanelTitle;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !videoOnly) return;
    requestAnimationFrame(() =>
      videoSectionRef.current?.scrollIntoView({ block: "start" }),
    );
  }, [open, videoOnly]);

  useEffect(() => {
    if (!activeVideoId) {
      setVideoUrl(null);
      return;
    }
    let cancelled = false;
    getVideoUrl(activeVideoId).then((url) => {
      if (!cancelled) setVideoUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [activeVideoId, getVideoUrl]);

  useEffect(() => {
    if (media.referenceVideos.length && !activeVideoId) {
      setActiveVideoId(media.referenceVideos[0].id);
    }
    if (
      activeVideoId &&
      !media.referenceVideos.some((v) => v.id === activeVideoId)
    ) {
      setActiveVideoId(media.referenceVideos[0]?.id ?? null);
    }
  }, [media.referenceVideos, activeVideoId]);

  if (!open) return null;

  const activeVideo = media.referenceVideos.find((v) => v.id === activeVideoId);
  const activeEmbedUrl = activeVideo ? getReferenceVideoEmbedUrl(activeVideo) : null;

  const sourceLabel = (video: ReferenceVideoMeta) => {
    if (video.source === "youtube") return UI.referenceVideoSourceYoutube;
    if (video.source === "vimeo") return UI.referenceVideoSourceVimeo;
    return UI.referenceVideoSourceFile;
  };

  const submitVideoLink = () => {
    const trimmed = videoLinkInput.trim();
    if (!trimmed) return;
    addReferenceVideoLink(trimmed);
    setVideoLinkInput("");
  };

  return (
    <div className="dialog-overlay" onClick={onClose} role="presentation">
      <div
        className={
          "dialog-panel share-media-panel" +
          (audioOnly || videoOnly ? " share-media-panel-focused" : "")
        }
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-panel-title"
      >
        <h2 id="media-panel-title" className="dialog-title">
          {panelTitle}
        </h2>

        {!videoOnly && (
          <MusicSection
            UI={UI}
            language={state.language}
            tracks={media.audioTracks}
            viewOnly={viewOnly}
            onAddLink={addMusicLink}
            onRename={setMusicTrackName}
            onRemove={removeMusicTrack}
            getFileUrl={getMusicFileUrl}
          />
        )}

        {!audioOnly && (
          <section ref={videoSectionRef} className="share-media-section">
            {!videoOnly && (
              <h3 className="share-media-heading">{UI.referenceVideosSection}</h3>
            )}
            {!viewOnly && (
              <p className="dialog-desc">{UI.referenceVideosDesc}</p>
            )}
            {media.referenceVideos.length === 0 ? (
              <p className="media-empty">{UI.noReferenceVideos}</p>
            ) : (
              <ul className="ref-video-list">
                {media.referenceVideos.map((v) => (
                  <li key={v.id} className="ref-video-item">
                    <button
                      type="button"
                      className={
                        "ref-video-tab" + (activeVideoId === v.id ? " active" : "")
                      }
                      onClick={() => setActiveVideoId(v.id)}
                    >
                      <span className="ref-video-tab-main">
                        <span className="ref-video-tab-name">{v.name}</span>
                        <span className="ref-video-tab-meta">
                          {formatMediaDate(v.createdAt, state.language)} ·{" "}
                          {sourceLabel(v)}
                        </span>
                      </span>
                    </button>
                    {!viewOnly && (
                      <button
                        type="button"
                        className="ref-video-del"
                        onClick={() => void removeReferenceVideo(v.id)}
                        aria-label={UI.removeMedia}
                      >
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {activeVideo && (
              <div className="ref-video-detail">
                <label className="dialog-field ref-video-title-field">
                  <span className="dialog-label">{UI.referenceVideoTitle}</span>
                  <input
                    type="text"
                    className="dialog-input"
                    value={activeVideo.name}
                    readOnly={viewOnly}
                    placeholder={UI.referenceVideoTitlePlaceholder}
                    onChange={(e) =>
                      setReferenceVideoName(activeVideo.id, e.target.value)
                    }
                    onBlur={() => {
                      if (!activeVideo.name.trim()) {
                        setReferenceVideoName(
                          activeVideo.id,
                          UI.referenceVideoUntitled,
                        );
                      }
                    }}
                  />
                </label>
                <p className="ref-video-detail-meta">
                  <span>{UI.referenceVideoAddedAt}: </span>
                  <time dateTime={new Date(activeVideo.createdAt).toISOString()}>
                    {formatMediaDate(activeVideo.createdAt, state.language)}
                  </time>
                  <span className="ref-video-source-badge">
                    {sourceLabel(activeVideo)}
                  </span>
                </p>
                {activeEmbedUrl ? (
                  <iframe
                    className="ref-video-embed"
                    src={activeEmbedUrl}
                    title={activeVideo.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  videoUrl && (
                    <video
                      className="ref-video-player"
                      src={videoUrl}
                      controls
                      playsInline
                    />
                  )
                )}
                <label className="dialog-field ref-video-message-field">
                  <span className="dialog-label">{UI.referenceVideoMessage}</span>
                  <textarea
                    className="dialog-textarea ref-video-message"
                    rows={3}
                    value={activeVideo.message}
                    readOnly={viewOnly}
                    placeholder={UI.referenceVideoMessagePlaceholder}
                    onChange={(e) =>
                      setReferenceVideoMessage(activeVideo.id, e.target.value)
                    }
                  />
                </label>
              </div>
            )}
            {!viewOnly && (
              <>
                <div className="ref-video-link-form">
                  <input
                    type="url"
                    className="dialog-input"
                    value={videoLinkInput}
                    placeholder={UI.referenceVideoLinkPlaceholder}
                    onChange={(e) => setVideoLinkInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submitVideoLink();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="dialog-btn secondary"
                    onClick={submitVideoLink}
                  >
                    {UI.addReferenceVideoLink}
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        <div className="dialog-actions">
          <button type="button" className="dialog-btn primary" onClick={onClose}>
            {UI.close}
          </button>
        </div>
      </div>
    </div>
  );
}
