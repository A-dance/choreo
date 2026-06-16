/** 共有リンクのベース URL（末尾スラッシュなし） */
export function getShareBaseUrl(): string {
  const configured = getConfiguredAppUrl();
  if (configured) return configured;
  if (typeof window === "undefined") return "";
  const path = window.location.pathname.replace(/\/$/, "") || "";
  return `${window.location.origin}${path}`;
}

/** ログイン・パスワード再設定など auth リダイレクト先（末尾スラッシュなし） */
export function getAuthRedirectUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const configured = getConfiguredAppUrl();
  if (configured) return `${configured}${normalizedPath}`;
  if (typeof window === "undefined") return normalizedPath;
  return `${window.location.origin}${normalizedPath}`;
}

function getConfiguredAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ?? "";
}

export function isLocalDevOrigin(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}
