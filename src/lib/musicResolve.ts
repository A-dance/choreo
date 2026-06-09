import type { MusicSource } from "@/lib/types";
import {
  coerceMusicLink,
  normalizeMusicLinkInput,
  parseMusicLink,
  type ParsedMusicLink,
} from "./musicLinkUtils";

export interface ResolvedMusicLink {
  source: Exclude<MusicSource, "file">;
  externalUrl: string;
  name: string;
  thumbnailUrl?: string;
}

export async function fetchMusicMetadataClient(
  externalUrl: string,
): Promise<ResolvedMusicLink | null> {
  try {
    const res = await fetch(
      `/api/music-metadata?url=${encodeURIComponent(externalUrl)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      title?: string;
      thumbnailUrl?: string | null;
      source: Exclude<MusicSource, "file">;
      externalUrl: string;
    };
    const title = data.title?.trim();
    if (!title) return null;
    return {
      source: data.source,
      externalUrl: data.externalUrl,
      name: title,
      thumbnailUrl: data.thumbnailUrl ?? undefined,
    };
  } catch {
    return null;
  }
}

export async function resolveMusicLink(
  input: string,
  html?: string,
  parsedOverride?: ParsedMusicLink | null,
): Promise<ResolvedMusicLink | null> {
  const parsed =
    parsedOverride ??
    coerceMusicLink(input, html) ??
    parseMusicLink(normalizeMusicLinkInput(input, html));
  if (!parsed) return null;

  const fromApi = await fetchMusicMetadataClient(parsed.externalUrl);
  if (fromApi) return fromApi;

  return {
    source: parsed.source,
    externalUrl: parsed.externalUrl,
    name: parsed.name,
  };
}
