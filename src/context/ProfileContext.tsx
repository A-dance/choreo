"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  loadProfile,
  saveProfile,
  type UserProfile,
} from "@/lib/profileStore";
import {
  deleteProfileAvatar,
  loadProfileAvatar,
  resizeImageForAvatar,
  saveProfileAvatar,
} from "@/lib/profileAvatarStore";
import { detectBrowserLanguage } from "@/lib/uiStrings";
import {
  getProfileAvatarColor,
  getProfileInitials,
} from "@/lib/profileUtils";
import {
  normalizeLanguage,
  type ProjectLanguage,
} from "@/lib/uiStrings";

interface ProfileContextValue {
  profile: UserProfile;
  hydrated: boolean;
  language: ProjectLanguage;
  initials: string;
  avatarColor: string;
  avatarUrl: string | null;
  hasCustomAvatar: boolean;
  setDisplayName: (name: string) => void;
  setEmail: (email: string) => void;
  setLanguage: (language: ProjectLanguage) => void;
  setAvatarFromFile: (file: File) => Promise<boolean>;
  clearAvatar: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(() => ({
    displayName: "",
    email: "",
    language: detectBrowserLanguage(),
  }));
  const [hydrated, setHydrated] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarUrlRef = useRef<string | null>(null);

  const revokeAvatarUrl = useCallback(() => {
    if (avatarUrlRef.current) {
      URL.revokeObjectURL(avatarUrlRef.current);
      avatarUrlRef.current = null;
    }
    setAvatarUrl(null);
  }, []);

  const applyAvatarBlob = useCallback(
    (blob: Blob | null) => {
      revokeAvatarUrl();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      avatarUrlRef.current = url;
      setAvatarUrl(url);
    },
    [revokeAvatarUrl],
  );

  useEffect(() => {
    let cancelled = false;
    setProfile(loadProfile());
    void (async () => {
      try {
        const blob = await loadProfileAvatar();
        if (!cancelled) applyAvatarBlob(blob);
      } catch {
        if (!cancelled) applyAvatarBlob(null);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
      revokeAvatarUrl();
    };
  }, [applyAvatarBlob, revokeAvatarUrl]);

  useEffect(() => {
    if (!hydrated) return;
    saveProfile(profile);
  }, [profile, hydrated]);

  const setDisplayName = useCallback((displayName: string) => {
    setProfile((prev) => ({ ...prev, displayName }));
  }, []);

  const setEmail = useCallback((email: string) => {
    setProfile((prev) => ({ ...prev, email }));
  }, []);

  const setLanguage = useCallback((language: ProjectLanguage) => {
    setProfile((prev) => ({
      ...prev,
      language: normalizeLanguage(language),
    }));
  }, []);

  const setAvatarFromFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return false;
      try {
        const blob = await resizeImageForAvatar(file);
        await saveProfileAvatar(blob, "image/jpeg");
        applyAvatarBlob(blob);
        return true;
      } catch {
        return false;
      }
    },
    [applyAvatarBlob],
  );

  const clearAvatar = useCallback(async () => {
    try {
      await deleteProfileAvatar();
    } catch {
      // ignore delete errors; still clear preview
    }
    revokeAvatarUrl();
  }, [revokeAvatarUrl]);

  const initials = useMemo(
    () => getProfileInitials(profile.displayName),
    [profile.displayName],
  );
  const avatarColor = useMemo(
    () => getProfileAvatarColor(profile.displayName, profile.email),
    [profile.displayName, profile.email],
  );

  const value = useMemo(
    () => ({
      profile,
      hydrated,
      language: profile.language,
      initials,
      avatarColor,
      avatarUrl,
      hasCustomAvatar: Boolean(avatarUrl),
      setDisplayName,
      setEmail,
      setLanguage,
      setAvatarFromFile,
      clearAvatar,
    }),
    [
      profile,
      hydrated,
      initials,
      avatarColor,
      avatarUrl,
      setDisplayName,
      setEmail,
      setLanguage,
      setAvatarFromFile,
      clearAvatar,
    ],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return ctx;
}
