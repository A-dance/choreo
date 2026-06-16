export const DEMO_ACCOUNT_EMAIL = "demo@bamiri.share";

/** Sign-up rules apply to new registrations only (demo account is pre-created). */
export function getSignUpPasswordIssue(password: string): "length" | "case" | null {
  if (password.length < 8) return "length";
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) return "case";
  return null;
}
