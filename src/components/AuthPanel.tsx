"use client";

import { GoogleIcon } from "@/components/GoogleIcon";
import { useAuth } from "@/context/AuthContext";
import { getSignUpPasswordIssue } from "@/lib/passwordPolicy";
import { getAuthRedirectUrl } from "@/lib/shareUrl";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { getStrings } from "@/lib/uiStrings";
import { useState } from "react";

const AUTH_UI = getStrings("en");
const SIGNUP_UI = getStrings("ja");

type AuthMode = "signIn" | "signUp";

interface AuthPanelProps {
  onAuthSuccess?: () => void;
}

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
        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
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

export function AuthPanel({ onAuthSuccess }: AuthPanelProps) {
  const {
    isConfigured,
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isConfigured) {
    return <p className="auth-panel-note">{AUTH_UI.authNotConfigured}</p>;
  }

  const isSignIn = mode === "signIn";

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
    setMessage(null);
    setPassword("");
    setPasswordConfirm("");
    setDisplayName("");
    setShowPassword(false);
  }

  async function handleOAuth(
    fn: () => Promise<string | null>,
    fallbackError: string,
  ) {
    setError(null);
    setMessage(null);
    setBusy(true);
    const authError = await fn();
    setBusy(false);
    if (authError === "not_configured") {
      setError(AUTH_UI.authNotConfigured);
      return;
    }
    if (authError) {
      const notEnabled =
        /not enabled|unsupported provider/i.test(authError);
      setError(notEnabled ? AUTH_UI.authProviderNotEnabled : fallbackError);
    }
  }

  async function handleForgot() {
    setError(null);
    setMessage(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(AUTH_UI.authForgotNeedsEmail);
      return;
    }
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setBusy(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      trimmedEmail,
      { redirectTo: getAuthRedirectUrl("/auth/reset-password") },
    );
    setBusy(false);
    if (resetError) {
      setError(AUTH_UI.authErrorGeneric);
      return;
    }
    setMessage(AUTH_UI.authForgotSent);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError(AUTH_UI.authErrorGeneric);
      return;
    }
    if (!isSignIn && password !== passwordConfirm) {
      setError(AUTH_UI.authPasswordMismatch);
      return;
    }
    if (!isSignIn && getSignUpPasswordIssue(password) !== null) {
      setError(SIGNUP_UI.authPasswordWeak);
      return;
    }
    const trimmedDisplayName = displayName.trim();
    if (!isSignIn && !trimmedDisplayName) {
      setError(SIGNUP_UI.authDisplayNameRequired);
      return;
    }
    setBusy(true);
    const authError = isSignIn
      ? await signInWithPassword(trimmedEmail, password)
      : await signUpWithPassword(trimmedEmail, password, trimmedDisplayName);
    setBusy(false);
    if (authError === "not_configured") {
      setError(AUTH_UI.authNotConfigured);
      return;
    }
    if (authError) {
      setError(AUTH_UI.authErrorGeneric);
      return;
    }
    if (!isSignIn) {
      setMessage(AUTH_UI.authCheckEmail);
      setPassword("");
      setPasswordConfirm("");
      setDisplayName("");
      const supabase = getSupabaseBrowser();
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session) onAuthSuccess?.();
      }
      return;
    }
    setPassword("");
    onAuthSuccess?.();
  }

  return (
    <div className="auth-panel auth-panel-figma">
      <header className="auth-panel-header">
        <h1 className="auth-panel-greeting">
          {isSignIn ? AUTH_UI.authLoginTitle : AUTH_UI.authSignUpTitle}
        </h1>
      </header>

      <form className="auth-panel-form" onSubmit={(e) => void handleSubmit(e)}>
        <label className="auth-field">
          <span className="auth-field-label">{AUTH_UI.emailLabel}</span>
          <input
            type="email"
            className="auth-field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={AUTH_UI.emailPlaceholder}
            autoComplete={isSignIn ? "email" : "username"}
            required
          />
        </label>

        {!isSignIn ? (
          <label className="auth-field">
            <span className="auth-field-label">{SIGNUP_UI.displayNameLabel}</span>
            <input
              type="text"
              className="auth-field-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={SIGNUP_UI.displayNamePlaceholder}
              autoComplete="name"
              maxLength={40}
              required
            />
          </label>
        ) : null}

        <label className="auth-field">
          <span className="auth-field-label">{AUTH_UI.authPassword}</span>
          <span className="auth-password-wrap">
            <input
              type={showPassword ? "text" : "password"}
              className="auth-field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={AUTH_UI.authPassword}
              autoComplete={isSignIn ? "current-password" : "new-password"}
              minLength={isSignIn ? undefined : 8}
              required
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? AUTH_UI.authHidePassword : AUTH_UI.authShowPassword}
            >
              <EyeIcon open={showPassword} />
            </button>
          </span>
          {!isSignIn ? (
            <p className="auth-field-hint">{SIGNUP_UI.authPasswordHint}</p>
          ) : null}
        </label>

        {!isSignIn ? (
          <label className="auth-field">
            <span className="auth-field-label">{AUTH_UI.authPasswordConfirm}</span>
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
        ) : null}

        {error ? (
          <p className="auth-panel-error" role="alert">
            {error}
          </p>
        ) : null}
        {message ? <p className="auth-panel-message">{message}</p> : null}

        <button type="submit" className="auth-submit-btn" disabled={busy}>
          {isSignIn ? AUTH_UI.authSubmitSignIn : AUTH_UI.authSubmitSignUp}
        </button>

        {isSignIn ? (
          <button
            type="button"
            className="auth-forgot-below"
            onClick={() => void handleForgot()}
          >
            {AUTH_UI.authForgotPassword}
          </button>
        ) : null}
      </form>

      <div className="auth-divider" aria-hidden>
        <span>{AUTH_UI.authOrDivider}</span>
      </div>

      <div className="auth-oauth-list">
        <button
          type="button"
          className="auth-oauth-btn"
          disabled={busy}
          onClick={() => void handleOAuth(signInWithGoogle, AUTH_UI.authGoogleError)}
        >
          <GoogleIcon />
          <span>{AUTH_UI.authContinueWithGoogle}</span>
        </button>
      </div>

      <p className="auth-panel-switch">
        <span>{isSignIn ? AUTH_UI.authSwitchToSignUp : AUTH_UI.authSwitchToSignIn}</span>{" "}
        <button
          type="button"
          className="auth-panel-switch-btn"
          onClick={() => switchMode(isSignIn ? "signUp" : "signIn")}
        >
          {isSignIn ? AUTH_UI.authSwitchToSignUpAction : AUTH_UI.authSwitchToSignInAction}
        </button>
      </p>
    </div>
  );
}
