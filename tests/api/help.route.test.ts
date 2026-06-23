import { afterEach, describe, expect, it, vi } from "vitest";

describe("POST /api/help", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 503 when GEMINI_API_KEY is not set", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const { POST } = await import("@/app/api/help/route");
    const res = await POST(
      new Request("http://localhost/api/help", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", text: "hello" }] }),
      }),
    );
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ error: "not_configured" });
  });

  it("returns 400 when messages are empty", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const { POST } = await import("@/app/api/help/route");
    const res = await POST(
      new Request("http://localhost/api/help", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "empty_question" });
  });
});
