"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import {
  isStripePublishableConfigured,
  startStripeCheckout,
  startStripePortal,
} from "@/lib/stripeCheckoutClient";
import { getStrings } from "@/lib/uiStrings";

interface StripeSubscribeButtonProps {
  variant?: "primary" | "secondary";
  className?: string;
  manage?: boolean;
}

function stripeErrorMessage(error: string | undefined, UI: ReturnType<typeof getStrings>): string {
  if (error === "missing_price") return UI.stripeMissingPriceId;
  if (error === "missing_secret") return UI.stripeMissingSecretKey;
  if (error === "stripe_not_configured") return UI.stripeNotConfigured;
  return UI.stripeCheckoutError;
}

export function StripeSubscribeButton({
  variant = "primary",
  className = "",
  manage = false,
}: StripeSubscribeButtonProps) {
  const { session } = useAuth();
  const { language } = useProfile();
  const UI = getStrings(language);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const token = session?.access_token;
    if (!token) return;
    if (!isStripePublishableConfigured()) {
      setError(UI.stripeNotConfigured);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = manage
        ? await startStripePortal(token)
        : await startStripeCheckout(token);
      if (result.error) {
        setError(stripeErrorMessage(result.error, UI));
        return;
      }
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      setError(UI.stripeCheckoutError);
    } catch {
      setError(UI.stripeCheckoutError);
    } finally {
      setBusy(false);
    }
  }

  const label = busy
    ? manage
      ? UI.myPageManageSubscriptionBusy
      : UI.upgradeCheckoutBusy
    : manage
      ? UI.myPageManageSubscription
      : UI.upgradeCheckout;

  return (
    <div className="stripe-subscribe-wrap">
      <button
        type="button"
        className={`dialog-btn ${variant}${className ? ` ${className}` : ""}`}
        disabled={busy || !session?.access_token}
        onClick={() => void handleClick()}
      >
        {label}
      </button>
      {error ? (
        <p className="stripe-subscribe-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
