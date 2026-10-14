import "server-only";

import { publicBaseUrl } from "@/lib/routes/base-url";

/**
 * Absolute URL to the small, email-optimized brand logo (367x276, ~29KB), or
 * undefined when no public base URL is configured. Email clients downscale this
 * to the ~30px header chip.
 */
export function emailLogoUrl(): string | undefined {
  const baseUrl = publicBaseUrl();
  if (!baseUrl) return undefined;
  return `${baseUrl.replace(/\/$/, "")}/assets/email/mobisec-logo-email.png`;
}

const PLAZA_VENUE_IMAGE = "THE_PLAZA.jpg";

/**
 * Absolute URL to the self-hosted banquet venue photo for the year, or undefined
 * when we have no matching image (or no base URL). Self-hosting on the verified
 * domain avoids the external hotlink being blocked by email image proxies.
 *
 * We only ship a photo of The Plaza Hotel, so the hero is shown only when the
 * configured venue is the Plaza. If an admin sets a different venue, no photo is
 * shown (the body still names the venue in text) rather than showing the wrong
 * building under that venue's name.
 */
export function banquetVenueImageUrl(year: number, venue: string): string | undefined {
  const baseUrl = publicBaseUrl();
  if (!baseUrl) return undefined;
  if (!/\bplaza\b/i.test(venue)) return undefined;
  return `${baseUrl.replace(/\/$/, "")}/assets/venue/${year}/${PLAZA_VENUE_IMAGE}`;
}
