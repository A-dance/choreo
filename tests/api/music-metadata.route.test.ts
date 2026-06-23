import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/music-metadata/route";

/** Route Handler 統合テスト: リクエスト → レスポンス（外部 API は叩かない） */
describe("GET /api/music-metadata", () => {
  it("returns 400 when url query is missing", async () => {
    const res = await GET(new Request("http://localhost/api/music-metadata"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "missing_url" });
  });

  it("returns 400 for unparseable music link", async () => {
    const res = await GET(
      new Request("http://localhost/api/music-metadata?url=not-a-valid-link"),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "invalid_url" });
  });
});
