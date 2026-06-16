"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthPanel } from "@/components/AuthPanel";
import { LoginHero } from "@/components/LoginHero";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { getSupabaseAuthSetupIssue } from "@/lib/supabaseBrowser";
import { getStrings } from "@/lib/uiStrings";

export function LoginScreen() {
  const router = useRouter();
  const { user, authReady, isConfigured, isPasswordRecovery } = useAuth();
  const { language, hydrated } = useProfile();
  const UI = getStrings(language);
  const setupIssue = getSupabaseAuthSetupIssue();

  useEffect(() => {
    if (!authReady) return;
    if (isPasswordRecovery) {
      router.replace("/auth/reset-password");
      return;
    }
    if (user) router.replace("/");
  }, [authReady, user, isPasswordRecovery, router]);

  function goToEditor() {
    router.push("/");
  }

  if (!hydrated || (authReady && user && !isPasswordRecovery)) {
    return (
      <div className="choreo-loading">
        <div className="choreo-loading-inner">
          <BrandLogo size="loading" />
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <header className="login-page-header">
        <BrandLogo size="login" className="login-page-logo" />
        <p className="login-page-tagline">{UI.loginHeroTagline}</p>
      </header>

      <div className="login-layout">
        <LoginHero />

        <main className="login-auth">
          {!isConfigured ? (
            <div className="login-auth-inner login-auth-error">
              <h1 className="login-title">{UI.authUnavailableTitle}</h1>
              <p className="login-hint">
                {setupIssue === "anon_key"
                  ? UI.authAnonKeyMissing
                  : UI.authUnavailableHint}
              </p>
            </div>
          ) : (
            <div className="login-auth-inner">
              <AuthPanel onAuthSuccess={goToEditor} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
