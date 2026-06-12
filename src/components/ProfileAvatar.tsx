"use client";

import { useProfile } from "@/context/ProfileContext";

type ProfileAvatarSize = "sm" | "md" | "lg";

interface ProfileAvatarProps {
  size?: ProfileAvatarSize;
  className?: string;
}

export function ProfileAvatar({ size = "sm", className = "" }: ProfileAvatarProps) {
  const { initials, avatarColor, hydrated } = useProfile();

  return (
    <span
      className={"profile-avatar profile-avatar-" + size + (className ? " " + className : "")}
      style={hydrated ? { background: avatarColor } : undefined}
      aria-hidden
    >
      {hydrated ? initials : "·"}
    </span>
  );
}
