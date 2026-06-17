import type Stripe from "stripe";
import type { SubscriptionPlan } from "./subscription";
import type { ProjectLanguage } from "./uiStrings";

export interface SubscriptionDetails {
  plan: SubscriptionPlan;
  status: string | null;
  currentPeriodStart: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  amountYen: number | null;
}

export function subscriptionPlanFromStripe(
  subscription: Stripe.Subscription | null | undefined,
): SubscriptionPlan {
  if (!subscription) return "free";
  if (subscription.status === "active" || subscription.status === "trialing") {
    return "pro";
  }
  return "free";
}

export function buildSubscriptionDetails(
  profilePlan: SubscriptionPlan,
  subscription: Stripe.Subscription | null,
): SubscriptionDetails {
  if (!subscription) {
    return {
      plan: profilePlan,
      status: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      amountYen: null,
    };
  }

  const item = subscription.items.data[0];
  const unitAmount = item?.price?.unit_amount ?? null;
  const currency = item?.price?.currency?.toLowerCase() ?? "jpy";

  return {
    plan: subscriptionPlanFromStripe(subscription),
    status: subscription.status,
    currentPeriodStart: item?.current_period_start ?? null,
    currentPeriodEnd: item?.current_period_end ?? null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    amountYen:
      unitAmount != null && currency === "jpy" ? unitAmount : unitAmount,
  };
}

export function formatSubscriptionDate(
  unixSeconds: number,
  language: ProjectLanguage,
): string {
  const date = new Date(unixSeconds * 1000);
  if (language === "ja") {
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
