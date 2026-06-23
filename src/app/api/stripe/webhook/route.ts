import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  fetchProfileByStripeCustomerId,
  setProfileSubscription,
} from "@/lib/stripeProfile";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripeServer";

export const runtime = "nodejs";

function subscriptionIsPro(subscription: Stripe.Subscription): boolean {
  return subscription.status === "active" || subscription.status === "trialing";
}

async function resolveUserId(
  metadata: Stripe.Metadata | null | undefined,
  customerId: string | null | undefined,
): Promise<string | null> {
  const fromMeta = metadata?.supabase_user_id?.trim();
  if (fromMeta) return fromMeta;
  if (!customerId) return null;
  const profile = await fetchProfileByStripeCustomerId(customerId);
  return profile?.id ?? null;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = await resolveUserId(
    session.metadata,
    typeof session.customer === "string" ? session.customer : session.customer?.id,
  );
  if (!userId) return;

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer?.id ?? null);
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription?.id ?? null);

  await setProfileSubscription(userId, "pro", {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
  });
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = await resolveUserId(
    subscription.metadata,
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id,
  );
  if (!userId) return;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : (subscription.customer?.id ?? null);

  if (subscriptionIsPro(subscription)) {
    await setProfileSubscription(userId, "pro", {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
    });
    return;
  }

  await setProfileSubscription(userId, "free", {
    stripeCustomerId: customerId,
    stripeSubscriptionId: null,
  });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = getStripeWebhookSecret();
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionChange(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionChange(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
