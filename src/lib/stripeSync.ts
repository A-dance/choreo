import type Stripe from "stripe";
import {
  fetchStripeProfile,
  setProfileSubscription,
} from "./stripeProfile";
import { getStripe, isStripeServerConfigured } from "./stripeServer";
import { subscriptionPlanFromStripe } from "./stripeSubscriptionInfo";
import { normalizePlan, type SubscriptionPlan } from "./subscription";

async function findActiveSubscription(
  stripe: Stripe,
  customerId: string,
  knownSubscriptionId: string | null,
): Promise<Stripe.Subscription | null> {
  if (knownSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(knownSubscriptionId);
      if (sub.status === "active" || sub.status === "trialing") return sub;
    } catch {
      /* fall through to list */
    }
  }

  for (const status of ["active", "trialing"] as const) {
    const list = await stripe.subscriptions.list({
      customer: customerId,
      status,
      limit: 1,
    });
    if (list.data[0]) return list.data[0];
  }
  return null;
}

async function collectCustomerCandidates(
  stripe: Stripe,
  userId: string,
  email: string | null | undefined,
  profileCustomerId: string | null,
): Promise<string[]> {
  const seen = new Set<string>();
  const candidates: string[] = [];

  const push = (id: string | null | undefined) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    candidates.push(id);
  };

  try {
    const search = await stripe.customers.search({
      query: `metadata['supabase_user_id']:'${userId}'`,
      limit: 10,
    });
    for (const customer of search.data) push(customer.id);
  } catch {
    /* search not always available */
  }

  push(profileCustomerId);

  if (email) {
    const list = await stripe.customers.list({ email, limit: 10 });
    for (const customer of list.data) {
      if (customer.metadata?.supabase_user_id === userId) {
        push(customer.id);
      }
    }
    if (list.data.length === 1) push(list.data[0].id);
  }

  return candidates;
}

async function isValidCustomer(
  stripe: Stripe,
  customerId: string,
): Promise<boolean> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return !("deleted" in customer && customer.deleted);
  } catch {
    return false;
  }
}

async function resolveStripeCustomerId(
  stripe: Stripe,
  userId: string,
  email: string | null | undefined,
  profileCustomerId: string | null,
): Promise<string | null> {
  const candidates = await collectCustomerCandidates(
    stripe,
    userId,
    email,
    profileCustomerId,
  );

  for (const customerId of candidates) {
    if (!(await isValidCustomer(stripe, customerId))) continue;
    const subscription = await findActiveSubscription(stripe, customerId, null);
    if (subscription) return customerId;
  }

  for (const customerId of candidates) {
    if (await isValidCustomer(stripe, customerId)) return customerId;
  }

  return null;
}

/** Stripe の状態を Supabase profiles.plan に反映する（Webhook 未設定時のフォールバック） */
export async function syncProfilePlanFromStripe(
  userId: string,
  email?: string | null,
): Promise<SubscriptionPlan> {
  const profile = await fetchStripeProfile(userId);
  const cachedPlan = normalizePlan(profile?.plan);

  if (!isStripeServerConfigured()) return cachedPlan;

  const stripe = getStripe();
  if (!stripe) return cachedPlan;

  const customerId = await resolveStripeCustomerId(
    stripe,
    userId,
    email,
    profile?.stripe_customer_id ?? null,
  );

  if (!customerId) {
    if (cachedPlan === "pro") {
      await setProfileSubscription(userId, "free", {
        stripeSubscriptionId: null,
      });
      return "free";
    }
    return cachedPlan;
  }

  const subscription = await findActiveSubscription(
    stripe,
    customerId,
    profile?.stripe_subscription_id ?? null,
  );

  const plan = subscriptionPlanFromStripe(subscription);
  const subscriptionId = subscription?.id ?? null;

  const needsUpdate =
    plan !== cachedPlan ||
    customerId !== (profile?.stripe_customer_id ?? null) ||
    subscriptionId !== (profile?.stripe_subscription_id ?? null);

  if (needsUpdate) {
    await setProfileSubscription(userId, plan, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
    });
  }

  return plan;
}
