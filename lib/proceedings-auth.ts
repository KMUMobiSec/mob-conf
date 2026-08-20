import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

const COOKIE_PREFIX = "proceedings-auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Per-year cookie name so authenticating one year does not unlock another. */
function cookieName(year: number): string {
  return `${COOKIE_PREFIX}-${year}`;
}

/**
 * Password for a given year. Prefers the year-specific
 * `PROCEEDINGS_PASSWORD_<year>` and falls back to the shared
 * `PROCEEDINGS_PASSWORD`.
 */
function getPassword(year: number): string {
  return process.env[`PROCEEDINGS_PASSWORD_${year}`] || process.env.PROCEEDINGS_PASSWORD || "";
}

/** Cookie-signing secret for a year; defaults to that year's password. */
function getSecret(year: number): string {
  return (
    process.env[`PROCEEDINGS_SECRET_${year}`] || process.env.PROCEEDINGS_SECRET || getPassword(year)
  );
}

export function getProceedingsPassword(year: number): string {
  return getPassword(year);
}

export function getProceedingsAuthCookie(request: NextRequest, year: number): string {
  return request.cookies.get(cookieName(year))?.value ?? "";
}

export function createProceedingsToken(year: number): string {
  const secret = getSecret(year);
  if (!secret) return "";
  const expiry = String(Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE);
  const signature = createHmac("sha256", secret).update(expiry).digest("base64url");
  return `${expiry}.${signature}`;
}

export function verifyProceedingsToken(token: string, year: number): boolean {
  const secret = getSecret(year);
  if (!secret || !token) return false;
  const [expiryStr, signature] = token.split(".");
  if (!expiryStr || !signature) return false;
  const expiry = Number.parseInt(expiryStr, 10);
  if (Number.isNaN(expiry) || expiry < Math.floor(Date.now() / 1000)) return false;
  const expected = createHmac("sha256", secret).update(expiryStr).digest("base64url");
  try {
    return timingSafeEqual(Buffer.from(signature, "base64url"), Buffer.from(expected, "base64url"));
  } catch {
    return false;
  }
}

export function isProceedingsPasswordRequired(year: number): boolean {
  return !!getPassword(year);
}

export function isProceedingsAuthenticated(request: NextRequest, year: number): boolean {
  if (!isProceedingsPasswordRequired(year)) return true;
  const cookie = getProceedingsAuthCookie(request, year);
  return verifyProceedingsToken(cookie, year);
}

export function getProceedingsCookieName(year: number): string {
  return cookieName(year);
}

export const PROCEEDINGS_AUTH_MAX_AGE = COOKIE_MAX_AGE;
