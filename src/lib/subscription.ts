export type SubscriptionPlan = "free" | "pro";

/** 無料プランで作成できる曲（プロジェクト）数の上限 */
export const FREE_PROJECT_LIMIT = 1;
export const PRO_MONTHLY_PRICE_YEN = 500;

export function normalizePlan(value: unknown): SubscriptionPlan {
  return value === "pro" ? "pro" : "free";
}

/** Pro は無制限、Free は FREE_PROJECT_LIMIT 未満なら新規作成可 */
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
