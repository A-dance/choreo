"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loadProfile,
  saveProfile,
  type UserProfile,
} from "@/lib/profileStore";
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
  setDisplayName: (name: string) => void;
  setLanguage: (language: ProjectLanguage) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(() => ({
    displayName: "",
    language: detectBrowserLanguage(),
  }));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveProfile(profile);
  }, [profile, hydrated]);

  const setDisplayName = useCallback((displayName: string) => {
    setProfile((prev) => ({ ...prev, displayName }));
  }, []);

  const setLanguage = useCallback((language: ProjectLanguage) => {
    setProfile((prev) => ({
      ...prev,
      language: normalizeLanguage(language),
    }));
  }, []);

  const initials = useMemo(
    () => getProfileInitials(profile.displayName),
    [profile.displayName],
  );
  const avatarColor = useMemo(
    () => getProfileAvatarColor(profile.displayName),
    [profile.displayName],
  );

  const value = useMemo(
    () => ({
      profile,
      hydrated,
      language: profile.language,
      initials,
      avatarColor,
      setDisplayName,
      setLanguage,
    }),
    [profile, hydrated, initials, avatarColor, setDisplayName, setLanguage],
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
