import type { MusicSource } from "./types";

export type StreamingMusicSource = Exclude<MusicSource, "file" | "smart_link">;

export interface ParsedMusicLink {
  source: Exclude<MusicSource, "file">;
  externalUrl: string;
  embedUrl: string | null;
  name: string;
}

export type SmartLinkProvider = "linkfire" | "tunecore" | "other";

const MUSIC_LINK_BLOCKLIST = new Set([
  "vimeo.com",
  "player.vimeo.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "facebook.com",
  "line.me",
]);

function trimTrailingPunctuation(value: string): string {
  return value.replace(/[.,;:!?)}\]」』、。]+$/u, "");
}

/** クリップボード由来の全角・不可視文字・改行を除去 */
export function sanitizeMusicLinkRaw(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF\u00AD\u2060\u3000]/g, " ")
    .replace(/\r\n?/g, "\n")
    .trim();
}

function collapseUrlWhitespace(value: string): string {
  return value.replace(/\s+/g, "");
}

function tryParseHttpUrl(candidate: string): URL | null {
  const collapsed = collapseUrlWhitespace(trimTrailingPunctuation(candidate.trim()));
  if (!collapsed) return null;

  const attempts = collapsed.includes("://")
    ? [collapsed]
    : [collapsed, `https://${collapsed}`];

  for (const attempt of attempts) {
    try {
      const url = new URL(attempt);
      if (!["http:", "https:"].includes(url.protocol)) continue;
      if (!url.hostname.includes(".")) continue;
      return url;
    } catch {
      /* try next */
    }
  }
  return null;
}

