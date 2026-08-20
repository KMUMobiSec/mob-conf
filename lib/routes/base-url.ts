/**
 * Absolute public base URL for building links in server-rendered email and pages.
 *
 * Always sourced from NEXT_PUBLIC_BASE_URL — no fallback to BETTER_AUTH_URL or any
 * other var, so a dev/localhost origin can never leak into production links.
 *
 * NOTE: NEXT_PUBLIC_* values are inlined at BUILD time, so NEXT_PUBLIC_BASE_URL must be
 * set to the production URL in the deploy's BUILD environment (not only at runtime).
 */
export function publicBaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_BASE_URL || undefined;
}

export function requirePublicBaseUrl(): string {
  const baseUrl = publicBaseUrl();
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL is required to build absolute email links.");
  }
  return baseUrl;
}
