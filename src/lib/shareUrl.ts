/** 共有リンクのベース URL（末尾スラッシュなし） */
export function getShareBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window === "undefined") return "";
  const path = window.location.pathname.replace(/\/$/, "") || "";
  return `${window.location.origin}${path}`;
}

export function isLocalDevOrigin(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}
