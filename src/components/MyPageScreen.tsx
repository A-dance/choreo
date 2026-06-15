"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ProfileAvatarPicker } from "@/components/ProfileAvatarPicker";
import { useChoreo } from "@/context/ChoreoContext";
import { useProfile } from "@/context/ProfileContext";
import { formatProjectSavedAt } from "@/lib/videoLinkUtils";
import { getStrings, type ProjectLanguage } from "@/lib/uiStrings";

const APP_VERSION = "0.1.0";

export function MyPageScreen() {
  const { projects, activeProjectId } = useChoreo();
  const {
    profile,
    language,
    avatarUrl,
    avatarColor,
    hasCustomAvatar,
    setDisplayName,
    setEmail,
    setLanguage,
    setAvatarFromFile,
    clearAvatar,
  } = useProfile();
  const UI = getStrings(language);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => b.updatedAt - a.updatedAt),
    [projects],
  );

  const totals = useMemo(
    () =>
      projects.reduce(
        (acc, p) => {
          acc.audio += p.audioCount;
          acc.videos += p.videoCount;
          return acc;
        },
        { audio: 0, videos: 0 },
      ),
    [projects],
  );

  async function handleAvatarPick(file: File | undefined) {
    if (!file) return;
    setAvatarError(null);
    if (!file.type.startsWith("image/")) {
      setAvatarError(UI.avatarInvalidType);
      return;
    }
    setAvatarBusy(true);
    const ok = await setAvatarFromFile(file);
    setAvatarBusy(false);
    if (!ok) setAvatarError(UI.avatarUploadFailed);
  }

  async function handleRemoveAvatar() {
    setAvatarError(null);
    setAvatarBusy(true);
    await clearAvatar();
    setAvatarBusy(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="mypage-shell">
      <header className="mypage-head">
        <Link href="/" className="mypage-back">
          ← {UI.backToEditor}
        </Link>
        <h1 className="mypage-head-title">{UI.myPageTitle}</h1>
        <span className="mypage-head-spacer" aria-hidden />
      </header>

      <div className="mypage-body">
        <div className="mypage-content">
          <section className="mypage-profile" aria-label={UI.avatarLabel}>
            <ProfileAvatarPicker
              avatarUrl={avatarUrl}
              hasCustomAvatar={hasCustomAvatar}
              displayName={profile.displayName}
              avatarColor={avatarColor}
              label={UI.avatarChange}
              busy={avatarBusy}
              onPick={() => fileInputRef.current?.click()}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={avatarBusy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                void handleAvatarPick(file);
                e.target.value = "";
              }}
            />
            {hasCustomAvatar ? (
              <button
                type="button"
                className="mypage-avatar-remove"
                disabled={avatarBusy}
                onClick={() => void handleRemoveAvatar()}
              >
                {UI.avatarRemove}
              </button>
            ) : null}
            {avatarError ? (
              <p className="mypage-avatar-error" role="alert">
                {avatarError}
              </p>
            ) : null}
          </section>

          <p className="mypage-overview-line">
            {UI.myPageOverviewLine(
              projects.length,
              totals.audio,
              totals.videos,
            )}
          </p>

          <section className="mypage-section" aria-label={UI.myPageAccount}>
            <h2 className="mypage-section-title">{UI.myPageAccount}</h2>
            <label className="mypage-field">
              <span className="dialog-label">{UI.displayNameLabel}</span>
              <input
                type="text"
                className="dialog-input"
                value={profile.displayName}
                placeholder={UI.displayNamePlaceholder}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={40}
              />
            </label>
            <label className="mypage-field">
              <span className="dialog-label">{UI.emailLabel}</span>
              <input
                type="email"
                className="dialog-input"
                value={profile.email}
                placeholder={UI.emailPlaceholder}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                maxLength={120}
              />
            </label>
            <label className="mypage-field">
              <span className="dialog-label">{UI.languageLabel}</span>
              <select
                className="dialog-input"
                value={language}
                onChange={(e) => setLanguage(e.target.value as ProjectLanguage)}
              >
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </label>
          </section>

          <section className="mypage-section" aria-label={UI.myPageProjectsSection}>
            <h2 className="mypage-section-title">{UI.myPageProjectsSection}</h2>
            <ul className="mypage-project-list">
              {sortedProjects.map((project) => {
                const title =
                  project.songTitle.trim() || UI.defaultSongTitle;
                const isActive = project.id === activeProjectId;
                return (
                  <li key={project.id}>
                    <div
                      className={
                        "mypage-project-row" + (isActive ? " active" : "")
                      }
                    >
                      <span className="mypage-project-main">
                        <span className="mypage-project-title">{title}</span>
                        <span className="mypage-project-meta">
                          {project.bpm} BPM ·{" "}
                          {UI.mediaCounts(project.audioCount, project.videoCount)}
                        </span>
                        <span className="mypage-project-saved">
                          {UI.projectLastSaved(
                            formatProjectSavedAt(project.updatedAt, language),
                          )}
                        </span>
                      </span>
                      {isActive ? (
                        <span className="mypage-project-badge">
                          {UI.myPageCurrentBadge}
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="mypage-section mypage-about" aria-label={UI.myPageAbout}>
            <h2 className="mypage-section-title">{UI.myPageAbout}</h2>
            <p className="mypage-about-name">{UI.myPageAppName}</p>
            <p className="mypage-about-version">{UI.myPageVersion(APP_VERSION)}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
