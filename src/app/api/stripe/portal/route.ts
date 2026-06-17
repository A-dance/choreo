import { NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/stripeAuth";
import { fetchStripeProfile } from "@/lib/stripeProfile";
import {
  getStripe,
  getStripeAppOrigin,
  isStripeServerConfigured,
} from "@/lib/stripeServer";

export async function POST(request: Request) {
  if (!isStripeServerConfigured()) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const user = await getUserFromAuthHeader(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profile = await fetchStripeProfile(user.id);
  const customerId = profile?.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json({ error: "no_stripe_customer" }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const origin = getStripeAppOrigin(request);
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/mypage?portal=return`,
  });

  return NextResponse.json({ url: session.url });
}
