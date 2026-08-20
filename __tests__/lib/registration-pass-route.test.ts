import { describe, expect, it } from "vitest";
import { registrationPassPath, registrationPassUrl } from "@/lib/routes/registration-pass";

describe("registration pass route helpers", () => {
  it("builds the public path from the registration id", () => {
    expect(registrationPassPath("abc-123")).toBe("/registration-pass/abc-123");
  });

  it("builds an absolute public URL without duplicate slashes", () => {
    expect(registrationPassUrl("https://ebision.example/", "abc-123")).toBe(
      "https://ebision.example/registration-pass/abc-123",
    );
  });
});
