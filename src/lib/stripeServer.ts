import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeSecretKey(): string {
  return process.env.STRIPE_SECRET_KEY?.trim() ?? "";
}

export function getStripeProPriceId(): string {
  return process.env.STRIPE_PRO_PRICE_ID?.trim() ?? "";
}

export function getStripeWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
}

export function isStripeServerConfigured(): boolean {
  return Boolean(getStripeSecretKey() && getStripeProPriceId());
}

export type StripeConfigIssue = "missing_secret" | "missing_price";

export function getStripeConfigIssue(): StripeConfigIssue | null {
  if (!getStripeSecretKey()) return "missing_secret";
  if (!getStripeProPriceId()) return "missing_price";
  return null;
}

export function isStripeTestMode(): boolean {
  const key = getStripeSecretKey();
  return key.startsWith("sk_test_");
}

export function getStripe(): Stripe | null {
  if (stripeClient) return stripeClient;
  const secretKey = getStripeSecretKey();
  if (!secretKey) return null;
  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

/** Checkout / Portal の success・cancel URL 用 */
export function getStripeAppOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}
