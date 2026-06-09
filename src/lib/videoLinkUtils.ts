import type { ReferenceVideoSource } from "./types";

export interface ParsedVideoLink {
  source: Exclude<ReferenceVideoSource, "file">;
  externalUrl: string;
  embedUrl: string;
  name: string;
}

function youtubeIdFromUrl(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id || null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    if (url.pathname.startsWith("/watch")) {
      return url.searchParams.get("v");
    }
    const parts = url.pathname.split("/").filter(Boolean);
    const head = parts[0];
    if (head === "embed" || head === "shorts" || head === "live") {
      return parts[1] ?? null;
    }
  }
  return null;
}

function vimeoIdFromUrl(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? id : null;
  }
  if (host === "player.vimeo.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "video" && parts[1] && /^\d+$/.test(parts[1])) return parts[1];
  }
  return null;
}

export function parseVideoLink(input: string): ParsedVideoLink | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(url.protocol)) return null;

  const youtubeId = youtubeIdFromUrl(url);
  if (youtubeId) {
    const watchUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
    return {
      source: "youtube",
      externalUrl: watchUrl,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
      name: `YouTube (${youtubeId})`,
    };
  }

  const vimeoId = vimeoIdFromUrl(url);
  if (vimeoId) {
    return {
      source: "vimeo",
      externalUrl: `https://vimeo.com/${vimeoId}`,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      name: `Vimeo (${vimeoId})`,
    };
  }

  return null;
}

export function getReferenceVideoEmbedUrl(video: {
  source?: ReferenceVideoSource;
  externalUrl?: string;
}): string | null {
  if (!video.source || video.source === "file" || !video.externalUrl) return null;
  const parsed = parseVideoLink(video.externalUrl);
  return parsed?.embedUrl ?? null;
}

export function formatMediaDate(
  timestamp: number,
  language: "ja" | "en",
): string {
  return new Intl.DateTimeFormat(language === "ja" ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}
