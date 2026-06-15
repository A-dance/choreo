import { ProfileUserIcon } from "@/components/profileIcons";
import { getAvatarCircleText } from "@/lib/profileUtils";

function PenIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20h9M15.5 5.5l3 3L8 19l-4 1 1-4 10.5-10.5Z"
      />
    </svg>
  );
}

interface ProfileAvatarPickerProps {
  avatarUrl: string | null;
  hasCustomAvatar: boolean;
  displayName: string;
  avatarColor: string;
  label: string;
  busy?: boolean;
  onPick: () => void;
}

export function ProfileAvatarPicker({
  avatarUrl,
  hasCustomAvatar,
  displayName,
  avatarColor,
  label,
  busy = false,
  onPick,
}: ProfileAvatarPickerProps) {
  const circleText = getAvatarCircleText(displayName);

  return (
    <div className="mypage-avatar-picker-wrap">
      <div
        className={
          "mypage-avatar-picker-circle profile-avatar profile-avatar-lg" +
          (hasCustomAvatar ? " profile-avatar-image" : "") +
          (!hasCustomAvatar && !circleText ? " profile-avatar-user" : "")
        }
        style={hasCustomAvatar ? undefined : { background: avatarColor }}
      >
        {hasCustomAvatar && avatarUrl ? (
          <img src={avatarUrl} alt="" className="profile-avatar-img" />
        ) : circleText ? (
          circleText
        ) : (
          <ProfileUserIcon />
        )}
      </div>
      <button
        type="button"
        className="mypage-avatar-picker-edit"
        onClick={onPick}
        disabled={busy}
        aria-label={label}
        title={label}
      >
        <PenIcon />
      </button>
    </div>
  );
}
