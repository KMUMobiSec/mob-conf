import { describe, expect, it } from "vitest";

import {
  parseUploadSession,
  signUploadSession,
  type UploadSessionPayload,
} from "@/modules/landing/nomination-form/lib/upload-session";

const payload: UploadSessionPayload = {
  version: 1,
  nominationId: "8de7c499-dc4b-4d22-9347-989ee889b07a",
  year: 2026,
  expiresAt: 2_000_000,
  files: [
    {
      key: "cv",
      index: 0,
      path: "2026/8de7c499-dc4b-4d22-9347-989ee889b07a/cv/1-cv.pdf",
      name: "cv.pdf",
      size: 1024,
      type: "application/pdf",
    },
  ],
};

describe("upload session signing", () => {
  it("round-trips a valid upload session", () => {
    const token = signUploadSession(payload, "test-secret");

    expect(parseUploadSession(token, "test-secret", 1_999_999)).toEqual(payload);
  });

  it("rejects a tampered upload session", () => {
    const token = signUploadSession(payload, "test-secret");
    const tampered = `${token.slice(0, -2)}xx`;

    expect(parseUploadSession(tampered, "test-secret", 1_999_999)).toBeNull();
  });

  it("rejects an expired upload session", () => {
    const token = signUploadSession(payload, "test-secret");

    expect(parseUploadSession(token, "test-secret", 2_000_001)).toBeNull();
  });
});
