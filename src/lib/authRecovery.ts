const RECOVERY_FLAG_KEY = "choreo-password-recovery";

export function isRecoveryHashUrl(): boolean {
  if (typeof window === "undefined") return false;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return hash.get("type") === "recovery";
}

export function hasRecoveryCodeInUrl(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("code");
}

export function markRecoveryPending(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RECOVERY_FLAG_KEY, "1");
}

export function isRecoveryPending(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(RECOVERY_FLAG_KEY) === "1";
}

export function clearRecoveryPending(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RECOVERY_FLAG_KEY);
}
