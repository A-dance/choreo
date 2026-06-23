import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "@/lib/choreoUtils";
import { emptyProjectMedia } from "@/lib/shareUtils";

vi.mock("@/lib/supabaseAdmin", () => ({
  getSupabaseAdmin: vi.fn(() => null),
  isShareBackendConfigured: vi.fn(() => false),
  getShareMediaPublicUrl: vi.fn(() => null),
}));

describe("share Route Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 503 when share backend is not configured", async () => {
    const { GET } = await import("@/app/api/share/route");
    const res = await GET(new Request("http://localhost/api/share?id=missing"));
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ error: "not_configured" });
  });

  it("POST returns 503 when share backend is not configured", async () => {
    const { POST } = await import("@/app/api/share/route");
    const state = createInitialState();
    const res = await POST(
      new Request("http://localhost/api/share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ state, media: emptyProjectMedia() }),
      }),
    );
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ error: "not_configured" });
  });
});
