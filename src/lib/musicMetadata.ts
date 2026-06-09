import { cleanMusicTitle, fetchOpenGraphMetadata } from "./openGraphMetadata";
import type { MusicSource } from "./types";

export interface MusicMetadata {
  title: string | null;
  thumbnailUrl: string | null;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchMusicMetadata(
  externalUrl: string,
  source: Exclude<MusicSource, "file">,
): Promise<MusicMetadata> {
  if (source === "smart_link" || source === "apple_music") {
    const og = await fetchOpenGraphMetadata(externalUrl);
    return {
      title: cleanMusicTitle(og.title),
      thumbnailUrl: og.thumbnailUrl,
    };
  }

  if (source === "spotify") {
    const data = await fetchJson<{ title?: string; thumbnail_url?: string }>(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(externalUrl)}`,
    );
    return {
      title: cleanMusicTitle(data?.title ?? null),
      thumbnailUrl: data?.thumbnail_url ?? null,
    };
  }

  if (source === "youtube_music") {
    const videoId = new URL(externalUrl).searchParams.get("v");
    const watchUrl = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : externalUrl;
    const data = await fetchJson<{ title?: string; thumbnail_url?: string }>(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
    );
    return {
      title: cleanMusicTitle(data?.title ?? null),
      thumbnailUrl: data?.thumbnail_url ?? null,
    };
  }

  return { title: null, thumbnailUrl: null };
}
