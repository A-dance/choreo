import { NextResponse } from "next/server";

/** API エラーコード（snake_case で統一） */
export const ApiError = {
  NOT_CONFIGURED: "not_configured",
  INVALID_BODY: "invalid_body",
  INVALID_WORKSPACE: "invalid_workspace",
  INVALID_PAYLOAD: "invalid_payload",
  INVALID_MANIFEST: "invalid_manifest",
  INVALID_URL: "invalid_url",
  INVALID_SIGNATURE: "invalid_signature",
  MISSING_STATE: "missing_state",
  MISSING_MANIFEST: "missing_manifest",
  MISSING_ID: "missing_id",
  MISSING_URL: "missing_url",
  MISSING_SHARE_ID_OR_MEDIA_ID: "missing_share_id_or_media_id",
  MISSING_SIGNATURE: "missing_signature",
  NOT_FOUND: "not_found",
  SHARE_NOT_FOUND: "share_not_found",
  UNAUTHORIZED: "unauthorized",
  EMPTY_QUESTION: "empty_question",
  CONVERSATION_TOO_LONG: "conversation_too_long",
  EMPTY_RESPONSE: "empty_response",
  STRIPE_NOT_CONFIGURED: "stripe_not_configured",
  WEBHOOK_NOT_CONFIGURED: "webhook_not_configured",
  NO_STRIPE_CUSTOMER: "no_stripe_customer",
  SIGNED_URL_FAILED: "signed_url_failed",
  SERVER_ERROR: "server_error",
} as const;

export type ApiErrorCode = (typeof ApiError)[keyof typeof ApiError];

export function apiErrorResponse(
  error: ApiErrorCode | string,
  status: number,
): NextResponse<{ error: string }> {
  return NextResponse.json({ error }, { status });
}
