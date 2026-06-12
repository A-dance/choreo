"use client";

import Link from "next/link";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useChoreo } from "@/context/ChoreoContext";
import { useProfile } from "@/context/ProfileContext";
import { getStrings, type ProjectLanguage } from "@/lib/uiStrings";

export function MyPageScreen() {
  const { projects } = useChoreo();
  const { profile, language, setDisplayName, setLanguage } = useProfile();
  const UI = getStrings(language);

  return (
    <div className="mypage-shell">
      <header className="mypage-head">
        <Link href="/" className="mypage-back">
          ← {UI.backToEditor}
        </Link>
      </header>

      <main className="mypage-main">
        <div className="mypage-card">
          <ProfileAvatar size="lg" />
          <h1 className="mypage-title">{UI.myPageTitle}</h1>
          <p className="mypage-desc">{UI.myPageDesc}</p>

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

          <dl className="mypage-stats">
            <div className="mypage-stat">
              <dt>{UI.myPageProjectCount}</dt>
              <dd>{projects.length}</dd>
            </div>
          </dl>

          <Link href="/" className="dialog-btn primary mypage-editor-link">
            {UI.backToEditor}
          </Link>
        </div>
      </main>
    </div>
  );
}
