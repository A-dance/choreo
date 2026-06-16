"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  clearRecoveryPending,
  isRecoveryPending,
  markRecoveryPending,
} from "@/lib/authRecovery";
import { getAuthRedirectUrl } from "@/lib/shareUrl";
import {
  getSupabaseBrowser,
  isSupabaseAuthConfigured,
} from "@/lib/supabaseBrowser";

interface AuthContextValue {
  authReady: boolean;
  isConfigured: boolean;
  user: User | null;
  session: Session | null;
  isPasswordRecovery: boolean;
  signInWithPassword: (email: string, password: string) => Promise<string | null>;
  signUpWithPassword: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  markPasswordRecovery: () => void;
  clearPasswordRecovery: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() =>
    typeof window !== "undefined" ? isRecoveryPending() : false,
  );
  const isConfigured = isSupabaseAuthConfigured();

  const markPasswordRecovery = useCallback(() => {
    markRecoveryPending();
    setIsPasswordRecovery(true);
  }, []);

  const clearPasswordRecovery = useCallback(() => {
    clearRecoveryPending();
    setIsPasswordRecovery(false);
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      setAuthReady(true);
      return;
    }
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setSession(data.session);
        setAuthReady(true);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (event === "PASSWORD_RECOVERY") {
          markRecoveryPending();
          setIsPasswordRecovery(true);
        }
        setSession(nextSession);
        setAuthReady(true);
      },
    );

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, [isConfigured]);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const supabase = getSupabaseBrowser();
      if (!supabase) return "not_configured";
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error?.message ?? null;
    },
    [],
  );

  const signUpWithPassword = useCallback(
    async (email: string, password: string, displayName = "") => {
      const supabase = getSupabaseBrowser();
      if (!supabase) return "not_configured";
      const trimmedName = displayName.trim();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: trimmedName
          ? {
              data: {
                display_name: trimmedName,
                full_name: trimmedName,
              },
            }
          : undefined,
      });
      return error?.message ?? null;
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return "not_configured";
    const redirectTo = getAuthRedirectUrl("/auth/callback");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    return error?.message ?? null;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    clearRecoveryPending();
    setIsPasswordRecovery(false);
    await supabase.auth.signOut();
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return "not_configured";
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return error.message;
    clearRecoveryPending();
    setIsPasswordRecovery(false);
    return null;
  }, []);

  const deleteAccount = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return "not_configured";
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return "unauthorized";
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      return body?.error ?? "delete_failed";
    }
    await supabase.auth.signOut();
    return null;
  }, []);

  const value = useMemo(
    () => ({
      authReady,
      isConfigured,
      user: session?.user ?? null,
      session,
      isPasswordRecovery,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOut,
      deleteAccount,
      updatePassword,
      markPasswordRecovery,
      clearPasswordRecovery,
    }),
    [
      authReady,
      isConfigured,
      session,
      isPasswordRecovery,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOut,
      deleteAccount,
      updatePassword,
      markPasswordRecovery,
      clearPasswordRecovery,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
