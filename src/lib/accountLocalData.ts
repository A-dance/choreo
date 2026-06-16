import {
  LEGACY_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
  WORKSPACE_STORAGE_KEY,
} from "./constants";
import { deleteProfileAvatar } from "./profileAvatarStore";

export async function clearLocalUserData(): Promise<void> {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROFILE_STORAGE_KEY);
  localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  try {
    await deleteProfileAvatar();
  } catch {
    /* ignore */
  }
}
