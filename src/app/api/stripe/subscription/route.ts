import { NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/stripeAuth";
import { fetchStripeProfile } from "@/lib/stripeProfile";
import { syncProfilePlanFromStripe } from "@/lib/stripeSync";
import { buildSubscriptionDetails } from "@/lib/stripeSubscriptionInfo";
import { getStripe, isStripeServerConfigured } from "@/lib/stripeServer";

export async function GET(request: Request) {
  const user = await getUserFromAuthHeader(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profilePlan = await syncProfilePlanFromStripe(user.id, user.email);
  const profile = await fetchStripeProfile(user.id);

  if (!isStripeServerConfigured() || !profile?.stripe_subscription_id) {
    return NextResponse.json(
      buildSubscriptionDetails(profilePlan, null),
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(buildSubscriptionDetails(profilePlan, null));
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(
      profile.stripe_subscription_id,
    );
    return NextResponse.json(
      buildSubscriptionDetails(profilePlan, subscription),
    );
  } catch {
    return NextResponse.json(buildSubscriptionDetails(profilePlan, null));
  }
}
