"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { isRecoveryHashUrl, isRecoveryPending } from "@/lib/authRecovery";
import { getSignUpPasswordIssue } from "@/lib/passwordPolicy";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { getStrings } from "@/lib/uiStrings";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        />
        <circle
          cx="12"
          cy="12"
          r="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        d="M3 3l18 18M10.6 10.6A2 2 0 0 0 12 15a2 2 0 0 0 1.4-.6M9.9 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.2 18.2 0 0 1-4.1 5.2M6.1 6.1C3.5 8.1 2 12 2 12a18.5 18.5 0 0 0 6.7 5.6"
      />
    </svg>
  );
}

export function ResetPasswordScreen() {
  const router = useRouter();
  const {
    authReady,
    isConfigured,
    session,
    isPasswordRecovery,
    updatePassword,
    markPasswordRecovery,
  } = useAuth();
  const { language, hydrated } = useProfile();
  const UI = getStrings(language);
  const SIGNUP_UI = getStrings("ja");

  const [pageReady, setPageReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady || !isConfigured) return;

    void (async () => {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        router.replace("/login");
        return;
      }

      let fromRecovery =
        isPasswordRecovery || isRecoveryPending() || isRecoveryHashUrl();

      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState({}, "", "/auth/reset-password");
        if (exchangeError) {
          setInvalidLink(true);
          setPageReady(true);
          return;
        }
        fromRecovery = true;
        markPasswordRecovery();
      } else if (isRecoveryHashUrl()) {
        fromRecovery = true;
        markPasswordRecovery();
      }

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession) {
        if (fromRecovery) {
          setInvalidLink(true);
          setPageReady(true);
          return;
        }
        router.replace("/login");
        return;
      }

      if (!fromRecovery) {
        router.replace("/");
        return;
      }

      setPageReady(true);
    })();
  }, [authReady, isConfigured, isPasswordRecovery, markPasswordRecovery, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!password || password !== passwordConfirm) {
      setError(UI.authPasswordMismatch);
      return;
    }
    if (getSignUpPasswordIssue(password) !== null) {
      setError(SIGNUP_UI.authPasswordWeak);
      return;
    }
    setBusy(true);
    const updateError = await updatePassword(password);
    setBusy(false);
    if (updateError === "not_configured") {
      setError(UI.authNotConfigured);
      return;
    }
    if (updateError) {
      setError(UI.authErrorGeneric);
      return;
    }
    router.replace("/");
  }

  if (!hydrated || !authReady || !pageReady) {
    return (
      <div className="choreo-loading">
        <div className="choreo-loading-inner">
          <BrandLogo size="loading" />
        </div>
      </div>
    );
  }

  return (
    <div className="login-page reset-password-page">
      <header className="login-page-header">
        <BrandLogo size="login" className="login-page-logo" />
        <p className="login-page-tagline">{UI.loginHeroTagline}</p>
      </header>

      <main className="login-auth reset-password-auth">
        <div className="login-auth-inner">
          <div className="auth-panel auth-panel-figma">
            <header className="auth-panel-header">
              <h1 className="auth-panel-greeting">{UI.authResetPasswordTitle}</h1>
              <p className="auth-panel-hint">{UI.authResetPasswordHint}</p>
            </header>

            {invalidLink ? (
              <div className="reset-password-invalid">
                <p className="auth-panel-error" role="alert">
                  {UI.authResetPasswordInvalidLink}
                </p>
                <Link href="/login" className="reset-password-login-link">
                  {UI.authSwitchToSignInAction}
                </Link>
              </div>
            ) : (
              <form className="auth-panel-form" onSubmit={(e) => void handleSubmit(e)}>
                {session?.user.email ? (
                  <p className="reset-password-email">{session.user.email}</p>
                ) : null}

                <label className="auth-field">
                  <span className="auth-field-label">{UI.authPassword}</span>
                  <span className="auth-password-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="auth-field-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={UI.authPassword}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? UI.authHidePassword : UI.authShowPassword
                      }
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </span>
                  <p className="auth-field-hint">{SIGNUP_UI.authPasswordHint}</p>
                </label>

                <label className="auth-field">
                  <span className="auth-field-label">{UI.authPasswordConfirm}</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="auth-field-input"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </label>

                {error ? (
                  <p className="auth-panel-error" role="alert">
                    {error}
                  </p>
                ) : null}

                <button type="submit" className="auth-submit-btn" disabled={busy}>
                  {UI.authResetPasswordSubmit}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
