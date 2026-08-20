import { describe, expect, it } from "vitest";
import { createQrPayload, verifyQrPayload } from "@/modules/admin/qr-check-ins/lib/qr";

const ID = "11111111-1111-4111-8111-111111111111";
const NONCE = "nonce-with-entropy";
const SECRET = "test-secret-with-enough-length";

describe("QR check-in payloads", () => {
  it("creates an opaque signed payload that verifies back to id and nonce", () => {
    const payload = createQrPayload({ id: ID, qrNonce: NONCE, secret: SECRET });

    expect(payload).toMatch(/^ebision-checkin:v1:/);
    expect(payload).not.toContain("@");

    expect(verifyQrPayload(payload, SECRET)).toEqual({
      ok: true,
      id: ID,
      qrNonce: NONCE,
    });
  });

  it("rejects tampered payloads", () => {
    const payload = createQrPayload({ id: ID, qrNonce: NONCE, secret: SECRET });
    const tampered = payload.replace(NONCE, "different-nonce");

    expect(verifyQrPayload(tampered, SECRET)).toEqual({
      ok: false,
      reason: "invalid-signature",
    });
  });

  it("rejects malformed payloads", () => {
    expect(verifyQrPayload("not-a-qr-payload", SECRET)).toEqual({
      ok: false,
      reason: "malformed",
    });
  });
});
