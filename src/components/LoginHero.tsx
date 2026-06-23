"use client";

import { LoginStagePreview } from "@/components/LoginStagePreview";
import { useProfile } from "@/context/ProfileContext";
import { getStrings, detectBrowserLanguage } from "@/lib/uiStrings";

export function LoginHero() {
  const { language, hydrated } = useProfile();
  const UI = getStrings(hydrated ? language : detectBrowserLanguage());

  return (
    <aside className="login-hero" aria-label={UI.loginHeroLabel}>
      <h1 className="login-hero-headline">{UI.loginHeroHeadline}</h1>
      <p className="login-hero-desc">{UI.loginHeroDesc}</p>
      <LoginStagePreview />
      <ul className="login-hero-points">
        {UI.loginHeroFeatures.map((label) => (
          <li key={label}>{label}</li>
        ))}
      </ul>
    </aside>
  );
}
