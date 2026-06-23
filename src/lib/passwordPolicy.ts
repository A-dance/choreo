export const DEMO_ACCOUNT_EMAIL = "demo@bamiri.share";

/**
 * 新規登録時のパスワード強度チェック（デモアカウントは事前作成のため対象外）。
 * 戻り値: null = OK / "length" | "case" = バリデーション失敗理由
 */
export function getSignUpPasswordIssue(password: string): "length" | "case" | null {
  if (password.length < 8) return "length";
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) return "case";
  return null;
}
