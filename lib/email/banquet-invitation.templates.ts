/**
 * Pure (no side-effect) builders for the banquet invitation email. Kept separate
 * from the Resend-sending module so the copy and HTML escaping can be unit-tested
 * without importing server-only code.
 *
 * Copy intentionally avoids emdashes (uses periods, commas, and &middot;).
 */
import { renderBanquetVenueHero } from "./banquet-venue.templates";
import { escapeHtml } from "./winner-notification.templates";

const BRAND = "#578429";
const INK = "#121212";
const MUTED = "#646b72";
const BORDER = "#e3e6e8";
const SURFACE = "#ffffff";
const CANVAS = "#f4f5f6";
const P = `margin:0 0 16px;font-size:15px;line-height:1.55;`;

function shell({
  year,
  heading,
  bodyHtml,
  logoUrl,
}: {
  year: number;
  heading: string;
  bodyHtml: string;
  logoUrl?: string;
}): string {
  const logoChip = logoUrl
    ? `<td style="width:56px;vertical-align:middle;">
            <div style="width:44px;height:44px;background:#ffffff;border-radius:10px;text-align:center;mso-line-height-rule:exactly;line-height:44px;">
              <img src="${escapeHtml(logoUrl)}" width="30" height="30" alt="EBISION" style="display:inline-block;vertical-align:middle;border:0;" />
            </div>
          </td>`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:${CANVAS};font-family:'IBM Plex Sans',-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK};">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="background:${BRAND};border-radius:10px 10px 0 0;padding:22px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${logoChip}
          <td style="vertical-align:middle;${logoUrl ? "padding-left:14px;" : ""}">
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">EBISION ${year} &middot; Banquet Invitation</p>
            <h1 style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:650;">${escapeHtml(heading)}</h1>
          </td>
        </tr>
      </table>
    </div>
    <div style="background:${SURFACE};border:1px solid ${BORDER};border-top:none;border-radius:0 0 10px 10px;padding:28px;">
      ${bodyHtml}
    </div>
    <p style="margin:16px 4px 0;font-size:12px;color:${MUTED};">EBISION ${year} &middot; IFIP WG 8.4 International Symposium</p>
  </div>
</body>
</html>`;
}

export interface BanquetInvitationEmailInput {
  year: number;
  name: string;
  /** Resolved banquet date label (already defaulted by the caller). */
  banquetDate: string;
  /** Resolved banquet venue label (already defaulted by the caller). */
  banquetVenue: string;
  /** Absolute survey link, prefilled with the recipient's email and name. */
  surveyUrl: string;
  logoUrl?: string;
  /** Absolute URL to the venue photo, or omitted to skip the hero. */
  venueImageUrl?: string;
}

export function banquetInvitationSubject(year: number): string {
  return `You are invited to the EBISION ${year} banquet`;
}

export function renderBanquetInvitationHtml(input: BanquetInvitationEmailInput): string {
  const greeting = input.name.trim() ? `Dear ${escapeHtml(input.name.trim())},` : "Hello,";
  const url = escapeHtml(input.surveyUrl);
  const body = `
      <p style="${P}">${greeting}</p>
      <p style="${P}">You are warmly invited to the <strong>EBISION ${input.year}</strong> banquet on ${escapeHtml(input.banquetDate)} at ${escapeHtml(input.banquetVenue)}. Please let us know whether you will join us so we can plan the seating and the menu.</p>

      ${renderBanquetVenueHero({ imageUrl: input.venueImageUrl, venue: input.banquetVenue, date: input.banquetDate })}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
        <tr>
          <td style="border-radius:8px;background:${BRAND};">
            <a href="${url}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">RSVP for the banquet</a>
          </td>
        </tr>
      </table>

      <p style="${P}">If the button does not work, copy and paste this link into your browser:<br /><a href="${url}" style="color:${BRAND};word-break:break-all;">${url}</a></p>
      <p style="${P}">Warm regards,<br />The EBISION ${input.year} Organizing Committee</p>`;

  return shell({
    year: input.year,
    heading: "Please RSVP for the banquet",
    bodyHtml: body,
    logoUrl: input.logoUrl,
  });
}

export function renderBanquetInvitationText(input: BanquetInvitationEmailInput): string {
  const greeting = input.name.trim() ? `Dear ${input.name.trim()},` : "Hello,";
  return [
    greeting,
    "",
    `You are warmly invited to the EBISION ${input.year} banquet on ${input.banquetDate} at ${input.banquetVenue}. Please let us know whether you will join us so we can plan the seating and the menu.`,
    "",
    "RSVP for the banquet using this link:",
    input.surveyUrl,
    "",
    "Warm regards,",
    `The EBISION ${input.year} Organizing Committee`,
  ].join("\n");
}
