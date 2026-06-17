import { fetchStripeProfile, setProfileSubscription } from "./stripeProfile";
import { getStripe, isStripeServerConfigured } from "./stripeServer";

/** アカウント削除時など、Stripe 上のサブスクを即時解約する */
export async function cancelStripeBillingForUser(userId: string): Promise<void> {
  if (!isStripeServerConfigured()) return;

  const stripe = getStripe();
  if (!stripe) return;

  const profile = await fetchStripeProfile(userId);
  if (!profile) return;

  const subscriptionIds = new Set<string>();
  if (profile.stripe_subscription_id) {
    subscriptionIds.add(profile.stripe_subscription_id);
  }

  if (profile.stripe_customer_id) {
    for (const status of ["active", "trialing", "past_due"] as const) {
      const list = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status,
        limit: 20,
      });
      for (const sub of list.data) subscriptionIds.add(sub.id);
    }
  }

  for (const subscriptionId of subscriptionIds) {
    try {
      await stripe.subscriptions.cancel(subscriptionId);
    } catch {
      /* already canceled */
    }
  }

  await setProfileSubscription(userId, "free", {
    stripeSubscriptionId: null,
  });
}
