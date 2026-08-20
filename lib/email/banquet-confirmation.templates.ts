/**
 * Pure (no side-effect) builders for the banquet RSVP confirmation email. Kept
 * separate from the Resend-sending module so the copy and HTML escaping can be
 * unit-tested without importing server-only code.
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
const PANEL = "#fafbfb";
const P = `margin:0 0 16px;font-size:15px;line-height:1.55;`;
const LABEL = `margin:0 0 2px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};font-weight:600;`;
const VALUE = `margin:0;font-size:15px;color:${INK};font-weight:600;`;

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
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">EBISION ${year} &middot; Banquet RSVP</p>
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

export interface BanquetConfirmationEmailInput {
  year: number;
  name: string;
  attending: boolean;
  /** Resolved banquet date label (already defaulted by the caller). */
  banquetDate: string;
  /** Resolved banquet venue label (already defaulted by the caller). */
  banquetVenue: string;
  /** Display labels for the selected allergens. */
  allergens: string[];
  allergenOther?: string;
  message?: string;
  logoUrl?: string;
  /** Absolute URL to the venue photo, or omitted to skip the hero. */
  venueImageUrl?: string;
}

export function banquetConfirmationSubject(year: number): string {
  return `Your EBISION ${year} banquet RSVP has been received`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:12px 16px;border-top:1px solid ${BORDER};">
      <p style="${LABEL}">${escapeHtml(label)}</p>
      <p style="${VALUE}">${escapeHtml(value)}</p>
    </td>
  </tr>`;
}

export function renderBanquetConfirmationHtml(input: BanquetConfirmationEmailInput): string {
  const rows: string[] = [detailRow("Attending", input.attending ? "Yes" : "No")];

  if (input.attending) {
    rows.push(
      detailRow(
        "Allergens and dietary needs",
        input.allergens.length > 0 ? input.allergens.join(", ") : "None specified",
      ),
    );
    if (input.allergenOther?.trim()) {
      rows.push(detailRow("Other dietary notes", input.allergenOther.trim()));
    }
    if (input.message?.trim()) {
      rows.push(detailRow("Your message", input.message.trim()));
    }
  }

  const intro = input.attending
    ? `Thank you. Your response for the <strong>EBISION ${input.year}</strong> banquet on ${escapeHtml(input.banquetDate)} at ${escapeHtml(input.banquetVenue)} has been recorded. We look forward to seeing you there.`
    : `Thank you for letting us know. We have recorded that you will not be attending the <strong>EBISION ${input.year}</strong> banquet on ${escapeHtml(input.banquetDate)} at ${escapeHtml(input.banquetVenue)}. We hope to see you at the symposium.`;

  const body = `
      <p style="${P}">Dear ${escapeHtml(input.name)},</p>
      <p style="${P}">${intro}</p>

      ${input.attending ? renderBanquetVenueHero({ imageUrl: input.venueImageUrl, venue: input.banquetVenue, date: input.banquetDate }) : ""}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border:1px solid ${BORDER};border-radius:10px;background:${PANEL};">
        ${rows.join("\n")}
      </table>

      <p style="${P}">If your plans change, reply to this email and we will update your RSVP.</p>
      <p style="${P}">Warm regards,<br />The EBISION ${input.year} Organizing Committee</p>`;

  return shell({
    year: input.year,
    heading: input.attending ? "Your RSVP is confirmed" : "Your response has been recorded",
    bodyHtml: body,
    logoUrl: input.logoUrl,
  });
}

export function renderBanquetConfirmationText(input: BanquetConfirmationEmailInput): string {
  const lines: string[] = [`Dear ${input.name},`, ""];

  if (input.attending) {
    lines.push(
      `Thank you. Your response for the EBISION ${input.year} banquet on ${input.banquetDate} at ${input.banquetVenue} has been recorded. We look forward to seeing you there.`,
      "",
      `Attending: Yes`,
      `Allergens and dietary needs: ${input.allergens.length > 0 ? input.allergens.join(", ") : "None specified"}`,
    );
    if (input.allergenOther?.trim())
      lines.push(`Other dietary notes: ${input.allergenOther.trim()}`);
    if (input.message?.trim()) lines.push(`Your message: ${input.message.trim()}`);
  } else {
    lines.push(
      `Thank you for letting us know. We have recorded that you will not be attending the EBISION ${input.year} banquet on ${input.banquetDate} at ${input.banquetVenue}. We hope to see you at the symposium.`,
      "",
      `Attending: No`,
    );
  }

  lines.push(
    "",
    "If your plans change, reply to this email and we will update your RSVP.",
    "",
    "Warm regards,",
    `The EBISION ${input.year} Organizing Committee`,
  );

  return lines.join("\n");
}
