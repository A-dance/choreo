import { describe, expect, it } from "vitest";
import { DEMO_ACCOUNT_EMAIL, getSignUpPasswordIssue } from "@/lib/passwordPolicy";

describe("passwordPolicy", () => {
  it("exposes demo account email constant", () => {
    expect(DEMO_ACCOUNT_EMAIL).toBe("demo@bamiri.share");
  });

  it("rejects short passwords", () => {
    expect(getSignUpPasswordIssue("Ab1")).toBe("length");
  });

  it("requires upper and lower case", () => {
    expect(getSignUpPasswordIssue("alllower1")).toBe("case");
    expect(getSignUpPasswordIssue("ALLUPPER1")).toBe("case");
  });

  it("accepts valid passwords", () => {
    expect(getSignUpPasswordIssue("ValidPass1")).toBeNull();
  });
});
