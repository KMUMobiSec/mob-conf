/**
 * Shared, pure builder for the banquet venue hero image used by both the banquet
 * invitation and confirmation emails. Kept separate so the copy and fallback can
 * be unit-tested without importing server-only code. Emdash-free.
 *
 * The image URL is resolved by the caller (see lib/email/assets.ts
 * banquetVenueImageUrl), which self-hosts the photo and only provides it when the
 * configured venue matches the photo, so the hero never shows the wrong building.
 */
import { escapeHtml } from "./winner-notification.templates";

const BRAND_DEEP = "#3a5a1e"; // darker brand green, used as the image fallback backdrop
const MUTED = "#646b72";

/**
 * A full-width venue hero. Returns an empty string when there is no image to show
 * (no base URL, or the venue has no matching photo). When an image is present and
 * it loads, it fills the card; if the client blocks or fails to fetch it, the
 * branded backdrop shows the alt text, and the caption row underneath always
 * renders the venue and date as plain text, so the information is never lost.
 */
export function renderBanquetVenueHero({
  imageUrl,
  venue,
  date,
}: {
  imageUrl?: string;
  venue: string;
  date: string;
}): string {
  if (!imageUrl) return "";
  const src = escapeHtml(imageUrl);
  const alt = escapeHtml(`${venue}, the banquet venue`);
  const caption = escapeHtml(`${venue} on ${date}`);
  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;">
        <tr>
          <td align="center" style="background:${BRAND_DEEP};border-radius:10px;min-height:120px;padding:0;mso-line-height-rule:exactly;">
            <img src="${src}" alt="${alt}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:10px;color:#ffffff;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;line-height:120px;text-align:center;" />
          </td>
        </tr>
        <tr>
          <td style="padding:10px 4px 0;font-size:12px;line-height:1.4;color:${MUTED};text-align:center;">${caption}</td>
        </tr>
      </table>`;
}
