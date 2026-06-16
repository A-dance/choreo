export type SubscriptionPlan = "free" | "pro";

export const FREE_PROJECT_LIMIT = 1;
export const PRO_MONTHLY_PRICE_YEN = 500;

export function normalizePlan(value: unknown): SubscriptionPlan {
  return value === "pro" ? "pro" : "free";
}

export function canCreateProject(
  projectCount: number,
  plan: SubscriptionPlan,
): boolean {
  if (plan === "pro") return true;
  return projectCount < FREE_PROJECT_LIMIT;
}

export function planLabel(plan: SubscriptionPlan, language: "ja" | "en"): string {
  if (plan === "pro") return language === "ja" ? "Pro" : "Pro";
  return language === "ja" ? "無料" : "Free";
}
