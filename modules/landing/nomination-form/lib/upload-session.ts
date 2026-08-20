import { createHmac, timingSafeEqual } from "node:crypto";

import type { ValidYear } from "@/constants/config";
import type { DocFieldKey } from "./constants";

export const UPLOAD_SESSION_TTL_MS = 2 * 60 * 60 * 1000;

export interface UploadSessionFile {
  key: DocFieldKey;
  index: number;
  path: string;
  name: string;
  size: number;
  type?: string;
}

export interface UploadSessionPayload {
  version: 1;
  nominationId: string;
  year: ValidYear;
  expiresAt: number;
  files: UploadSessionFile[];
}

export function signUploadSession(payload: UploadSessionPayload, secret: string): string {
  const body = encode(JSON.stringify(payload));
  const signature = sign(body, secret);
  return `${body}.${signature}`;
}

export function parseUploadSession(
  token: string,
  secret: string,
  now = Date.now(),
): UploadSessionPayload | null {
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) return null;

  const expected = sign(body, secret);
  if (!safeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(decode(body)) as UploadSessionPayload;
    if (!isUploadSessionPayload(payload)) return null;
    if (payload.expiresAt < now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createUploadSessionPayload({
  nominationId,
  year,
  files,
  now = Date.now(),
}: {
  nominationId: string;
  year: ValidYear;
  files: UploadSessionFile[];
  now?: number;
}): UploadSessionPayload {
  return {
    version: 1,
    nominationId,
    year,
    expiresAt: now + UPLOAD_SESSION_TTL_MS,
    files,
  };
}

export function getUploadSessionSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is required for nomination upload sessions");
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

function isUploadSessionPayload(value: unknown): value is UploadSessionPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as UploadSessionPayload;
  return (
    candidate.version === 1 &&
    typeof candidate.nominationId === "string" &&
    typeof candidate.year === "number" &&
    typeof candidate.expiresAt === "number" &&
    Array.isArray(candidate.files) &&
    candidate.files.every(isUploadSessionFile)
  );
}

function isUploadSessionFile(value: unknown): value is UploadSessionFile {
  if (!value || typeof value !== "object") return false;
  const candidate = value as UploadSessionFile;
  return (
    typeof candidate.key === "string" &&
    typeof candidate.index === "number" &&
    typeof candidate.path === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.size === "number" &&
    (candidate.type === undefined || typeof candidate.type === "string")
  );
}
