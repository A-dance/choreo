import { describe, expect, it } from "vitest";
import {
  FREE_PROJECT_LIMIT,
  canCreateProject,
  normalizePlan,
  planLabel,
} from "@/lib/subscription";

describe("subscription", () => {
  it("normalizes plan to free or pro", () => {
    expect(normalizePlan("pro")).toBe("pro");
    expect(normalizePlan("free")).toBe("free");
    expect(normalizePlan("unknown")).toBe("free");
  });

  it("limits free plan projects", () => {
    expect(FREE_PROJECT_LIMIT).toBe(1);
    expect(canCreateProject(0, "free")).toBe(true);
    expect(canCreateProject(1, "free")).toBe(false);
    expect(canCreateProject(99, "pro")).toBe(true);
  });

  it("labels plans per language", () => {
    expect(planLabel("pro", "ja")).toBe("Pro");
    expect(planLabel("free", "en")).toBe("Free");
    expect(planLabel("free", "ja")).toBe("無料");
  });
});
