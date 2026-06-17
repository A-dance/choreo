"use client";

export interface SubscriptionDetailsResponse {
  plan: "free" | "pro";
  status: string | null;
  currentPeriodStart: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  amountYen: number | null;
}

export async function syncPlanFromStripe(
  accessToken: string,
): Promise<"free" | "pro" | null> {
  try {
    const res = await fetch("/api/stripe/sync", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { plan?: "free" | "pro" };
    return data.plan ?? null;
  } catch {
    return null;
  }
}

export async function fetchSubscriptionDetails(
  accessToken: string,
): Promise<SubscriptionDetailsResponse | null> {
  try {
    const res = await fetch("/api/stripe/subscription", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as SubscriptionDetailsResponse;
  } catch {
    return null;
  }
}

export async function startStripeCheckout(
  accessToken: string,
): Promise<{ url?: string; error?: string }> {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok) {
    return { error: data.error ?? "checkout_failed" };
  }
  return { url: data.url };
}

export async function startStripePortal(
  accessToken: string,
): Promise<{ url?: string; error?: string }> {
  const res = await fetch("/api/stripe/portal", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok) {
    return { error: data.error ?? "portal_failed" };
  }
  return { url: data.url };
}

export function isStripePublishableConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  return key.startsWith("pk_test_") || key.startsWith("pk_live_");
}
