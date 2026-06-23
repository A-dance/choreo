import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse } from "@/lib/apiErrors";
import { fetchMusicMetadata } from "@/lib/musicMetadata";
import { cleanMusicTitle } from "@/lib/openGraphMetadata";
import { parseMusicLink, normalizeMusicLinkInput } from "@/lib/musicLinkUtils";
import type { MusicSource } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url")?.trim();
  if (!url) {
    return apiErrorResponse(ApiError.MISSING_URL, 400);
  }

  const raw = url;
  const normalized = normalizeMusicLinkInput(raw);
  const parsed = parseMusicLink(normalized);
  if (!parsed) {
    return apiErrorResponse(ApiError.INVALID_URL, 400);
  }

  const meta = await fetchMusicMetadata(
    parsed.externalUrl,
    parsed.source as Exclude<MusicSource, "file">,
  );

  return NextResponse.json({
    title: cleanMusicTitle(meta.title) ?? meta.title ?? parsed.name,
    thumbnailUrl: meta.thumbnailUrl,
    source: parsed.source,
    externalUrl: parsed.externalUrl,
  });
}
