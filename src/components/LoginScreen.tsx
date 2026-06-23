"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthPanel } from "@/components/AuthPanel";
import { LoginHero } from "@/components/LoginHero";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { getSupabaseAuthSetupIssue } from "@/lib/supabaseBrowser";
import { getStrings, detectBrowserLanguage } from "@/lib/uiStrings";

export function LoginScreen() {
  const router = useRouter();
  const { user, authReady, isConfigured, isPasswordRecovery, signOut } = useAuth();
  const { language, hydrated } = useProfile();
  const UI = getStrings(hydrated ? language : detectBrowserLanguage());
  const setupIssue = getSupabaseAuthSetupIssue();

  useEffect(() => {
    if (!authReady) return;
    if (isPasswordRecovery) {
      router.replace("/auth/reset-password");
    }
  }, [authReady, isPasswordRecovery, router]);

  function goToEditor() {
    router.push("/");
  }

  async function handleSignOut() {
    await signOut();
  }

  if (!authReady) {
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
          ) : user && !isPasswordRecovery ? (
            <div className="login-auth-inner login-auth-signed-in">
              <p className="login-signed-in-greeting">{UI.authWelcomeBack}</p>
              <p className="login-signed-in-email">{user.email}</p>
              <button
                type="button"
                className="auth-submit-btn"
                onClick={goToEditor}
              >
                {UI.authGoToEditor}
              </button>
              <button
                type="button"
                className="login-sign-out-btn"
                onClick={() => void handleSignOut()}
              >
                {UI.authSignOut}
              </button>
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
