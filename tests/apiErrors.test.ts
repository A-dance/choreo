import { describe, expect, it } from "vitest";
import { ApiError, apiErrorResponse } from "@/lib/apiErrors";

describe("apiErrors", () => {
  it("returns JSON body with snake_case error code", async () => {
    const res = apiErrorResponse(ApiError.INVALID_BODY, 400);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "invalid_body" });
  });

  it("accepts custom string codes", async () => {
    const res = apiErrorResponse("custom_reason", 422);
    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toEqual({ error: "custom_reason" });
  });
});
