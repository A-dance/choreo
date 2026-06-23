"use client";

import { LoginStagePreview } from "@/components/LoginStagePreview";
import { useProfile } from "@/context/ProfileContext";
import { getStrings, detectBrowserLanguage } from "@/lib/uiStrings";

export function LoginHero() {
  const { language, hydrated } = useProfile();
  const UI = getStrings(hydrated ? language : detectBrowserLanguage());

  return (
    <aside className="login-hero" aria-label={UI.loginHeroLabel}>
      <div className="login-hero-copy">
        <h1 className="login-hero-headline">{UI.loginHeroHeadline}</h1>
        <p className="login-hero-desc">{UI.loginHeroDesc}</p>
      </div>
      <LoginStagePreview />
    </aside>
  );
}
