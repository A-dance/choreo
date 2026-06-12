"use client";

import { useEffect, useRef, useState } from "react";
import {
  coerceMusicLink,
  getMusicEmbedUrl,
  getSmartLinkProvider,
  normalizeMusicLinkPaste,
  type MusicLinkPastePayload,
} from "@/lib/musicLinkUtils";
import { fetchMusicMetadataClient } from "@/lib/musicResolve";
import { displayMusicTitle } from "@/lib/openGraphMetadata";
import { ExternalLinkIcon, TrashIcon } from "@/components/mediaIcons";
import type { AudioTrackMeta } from "@/lib/types";
import type { UiStrings } from "@/lib/uiStrings";

interface MusicSectionProps {
  UI: UiStrings;
  tracks: AudioTrackMeta[];
  viewOnly: boolean;
  onAddLink: (input: string, html?: string) => Promise<boolean>;
  onRename: (trackId: string, name: string) => void;
  onRemove: (trackId: string) => void;
  getFileUrl: (trackId: string) => Promise<string | null>;
}

export function MusicSection({
  UI,
  tracks,
  viewOnly,
  onAddLink,
  onRename,
  onRemove,
  getFileUrl,
}: MusicSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState("");
  const [pasteHtml, setPasteHtml] = useState<string | undefined>();
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const [previewThumb, setPreviewThumb] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(false);
  const prevCountRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = tracks.find((t) => t.id === selectedId) ?? null;

  useEffect(() => {
    const count = tracks.length;
    if (count > prevCountRef.current && count > 0) {
      setSelectedId(tracks[count - 1].id);
    } else if (selectedId && !tracks.some((t) => t.id === selectedId)) {
      setSelectedId(tracks[0]?.id ?? null);
    } else if (!selectedId && count > 0) {
      setSelectedId(tracks[0].id);
    }
    prevCountRef.current = count;
  }, [tracks, selectedId]);

  useEffect(() => {
    if (!selected || selected.source !== "file") {
      setFilePreviewUrl(null);
      return;
    }
    let cancelled = false;
    void getFileUrl(selected.id).then((url) => {
      if (!cancelled) setFilePreviewUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [selected, getFileUrl]);

  const linkCandidate = linkInput.trim();
  const parsedLink = linkCandidate
    ? coerceMusicLink(linkCandidate, pasteHtml)
    : null;

  useEffect(() => {
    if (!linkCandidate || !parsedLink) {
      setPreviewTitle(null);
      setPreviewThumb(null);
      setPreviewLoading(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setPreviewLoading(true);
    debounceRef.current = setTimeout(() => {
      void fetchMusicMetadataClient(parsedLink.externalUrl)
        .then((data) => {
          setPreviewTitle(
            data?.name ? displayMusicTitle(data.name) : parsedLink.name,
          );
          setPreviewThumb(data?.thumbnailUrl ?? null);
        })
        .catch(() => {
          setPreviewTitle(parsedLink.name);
          setPreviewThumb(null);
        })
        .finally(() => setPreviewLoading(false));
    }, 450);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [linkCandidate, parsedLink?.externalUrl, pasteHtml]);

  useEffect(() => {
    if (!selected) return;
    const cleaned = displayMusicTitle(selected.name);
    if (cleaned !== selected.name) {
      onRename(selected.id, cleaned);
    }
  }, [selected?.id, onRename]);

  const badgeKey = (track: AudioTrackMeta) => {
    if (track.source === "spotify") return "spotify";
    if (track.source === "apple_music") return "apple";
    if (track.source === "youtube_music") return "youtube";
    if (track.source === "file") return "file";
    return "link";
  };

  const sourceLabel = (track: AudioTrackMeta) => {
    if (track.source === "file") return UI.musicSourceFile;
    if (track.source === "spotify") return UI.musicSourceSpotify;
    if (track.source === "apple_music") return UI.musicSourceApple;
    if (track.source === "youtube_music") return UI.musicSourceYoutubeMusic;
    if (track.source === "smart_link" && track.externalUrl) {
      const provider = getSmartLinkProvider(track.externalUrl);
      if (provider === "linkfire") return UI.musicSourceLinkfire;
      if (provider === "tunecore") return UI.musicSourceTunecore;
    }
    return UI.musicSourceSmartLink;
  };

  const submitLink = async (input: string, html?: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setAdding(true);
    setAddError(false);
    try {
      const ok = await onAddLink(trimmed, html);
      if (ok) {
        setLinkInput("");
        setPasteHtml(undefined);
        setPreviewTitle(null);
        setPreviewThumb(null);
      } else {
        setAddError(true);
      }
    } finally {
      setAdding(false);
    }
  };

  const applyPastePayload = (payload: MusicLinkPastePayload) => {
    const next = normalizeMusicLinkPaste(payload);
    setPasteHtml(payload.html);
    setLinkInput(next || payload.plain?.trim() || "");
    setAddError(false);
  };

  const addFromInput = async () => {
    if (!linkInput.trim()) return;
    if (!coerceMusicLink(linkInput, pasteHtml)) {
      setAddError(true);
      return;
    }
    await submitLink(linkInput, pasteHtml);
  };

  const embed = selected ? getMusicEmbedUrl(selected) : null;

  return (
    <section className="music-panel share-media-section">
      {tracks.length === 0 ? (
        <p className="media-empty">{UI.musicEmptyHint}</p>
      ) : (
        <>
          <ul className="music-track-list" role="listbox" aria-label={UI.audioSection}>
            {tracks.map((t) => {
              const isSelected = t.id === selectedId;
              return (
                <li key={t.id} className="music-track-list-item">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={"music-track-row" + (isSelected ? " selected" : "")}
                    onClick={() => setSelectedId(t.id)}
                  >
                    {t.thumbnailUrl ? (
                      <img className="music-track-thumb" src={t.thumbnailUrl} alt="" />
                    ) : (
                      <span className="music-track-thumb music-track-thumb-fallback" aria-hidden>
                        ♪
                      </span>
                    )}
                    <span className="music-track-row-text">
                      <span className={"media-badge mb-" + badgeKey(t)}>
                        {sourceLabel(t)}
                      </span>
                      <span className="music-track-row-name">{displayMusicTitle(t.name)}</span>
                    </span>
                  </button>
                  <span className="media-card-actions">
                    {t.externalUrl && (
                      <a
                        className="media-action-btn"
                        href={t.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={UI.openMusicLink}
                      >
                        <ExternalLinkIcon />
                      </a>
                    )}
                    {!viewOnly && (
                      <button
                        type="button"
                        className="media-action-btn danger"
                        onClick={() => void onRemove(t.id)}
                        aria-label={UI.removeMedia}
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>

          {selected && embed ? (
            <iframe
              className="music-embed"
              src={embed}
              title={selected.name}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          ) : selected?.source === "file" && filePreviewUrl ? (
            <audio className="media-audio-preview" src={filePreviewUrl} controls />
          ) : null}
        </>
      )}

      {addError && (
        <p className="music-link-error" role="alert">
          {UI.musicLinkInvalid}
        </p>
      )}

      {!viewOnly && (
        <>
          {(previewLoading || previewTitle) && parsedLink && (
            <div className="music-link-preview">
              {previewThumb && (
                <img className="music-link-preview-art" src={previewThumb} alt="" />
              )}
              <span className="music-link-preview-title">
                {previewLoading ? UI.musicFetching : previewTitle}
              </span>
            </div>
          )}
          <div className="ref-video-link-form">
            <input
              type="url"
              className="dialog-input"
              value={linkInput}
              placeholder={UI.musicLinkPlaceholder}
              aria-label={UI.musicLinkLabel}
              disabled={adding}
              onChange={(e) => {
                setLinkInput(e.target.value);
                setPasteHtml(undefined);
                setAddError(false);
              }}
              onPaste={(e) => {
                e.preventDefault();
                applyPastePayload({
                  plain: e.clipboardData.getData("text/plain"),
                  html: e.clipboardData.getData("text/html"),
                  uriList: e.clipboardData.getData("text/uri-list"),
                });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addFromInput();
                }
              }}
            />
            <button
              type="button"
              className="dialog-btn secondary"
              disabled={adding}
              onClick={() => void addFromInput()}
            >
              {adding ? UI.musicFetching : UI.musicLinkAddButton}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