/** LINE 等から貼った「メッセージ + URL」から URL だけ取り出す */
export function extractUrlFromText(input: string): string | null {
  const trimmed = sanitizeMusicLinkRaw(input);
  if (!trimmed) return null;

  const tryCandidate = (raw: string): string | null => {
    const cleaned = collapseUrlWhitespace(trimTrailingPunctuation(raw.trim()));
    return tryParseHttpUrl(cleaned) ? cleaned : null;
  };

  const markdown = trimmed.match(/\((https?:\/\/[^)\s]+)\)/i);
  if (markdown?.[1]) {
    const hit = tryCandidate(markdown[1]);
    if (hit) return hit;
  }

  const withProtocol = trimmed.match(/https?:\/\/[^\s<>"{}|\\^`[\]」』]+/gi);
  if (withProtocol?.length) {
    for (const match of withProtocol) {
      const hit = tryCandidate(match);
      if (hit) return hit;
    }
  }

  for (const line of trimmed.split("\n")) {
    const lineTrimmed = line.trim();
    if (!lineTrimmed) continue;

    const lineProtocol = lineTrimmed.match(/https?:\/\/[^\s<>"{}|\\^`[\]」』]+/i);
    if (lineProtocol?.[0]) {
      const hit = tryCandidate(lineProtocol[0]);
      if (hit) return hit;
    }

    if (lineTrimmed.startsWith("(") && lineTrimmed.endsWith(")")) {
      const hit = tryCandidate(lineTrimmed.slice(1, -1));
      if (hit) return hit;
    }

    const bare = lineTrimmed.match(
      /^([\w.-]+(?:\.[\w.-]+)+(?:\/[^\s<>"{}|\\^`[\]」』、。]*)?)/i,
    );
    if (bare?.[1]) {
      const hit = tryCandidate(bare[1]);
      if (hit) return hit;
    }
  }

  const bare = trimmed.match(
    /(?:^|[\s(（「『])([\w.-]+(?:\.[\w.-]+)+(?:\/[^\s<>"{}|\\^`[\]」』、。]*)?)/i,
  );
  if (bare?.[1]) {
    const hit = tryCandidate(bare[1]);
    if (hit) return hit;
  }

  return tryCandidate(trimmed);
}

/** リッチテキスト（HTML）の href から URL を取り出す — LINE / メール等 */
export function extractUrlFromHtml(html: string): string | null {
  if (!html) return null;

  const hrefs: string[] = [];
  for (const match of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
    if (match[1]) hrefs.push(match[1]);
  }

  for (const raw of hrefs) {
    const decoded = raw
      .replace(/&amp;/g, "&")
      .replace(/&#x2F;/gi, "/")
      .replace(/&#47;/g, "/");
    if (decoded.startsWith("mailto:") || decoded.startsWith("javascript:")) {
      continue;
    }
    const hit = extractUrlFromText(decoded);
    if (hit) return hit;
  }

  return null;
}

export interface MusicLinkPastePayload {
  plain?: string;
  html?: string;
  uriList?: string;
}

/** クリップボード / 貼り付けイベントから最良の URL 文字列を得る */
export function normalizeMusicLinkPaste(payload: MusicLinkPastePayload): string {
  const uriLine = (payload.uriList ?? "")
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#"));
  if (uriLine) {
    const fromUri = extractUrlFromText(uriLine);
    if (fromUri) return fromUri;
  }

  const plain = sanitizeMusicLinkRaw(payload.plain ?? "");
  const fromPlain = extractUrlFromText(plain);
  if (fromPlain) return fromPlain;

  const fromHtml = extractUrlFromHtml(payload.html ?? "");
  if (fromHtml) return fromHtml;

  return plain;
}

export function normalizeMusicLinkInput(
  input: string,
  html?: string,
): string {
  return normalizeMusicLinkPaste({ plain: input, html });
}

/** 解析できなくても http(s) URL ならスマートリンクとして受け入れる */
export function coerceMusicLink(input: string, html?: string): ParsedMusicLink | null {
  const normalized = normalizeMusicLinkInput(input, html);
  if (!normalized) return null;

  const parsed = parseMusicLink(normalized);
  if (parsed) return parsed;

  const url = tryParseHttpUrl(normalized);
  if (url) return fallbackSmartLinkFromUrl(url);

  return null;
}

function parseUrl(input: string): URL | null {
  const normalized = normalizeMusicLinkInput(input);
  if (!normalized) return null;
  return tryParseHttpUrl(normalized);
}

function canonicalExternalUrl(url: URL): string {
  return url.origin + url.pathname.replace(/\/+$/, "") + url.search;
}

function youtubeVideoIdFromUrl(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id || null;
  }
  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com"
  ) {
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

function spotifyFromUrl(url: URL): ParsedMusicLink | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "open.spotify.com") return null;

  const parts = url.pathname.split("/").filter(Boolean);
  const typeIdx = parts.findIndex((p) =>
    ["track", "album", "playlist", "episode", "artist"].includes(p),
  );
  if (typeIdx === -1) return null;
  const type = parts[typeIdx];
  const id = parts[typeIdx + 1]?.split("?")[0];
  if (!id) return null;

  const externalUrl = `https://open.spotify.com/${type}/${id}`;
  return {
    source: "spotify",
    externalUrl,
    embedUrl: `https://open.spotify.com/embed/${type}/${id}`,
    name: `Spotify (${type})`,
  };
}

function spotifyFromUri(input: string): ParsedMusicLink | null {
  const match = sanitizeMusicLinkRaw(input).match(
    /^spotify:(track|album|playlist|episode|artist):([a-zA-Z0-9]+)$/,
  );
  if (!match) return null;
  const [, type, id] = match;
  const externalUrl = `https://open.spotify.com/${type}/${id}`;
  return {
    source: "spotify",
    externalUrl,
    embedUrl: `https://open.spotify.com/embed/${type}/${id}`,
    name: `Spotify (${type})`,
  };
}

function appleMusicFromUrl(url: URL): ParsedMusicLink | null {
  const host = url.hostname.replace(/^www\./, "");
  if (
    host !== "music.apple.com" &&
    host !== "itunes.apple.com" &&
    host !== "geo.music.apple.com"
  ) {
    return null;
  }
  const externalUrl = canonicalExternalUrl(url);
  return {
    source: "apple_music",
    externalUrl,
    embedUrl: null,
    name: "Apple Music",
  };
}

function youtubeMusicFromUrl(url: URL): ParsedMusicLink | null {
  const videoId = youtubeVideoIdFromUrl(url);
  if (!videoId) return null;
  const externalUrl = `https://music.youtube.com/watch?v=${videoId}`;
  return {
    source: "youtube_music",
    externalUrl,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    name: "YouTube Music",
  };
}

function smartLinkProviderFromHost(host: string, url?: URL): SmartLinkProvider | null {
  if (
    host === "lnk.to" ||
    host.endsWith(".lnk.to") ||
    host === "linkco.re" ||
    host.endsWith(".linkco.re") ||
    host === "linkfire.co" ||
    host.endsWith(".linkfire.co") ||
    host === "linkfire.com" ||
    host.endsWith(".linkfire.com") ||
    host.startsWith("lf.") ||
    host.includes("linkfire")
  ) {
    return "linkfire";
  }
  if (host.includes("tunecore")) return "tunecore";
  if (url && host === "distrokid.com" && url.pathname.toLowerCase().includes("/hyperfollow/")) {
    return "other";
  }
  if (
    host === "song.link" ||
    host === "album.link" ||
    host === "odesli.co" ||
    host === "hyperfollow.com" ||
    host === "ffm.to" ||
    host === "fanlink.to" ||
    host === "found.ee" ||
    host === "orcd.co" ||
    host === "push.fm" ||
    host === "smarturl.it" ||
    host === "spotify.link" ||
    host === "spoti.fi" ||
    host === "bit.ly" ||
    host === "bitly.com" ||
    host === "t.co"
  ) {
    return "other";
  }
  return null;
}

function smartLinkLabel(provider: SmartLinkProvider): string {
  if (provider === "linkfire") return "Linkfire";
  if (provider === "tunecore") return "TuneCore";
  return "Smart link";
}

function smartLinkFromUrl(url: URL): ParsedMusicLink | null {
  const host = url.hostname.replace(/^www\./, "");
  const provider = smartLinkProviderFromHost(host, url);
  if (!provider) return null;

  const externalUrl = canonicalExternalUrl(url);
  return {
    source: "smart_link",
    externalUrl,
    embedUrl: null,
    name: smartLinkLabel(provider),
  };
}

function fallbackSmartLinkFromUrl(url: URL): ParsedMusicLink | null {
  const host = url.hostname.replace(/^www\./, "");
  if (MUSIC_LINK_BLOCKLIST.has(host)) return null;
  if (!host.includes(".")) return null;

  const externalUrl = canonicalExternalUrl(url);
  const provider = smartLinkProviderFromHost(host, url);
  return {
    source: "smart_link",
    externalUrl,
    embedUrl: null,
    name: provider ? smartLinkLabel(provider) : "Smart link",
  };
}

export function getSmartLinkProvider(
  externalUrl: string,
): SmartLinkProvider | null {
  try {
    const url = new URL(externalUrl);
    const host = url.hostname.replace(/^www\./, "");
    return smartLinkProviderFromHost(host, url);
  } catch {
    return null;
  }
}

export function parseMusicLink(input: string): ParsedMusicLink | null {
  const normalized = normalizeMusicLinkInput(input);
  if (!normalized) return null;

  const uri = spotifyFromUri(normalized);
  if (uri) return uri;

  const url = parseUrl(normalized);
  if (!url) return null;

  return (
    spotifyFromUrl(url) ??
    appleMusicFromUrl(url) ??
    youtubeMusicFromUrl(url) ??
    smartLinkFromUrl(url) ??
    fallbackSmartLinkFromUrl(url)
  );
}

export function getMusicEmbedUrl(track: {
  source?: MusicSource;
  externalUrl?: string;
}): string | null {
  if (!track.externalUrl) return null;
  if (track.source === "spotify") {
    return parseMusicLink(track.externalUrl)?.embedUrl ?? null;
  }
  if (track.source === "youtube_music") {
    return parseMusicLink(track.externalUrl)?.embedUrl ?? null;
  }
  return null;
}

export { formatMediaDate } from "./videoLinkUtils";
