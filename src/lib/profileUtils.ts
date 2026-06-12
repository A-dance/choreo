import { COLORS } from "./constants";

export function getProfileInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const word = parts[0];
    if (/^[\u3040-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(word)) {
      return word.slice(0, 1);
    }
    return word.length >= 2 ? word.slice(0, 2).toUpperCase() : word.toUpperCase();
  }

  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1][0] ?? "";
  return (first + last).toUpperCase();
}

export function getProfileAvatarColor(name: string): string {
  let hash = 0;
  const src = name.trim() || "?";
  for (let i = 0; i < src.length; i++) {
    hash = (hash * 31 + src.charCodeAt(i)) | 0;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}
