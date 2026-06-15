import { PROFILE_STORAGE_KEY } from "./constants";
import {
  detectBrowserLanguage,
  normalizeLanguage,
  type ProjectLanguage,
} from "./uiStrings";

export interface UserProfile {
  displayName: string;
  email: string;
  language: ProjectLanguage;
}

function defaultProfile(): UserProfile {
  return {
    displayName: "",
    email: "",
    language: detectBrowserLanguage(),
  };
}

export function loadProfile(): UserProfile {
  if (typeof window === "undefined") return defaultProfile();
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return defaultProfile();
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      displayName:
        typeof parsed.displayName === "string" ? parsed.displayName : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
      language: normalizeLanguage(parsed.language),
    };
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(profile: UserProfile): boolean {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}
