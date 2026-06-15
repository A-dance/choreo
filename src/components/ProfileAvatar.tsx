"use client";

import { useProfile } from "@/context/ProfileContext";
import { ProfileUserIcon } from "@/components/profileIcons";

type ProfileAvatarSize = "sm" | "md" | "lg";

interface ProfileAvatarProps {
  size?: ProfileAvatarSize;
  className?: string;
}

export function ProfileAvatar({ size = "sm", className = "" }: ProfileAvatarProps) {
  const { initials, avatarColor, avatarUrl, hydrated } = useProfile();

  const classNames =
    "profile-avatar profile-avatar-" +
    size +
    (avatarUrl ? " profile-avatar-image" : "") +
    (!avatarUrl && !initials ? " profile-avatar-user" : "") +
    (className ? " " + className : "");

  if (hydrated && avatarUrl) {
    return (
      <span className={classNames} aria-hidden>
        <img src={avatarUrl} alt="" className="profile-avatar-img" />
      </span>
    );
  }

  return (
    <span
      className={classNames}
      style={hydrated ? { background: avatarColor } : undefined}
      aria-hidden
    >
      {hydrated ? initials || <ProfileUserIcon /> : "·"}
    </span>
  );
}
