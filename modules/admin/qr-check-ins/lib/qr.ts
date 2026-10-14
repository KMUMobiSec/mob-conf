import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const PREFIX = "mobisec-checkin";
const VERSION = "v1";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface CreateQrPayloadInput {
  id: string;
  qrNonce: string;
  secret: string;
}

export type VerifyQrPayloadResult =
  | { ok: true; id: string; qrNonce: string }
  | { ok: false; reason: "malformed" | "invalid-signature" };

export function generateQrNonce(): string {
  return randomBytes(24).toString("base64url");
}

export function createQrPayload(input: CreateQrPayloadInput): string {
  const signature = sign(input.id, input.qrNonce, input.secret);
  return [PREFIX, VERSION, input.id, input.qrNonce, signature].join(":");
}

export function verifyQrPayload(payload: string, secret: string): VerifyQrPayloadResult {
  const parts = payload.split(":");
  if (parts.length !== 5) return { ok: false, reason: "malformed" };

  const [prefix, version, id, qrNonce, signature] = parts;
  if (prefix !== PREFIX || version !== VERSION || !UUID_RE.test(id) || !qrNonce || !signature) {
    return { ok: false, reason: "malformed" };
  }

  const expected = sign(id, qrNonce, secret);
  if (!safeEqual(signature, expected)) return { ok: false, reason: "invalid-signature" };

  return { ok: true, id, qrNonce };
}

function sign(id: string, qrNonce: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${PREFIX}:${VERSION}:${id}:${qrNonce}`)
    .digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}
