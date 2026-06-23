export interface OpenGraphMetadata {
  title: string | null;
  thumbnailUrl: string | null;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)));
}

function readMetaContent(
  html: string,
  key: string,
  attr: "property" | "name",
): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${key}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return null;
}

function readTitleTag(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : null;
}

function readJsonLdTitle(html: string): string | null {
  const scripts = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const match of scripts) {
    try {
      const raw = match[1]?.trim();
      if (!raw) continue;
      const data = JSON.parse(raw) as unknown;
      const found = findNameInJsonLd(data);
      if (found) return found;
    } catch {
      /* skip invalid JSON-LD */
    }
  }
  return null;
}

function findNameInJsonLd(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  if (Array.isArray(data)) {
    for (const item of data) {
      const name = findNameInJsonLd(item);
      if (name) return name;
    }
    return null;
  }
  const obj = data as Record<string, unknown>;
  if (typeof obj.name === "string" && obj.name.trim()) return obj.name.trim();
  if (Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"]) {
      const name = findNameInJsonLd(item);
      if (name) return name;
    }
  }
  return null;
}

function normalizeTitleSpaces(title: string): string {
  return title
    .replace(/[\u00a0\u2009\u202f\u2007\u2060\u200b\ufeff]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripAppleMusicSuffix(title: string): string {
  let t = title;
  t = t.replace(/\s+on Apple Music\s*$/i, "");
  t = t.replace(/\s+in Apple Music\s*$/i, "");
  t = t.replace(/\s*を\s*Apple Music\s*で(?:聴く)?\s*$/i, "");
  t = t.replace(/\s*[|\-–—·]\s*Apple Music\s*$/i, "");
  t = t.replace(/\s*-\s*Apple Music\s*$/i, "");
  t = t.replace(/\s*｜\s*Apple Music\s*$/i, "");
  t = t.replace(/\s*（Apple Music）\s*$/i, "");
  t = t.replace(/\s*\(Apple Music\)\s*$/i, "");
  t = t.replace(/\s*-\s*Apple Music\s*-\s*[^-]+$/i, "");
  return t.trim();
}

function parseJapaneseAppleMusicTitle(title: string): string | null {
  const quoted = title.match(/^(.+?)の[「"'](.+?)[」"']を\s*Apple Music\s*で\s*$/i);
  if (quoted) return `${quoted[2].trim()} - ${quoted[1].trim()}`;

  const songCredit = title.match(/^(.+?)\s*-\s*(.+?)の曲\s*$/i);
  if (songCredit) return `${songCredit[1].trim()} - ${songCredit[2].trim()}`;

  return null;
}

export function cleanMusicTitle(title: string | null): string | null {
  if (!title) return null;
  let t = normalizeTitleSpaces(title);
  t = t.replace(/^[\u200e\u200f▶]+\s*/, "");

  const jpParsed = parseJapaneseAppleMusicTitle(t);
  if (jpParsed) t = jpParsed;

  t = t.replace(/\s*[|\-–—·]\s*Linkfire\s*$/i, "");
  t = t.replace(/\s*[|\-–—·]\s*Listen on Linkfire\s*$/i, "");
  t = t.replace(/\s*[|\-–—·]\s*TuneCore\s*.*$/i, "");
  t = t.replace(/\s*[|\-–—·]\s*Spotify\s*$/i, "");
  t = t.replace(/^Listen on\s+/i, "");

  t = stripAppleMusicSuffix(t);
  t = stripAppleMusicSuffix(t);

  t = t.replace(/^(.+?)\s*-\s*(.+?)の曲\s*$/i, "$1 - $2");

  const generic = /^(linkfire|smart link|tunecore|spotify|apple music|youtube music)$/i;
  if (generic.test(t)) return null;
  return t.trim() || null;
}

/** Display/storage helper — always returns a non-empty string when input is non-empty. */
export function displayMusicTitle(title: string): string {
  return cleanMusicTitle(title) ?? title.trim();
}

export function parseOpenGraphMetadata(html: string): OpenGraphMetadata {
  const rawTitle =
    readMetaContent(html, "og:title", "property") ??
    readMetaContent(html, "twitter:title", "name") ??
    readMetaContent(html, "music:song", "property") ??
    readJsonLdTitle(html) ??
    readTitleTag(html);

  const title = cleanMusicTitle(rawTitle);

  const thumbnailUrl =
    readMetaContent(html, "og:image", "property") ??
    readMetaContent(html, "og:image:url", "property") ??
    readMetaContent(html, "twitter:image", "name");

  return { title, thumbnailUrl };
}

const FETCH_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,ja;q=0.8",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

export async function fetchOpenGraphMetadata(
  pageUrl: string,
): Promise<OpenGraphMetadata> {
  try {
    const res = await fetch(pageUrl, {
      headers: FETCH_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return { title: null, thumbnailUrl: null };
    const html = await res.text();
    return parseOpenGraphMetadata(html);
  } catch {
    return { title: null, thumbnailUrl: null };
  }
}
