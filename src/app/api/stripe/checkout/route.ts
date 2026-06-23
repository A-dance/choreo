import { NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/stripeAuth";
import { fetchStripeProfile, setProfileSubscription } from "@/lib/stripeProfile";
import { syncProfilePlanFromStripe } from "@/lib/stripeSync";
import {
  getStripe,
  getStripeAppOrigin,
  getStripeConfigIssue,
  getStripeProPriceId,
} from "@/lib/stripeServer";

async function resolveCheckoutCustomerId(
  stripe: NonNullable<ReturnType<typeof getStripe>>,
  userId: string,
  email: string | null | undefined,
  profileCustomerId: string | null,
): Promise<string> {
  const candidates: string[] = [];
  const seen = new Set<string>();
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
    /* ignore */
  }

  push(profileCustomerId);

  for (const customerId of candidates) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if ("deleted" in customer && customer.deleted) continue;
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 1,
      });
      if (subs.data[0]) return customer.id;
    } catch {
      /* try next */
    }
  }

  for (const customerId of candidates) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if ("deleted" in customer && customer.deleted) continue;
      return customer.id;
    } catch {
      /* try next */
    }
  }

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { supabase_user_id: userId },
  });
  return customer.id;
}

export async function POST(request: Request) {
  const configIssue = getStripeConfigIssue();
  if (configIssue) {
    return NextResponse.json({ error: configIssue }, { status: 503 });
  }

  const user = await getUserFromAuthHeader(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();
  const priceId = getStripeProPriceId();
  if (!stripe || !priceId) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const profile = await fetchStripeProfile(user.id);
  const origin = getStripeAppOrigin(request);

  await syncProfilePlanFromStripe(user.id, user.email);

  const refreshed = await fetchStripeProfile(user.id);
  let customerId = refreshed?.stripe_customer_id ?? profile?.stripe_customer_id ?? null;

  if (!customerId) {
    customerId = await resolveCheckoutCustomerId(stripe, user.id, user.email, null);
    await setProfileSubscription(user.id, refreshed?.plan === "pro" ? "pro" : "free", {
      stripeCustomerId: customerId,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/mypage?checkout=success`,
    cancel_url: `${origin}/mypage?checkout=cancel`,
    metadata: { supabase_user_id: user.id },
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    return NextResponse.json({ error: "checkout_session_failed" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
