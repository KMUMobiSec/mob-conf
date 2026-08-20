import { describe, expect, it } from "vitest";

import {
  parseUploadSession,
  signUploadSession,
  type UploadSessionPayload,
} from "@/modules/landing/presentation-form/lib/upload-session";

const payload: UploadSessionPayload = {
  version: 2,
  presentationId: "8de7c499-dc4b-4d22-9347-989ee889b07a",
  year: 2026,
  expiresAt: 2_000_000,
  files: [
    {
      path: "2026/8de7c499-dc4b-4d22-9347-989ee889b07a/materials/0-deck.pdf",
      name: "deck.pdf",
      size: 1024,
      type: "application/pdf",
      kind: "material",
    },
    {
      path: "2026/8de7c499-dc4b-4d22-9347-989ee889b07a/video/talk.mp4",
      name: "talk.mp4",
      size: 4096,
      type: "video/mp4",
      kind: "video",
    },
  ],
};

describe("presentation upload session signing", () => {
  it("round-trips a valid upload session", () => {
    const token = signUploadSession(payload, "test-secret");

    expect(parseUploadSession(token, "test-secret", 1_999_999)).toEqual(payload);
  });

  it("rejects a tampered upload session", () => {
    const token = signUploadSession(payload, "test-secret");
    const tampered = `${token.slice(0, -2)}xx`;

    expect(parseUploadSession(tampered, "test-secret", 1_999_999)).toBeNull();
  });

  it("rejects a session signed with a different secret", () => {
    const token = signUploadSession(payload, "test-secret");

    expect(parseUploadSession(token, "other-secret", 1_999_999)).toBeNull();
  });

  it("rejects an expired upload session", () => {
    const token = signUploadSession(payload, "test-secret");

    expect(parseUploadSession(token, "test-secret", 2_000_001)).toBeNull();
  });
});
