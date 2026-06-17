"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProfileAvatarPicker } from "@/components/ProfileAvatarPicker";
import { MyPagePlanSection } from "@/components/MyPagePlanSection";
import { useAuth } from "@/context/AuthContext";
import { useChoreo } from "@/context/ChoreoContext";
import { useProfile } from "@/context/ProfileContext";
import { clearLocalUserData } from "@/lib/accountLocalData";
import { cancelCloudWorkspacePush } from "@/lib/cloudSync";
import { getStrings, type ProjectLanguage } from "@/lib/uiStrings";
import { formatProjectSavedAt } from "@/lib/videoLinkUtils";

const APP_VERSION = "0.1.0";

export function MyPageScreen() {
  const router = useRouter();
  const { signOut, deleteAccount } = useAuth();
  const { projects, activeProjectId } = useChoreo();
  const {
    profile,
    language,
    plan,
    avatarUrl,
    avatarColor,
    hasCustomAvatar,
    isLoggedIn,
    setDisplayName,
    setEmail,
    setLanguage,
    setAvatarFromFile,
    clearAvatar,
    refreshPlan,
  } = useProfile();
  const UI = getStrings(language);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);
  const [portalNotice, setPortalNotice] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    const portal = params.get("portal");
    if (checkout === "success") {
      setCheckoutNotice(UI.checkoutSuccess);
      void refreshPlan();
      for (const delay of [1000, 2500, 5000, 10000]) {
        window.setTimeout(() => void refreshPlan(), delay);
      }
    } else if (checkout === "cancel") {
      setCheckoutNotice(UI.checkoutCancel);
    } else if (portal === "return") {
      setPortalNotice(UI.portalReturnNotice);
      void refreshPlan();
      for (const delay of [500, 1500, 3000]) {
        window.setTimeout(() => void refreshPlan(), delay);
      }
    }
    if (checkout || portal) {
      window.history.replaceState({}, "", "/mypage");
    }
  }, [UI.checkoutCancel, UI.checkoutSuccess, UI.portalReturnNotice, refreshPlan]);

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

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  async function handleDeleteAccount() {
    setDeleteError(null);
    setDeleteBusy(true);
    cancelCloudWorkspacePush();
    const err = await deleteAccount();
    if (err) {
      setDeleteBusy(false);
      setDeleteError(UI.myPageDeleteAccountFailed);
      return;
    }
    await clearLocalUserData();
    setDeleteOpen(false);
    setDeleteBusy(false);
    router.push("/login");
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
                readOnly={isLoggedIn}
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

          {isLoggedIn ? (
            <MyPagePlanSection
              checkoutNotice={checkoutNotice}
              portalNotice={portalNotice}
            />
          ) : null}

          <section className="mypage-section" aria-label={UI.myPageProjectsSection}>
            <h2 className="mypage-section-title">{UI.myPageProjectsSection}</h2>
            <div
              className="mypage-project-list-scroll"
              onWheel={(e) => e.stopPropagation()}
            >
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
            </div>
          </section>

          <section className="mypage-section mypage-about" aria-label={UI.myPageAbout}>
            <h2 className="mypage-section-title">{UI.myPageAbout}</h2>
            <p className="mypage-about-name">{UI.myPageAppName}</p>
            <p className="mypage-about-version">{UI.myPageVersion(APP_VERSION)}</p>
          </section>

          {isLoggedIn ? (
            <section
              className="mypage-section mypage-data-deletion"
              aria-label={UI.myPageDataDeletion}
            >
              <h2 className="mypage-section-title">{UI.myPageDataDeletion}</h2>
              <button
                type="button"
                className="mypage-delete-account"
                onClick={() => {
                  setDeleteError(null);
                  void refreshPlan();
                  setDeleteOpen(true);
                }}
              >
                {UI.myPageDeleteAccount}
              </button>
              {deleteError ? (
                <p className="mypage-delete-error" role="alert">
                  {deleteError}
                </p>
              ) : null}
            </section>
          ) : null}

          {isLoggedIn ? (
            <button
              type="button"
              className="mypage-signout"
              onClick={() => void handleSignOut()}
            >
              {UI.authSignOut}
            </button>
          ) : null}
        </div>
      </div>

      {deleteOpen ? (
        <div
          className="dialog-overlay delete-account-dialog-overlay"
          onClick={() => {
            if (!deleteBusy) setDeleteOpen(false);
          }}
          role="presentation"
        >
          <div
            className="dialog-panel delete-account-dialog"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            aria-describedby="delete-account-desc"
          >
            <h2 id="delete-account-title" className="dialog-title">
              {UI.myPageDeleteAccountConfirmTitle}
            </h2>
            <div id="delete-account-desc" className="delete-account-dialog-body">
              <div className="delete-account-dialog-intro">
                {UI.myPageDeleteAccountIntro.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <div className="delete-account-dialog-block">
                <p className="delete-account-dialog-label">
                  {UI.myPageDataDeletionStoredLabel}
                </p>
                <ul className="delete-account-dialog-list">
                  {UI.myPageDataDeletionItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              {plan === "pro" ? (
                <div className="delete-account-dialog-pro-section">
                  <div className="delete-account-dialog-pro-head">
                    <span className="delete-account-dialog-pro-badge">PRO</span>
                    <p className="delete-account-dialog-pro-heading">
                      {UI.myPageDeleteAccountProHeading}
                    </p>
                  </div>
                  <div className="delete-account-dialog-pro-body">
                    {UI.myPageDeleteAccountProBody.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="dialog-actions">
              <button
                type="button"
                className="dialog-btn secondary"
                disabled={deleteBusy}
                onClick={() => setDeleteOpen(false)}
              >
                {UI.cancel}
              </button>
              <button
                type="button"
                className="dialog-btn danger"
                disabled={deleteBusy}
                onClick={() => void handleDeleteAccount()}
              >
                {UI.delete}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
