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
import { useAuth } from "@/context/AuthContext";
import {
  loadProfile,
  saveProfile,
  type UserProfile,
} from "@/lib/profileStore";
import {
  cloudProfileToUserProfile,
  deleteCloudAvatar,
  downloadCloudAvatar,
  fetchCloudProfile,
  uploadCloudAvatar,
  upsertCloudProfile,
} from "@/lib/cloudSync";
import {
  deleteProfileAvatar,
  loadProfileAvatar,
  resizeImageForAvatar,
  saveProfileAvatar,
} from "@/lib/profileAvatarStore";
import {
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  type ProjectLanguage,
} from "@/lib/uiStrings";
import {
  normalizePlan,
  type SubscriptionPlan,
} from "@/lib/subscription";
import { syncPlanFromStripe } from "@/lib/stripeCheckoutClient";
import {
  getProfileAvatarColor,
  getProfileInitials,
  readDisplayNameFromUser,
} from "@/lib/profileUtils";

interface ProfileContextValue {
  profile: UserProfile;
  hydrated: boolean;
  language: ProjectLanguage;
  initials: string;
  avatarColor: string;
  avatarUrl: string | null;
  hasCustomAvatar: boolean;
  isLoggedIn: boolean;
  setDisplayName: (name: string) => void;
  setEmail: (email: string) => void;
  setLanguage: (language: ProjectLanguage) => void;
  setAvatarFromFile: (file: File) => Promise<boolean>;
  clearAvatar: () => Promise<void>;
  plan: SubscriptionPlan;
  refreshPlan: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { authReady, user, session } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(() => ({
    displayName: "",
    email: "",
    language: DEFAULT_LANGUAGE,
  }));
  const [hydrated, setHydrated] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan>("free");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarUrlRef = useRef<string | null>(null);
  const profileRef = useRef(profile);
  const cloudAvatarPathRef = useRef<string | null>(null);
  profileRef.current = profile;

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

    async function bootProfile() {
      const local = loadProfile();
      if (!authReady) return;
      if (!user) {
        if (!cancelled) {
          const cleared = { ...local, displayName: "", email: "" };
          setProfile(cleared);
          setPlan("free");
          saveProfile(cleared);
          setHydrated(true);
          try {
            const blob = await loadProfileAvatar();
            if (!cancelled) applyAvatarBlob(blob);
          } catch {
            if (!cancelled) applyAvatarBlob(null);
          }
        }
        return;
      }

      const email = user.email ?? "";
      const metadataName = readDisplayNameFromUser(user);
      let nextProfile: UserProfile = {
        displayName: "",
        email,
        language: normalizeLanguage(local.language),
      };
      cloudAvatarPathRef.current = null;

      try {
        const cloud = await fetchCloudProfile(user.id);
        if (cloud) {
          nextProfile = {
            ...cloudProfileToUserProfile(cloud, email),
            email,
          };
          setPlan(normalizePlan(cloud.plan));
          if (!nextProfile.displayName.trim() && metadataName) {
            nextProfile.displayName = metadataName;
          }
          cloudAvatarPathRef.current = cloud.avatar_path;
        } else {
          nextProfile.displayName = metadataName;
          setPlan("free");
          await upsertCloudProfile(user.id, {
            displayName: nextProfile.displayName,
            language: nextProfile.language,
          });
        }
      } catch {
        /* keep local */
      }

      if (cancelled) return;
      setProfile(nextProfile);
      saveProfile(nextProfile);

      const token = session?.access_token;
      if (token) {
        const synced = await syncPlanFromStripe(token);
        if (!cancelled && synced) setPlan(synced);
      }

      try {
        let blob: Blob | null = null;
        if (cloudAvatarPathRef.current) {
          blob = await downloadCloudAvatar(cloudAvatarPathRef.current);
        }
        if (!blob) blob = await loadProfileAvatar();
        if (!cancelled) applyAvatarBlob(blob);
      } catch {
        if (!cancelled) applyAvatarBlob(null);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    void bootProfile();
    return () => {
      cancelled = true;
      revokeAvatarUrl();
    };
  }, [authReady, user, session?.access_token, applyAvatarBlob, revokeAvatarUrl]);

  useEffect(() => {
    if (!hydrated) return;
    saveProfile(profile);
    if (!user) return;
    void upsertCloudProfile(user.id, {
      displayName: profile.displayName,
      language: profile.language,
    });
  }, [profile, hydrated, user]);

  const setDisplayName = useCallback((displayName: string) => {
    setProfile((prev) => ({ ...prev, displayName }));
  }, []);

  const setEmail = useCallback((email: string) => {
    if (user) return;
    setProfile((prev) => ({ ...prev, email }));
  }, [user]);

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
        if (user) {
          const path = await uploadCloudAvatar(user.id, blob);
          if (path) {
            cloudAvatarPathRef.current = path;
            await upsertCloudProfile(
              user.id,
              {
                displayName: profileRef.current.displayName,
                language: profileRef.current.language,
              },
              path,
            );
          }
        }
        return true;
      } catch {
        return false;
      }
    },
    [applyAvatarBlob, user],
  );

  const clearAvatar = useCallback(async () => {
    try {
      await deleteProfileAvatar();
      if (user) {
        await deleteCloudAvatar(user.id);
        cloudAvatarPathRef.current = null;
        await upsertCloudProfile(
          user.id,
          {
            displayName: profileRef.current.displayName,
            language: profileRef.current.language,
          },
          null,
        );
      }
    } catch {
      /* ignore */
    }
    revokeAvatarUrl();
  }, [revokeAvatarUrl, user]);

  const refreshPlan = useCallback(async () => {
    if (!user) {
      setPlan("free");
      return;
    }
    const token = session?.access_token;
    if (token) {
      const synced = await syncPlanFromStripe(token);
      if (synced) {
        setPlan(synced);
        return;
      }
    }
    try {
      const cloud = await fetchCloudProfile(user.id);
      if (cloud) setPlan(normalizePlan(cloud.plan));
    } catch {
      /* ignore */
    }
  }, [user, session?.access_token]);

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
      isLoggedIn: Boolean(user),
      plan,
      setDisplayName,
      setEmail,
      setLanguage,
      setAvatarFromFile,
      clearAvatar,
      refreshPlan,
    }),
    [
      profile,
      hydrated,
      initials,
      avatarColor,
      avatarUrl,
      user,
      plan,
      setDisplayName,
      setEmail,
      setLanguage,
      setAvatarFromFile,
      clearAvatar,
      refreshPlan,
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
