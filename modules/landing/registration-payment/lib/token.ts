import { createHmac, timingSafeEqual } from "node:crypto";

import type { ValidYear } from "@/constants/config";

/** The magic-link step must be completed within this window of requesting it. */
export const REGISTRATION_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

export interface RegistrationTokenPayload {
  version: 1;
  email: string;
  year: ValidYear;
  expiresAt: number;
}

export function signRegistrationToken(payload: RegistrationTokenPayload, secret: string): string {
  const body = encode(JSON.stringify(payload));
  const signature = sign(body, secret);
  return `${body}.${signature}`;
}

export function parseRegistrationToken(
  token: string,
  secret: string,
  now = Date.now(),
): RegistrationTokenPayload | null {
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) return null;

  const expected = sign(body, secret);
  if (!safeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(decode(body)) as RegistrationTokenPayload;
    if (!isRegistrationTokenPayload(payload)) return null;
    if (payload.expiresAt < now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createRegistrationTokenPayload({
  email,
  year,
  now = Date.now(),
}: {
  email: string;
  year: ValidYear;
  now?: number;
}): RegistrationTokenPayload {
  return {
    version: 1,
    email,
    year,
    expiresAt: now + REGISTRATION_TOKEN_TTL_MS,
  };
}

export function getRegistrationTokenSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is required for registration tokens");
  return secret;
}

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function isRegistrationTokenPayload(value: unknown): value is RegistrationTokenPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as RegistrationTokenPayload;
  return (
    candidate.version === 1 &&
    typeof candidate.email === "string" &&
    candidate.email.length > 0 &&
    typeof candidate.year === "number" &&
    typeof candidate.expiresAt === "number"
  );
}
