import { getSupabaseAdmin } from "./supabaseAdmin";
import { normalizePlan, type SubscriptionPlan } from "./subscription";

export interface StripeProfileRow {
  id: string;
  plan: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export async function fetchStripeProfile(
  userId: string,
): Promise<StripeProfileRow | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin
    .from("profiles")
    .select("id, plan, stripe_customer_id, stripe_subscription_id")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as StripeProfileRow;
}

export async function fetchProfileByStripeCustomerId(
  customerId: string,
): Promise<StripeProfileRow | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin
    .from("profiles")
    .select("id, plan, stripe_customer_id, stripe_subscription_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (error || !data) return null;
  return data as StripeProfileRow;
}

export async function setProfileSubscription(
  userId: string,
  plan: SubscriptionPlan,
  opts?: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
  },
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return false;
  const row: Record<string, unknown> = {
    plan: normalizePlan(plan),
    updated_at: new Date().toISOString(),
  };
  if (opts?.stripeCustomerId !== undefined) {
    row.stripe_customer_id = opts.stripeCustomerId;
  }
  if (opts?.stripeSubscriptionId !== undefined) {
    row.stripe_subscription_id = opts.stripeSubscriptionId;
  }
  const { error } = await admin.from("profiles").update(row).eq("id", userId);
  return !error;
}
