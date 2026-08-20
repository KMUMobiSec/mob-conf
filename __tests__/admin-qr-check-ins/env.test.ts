import { describe, expect, it } from "vitest";
import { requireCheckInQrSecret } from "@/modules/admin/qr-check-ins/lib/env";

describe("QR check-in environment", () => {
  it("returns the configured QR secret", () => {
    expect(requireCheckInQrSecret({ CHECK_IN_QR_SECRET: "secret" })).toBe("secret");
  });

  it("throws clearly when the QR secret is missing", () => {
    expect(() => requireCheckInQrSecret({})).toThrow(
      "CHECK_IN_QR_SECRET is required for QR check-ins.",
    );
  });
});
