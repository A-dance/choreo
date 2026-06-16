"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { isPublicShareUrl } from "@/lib/shareUtils";
import { getStrings } from "@/lib/uiStrings";

interface AuthGateProps {
  children: ReactNode;
  allowShareGuest?: boolean;
}

export function AuthGate({ children, allowShareGuest = false }: AuthGateProps) {
  const router = useRouter();
  const { authReady, isConfigured, user, isPasswordRecovery } = useAuth();
  const { language, hydrated } = useProfile();
  const UI = getStrings(language);
  const [shareGuest, setShareGuest] = useState(false);

  useEffect(() => {
    if (!allowShareGuest) return;
    setShareGuest(isPublicShareUrl(window.location.search));
  }, [allowShareGuest]);

  const guestAllowed = allowShareGuest && shareGuest;

  useEffect(() => {
    if (!authReady || !isConfigured) return;
    if (user && isPasswordRecovery) {
      router.replace("/auth/reset-password");
      return;
    }
    if (!user && !guestAllowed) router.replace("/login");
  }, [authReady, isConfigured, user, isPasswordRecovery, guestAllowed, router]);

  if (!authReady) {
    return (
      <div className="choreo-loading">
        <div className="choreo-loading-inner">
          <BrandLogo size="loading" />
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    if (!hydrated) {
      return (
        <div className="choreo-loading">
          <div className="choreo-loading-inner">
            <BrandLogo size="loading" />
          </div>
        </div>
      );
    }
    return (
      <div className="login-shell">
        <div className="login-card">
          <BrandLogo size="loading" className="login-logo" />
          <h1 className="login-title">{UI.authUnavailableTitle}</h1>
          <p className="login-hint">{UI.authNotConfigured}</p>
        </div>
      </div>
    );
  }

  if (!user && !guestAllowed) {
    return (
      <div className="choreo-loading">
        <div className="choreo-loading-inner">
          <BrandLogo size="loading" />
        </div>
      </div>
    );
  }

  if (user && isPasswordRecovery) {
    return (
      <div className="choreo-loading">
        <div className="choreo-loading-inner">
          <BrandLogo size="loading" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
