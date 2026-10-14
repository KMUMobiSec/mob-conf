import { escapeHtml } from "./winner-notification.templates";

const BRAND = "#1F377E";
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
  // Green "e" mark on a white chip — renders cleanly on the brand-green header
  // (the white logo asset is desaturated and would muddy on green). Falls back to
  // text-only branding when no logo URL is available or images are blocked.
  const logoChip = logoUrl
    ? `<td style="width:56px;vertical-align:middle;">
            <div style="width:44px;height:44px;background:#ffffff;border-radius:10px;text-align:center;mso-line-height-rule:exactly;line-height:44px;">
              <img src="${escapeHtml(logoUrl)}" width="30" height="30" alt="MOBISEC" style="display:inline-block;vertical-align:middle;border:0;" />
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
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">MOBISEC ${year} &middot; Conference Check-in</p>
            <h1 style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:650;">${escapeHtml(heading)}</h1>
          </td>
        </tr>
      </table>
    </div>
    <div style="background:${SURFACE};border:1px solid ${BORDER};border-top:none;border-radius:0 0 10px 10px;padding:28px;">
      ${bodyHtml}
    </div>
    <p style="margin:16px 4px 0;font-size:12px;color:${MUTED};">MOBISEC ${year} &middot; KIISC International Conference</p>
  </div>
</body>
</html>`;
}

export interface RegistrationPassEmailInput {
  year: number;
  name: string;
  venue: string;
  dates: string;
  passUrl: string;
  logoUrl?: string;
}

export function registrationPassSubject(year: number): string {
  return `Your MOBISEC ${year} check-in QR pass`;
}

export function renderRegistrationPassHtml(input: RegistrationPassEmailInput): string {
  const url = escapeHtml(input.passUrl);
  const body = `
      <p style="${P}">Dear ${escapeHtml(input.name)},</p>
      <p style="${P}">You're all set for <strong>MOBISEC ${input.year}</strong>. Use your personal QR pass below to check in quickly when you arrive.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border:1px solid ${BORDER};border-radius:10px;background:${PANEL};">
        <tr>
          <td style="padding:14px 18px;border-bottom:1px solid ${BORDER};">
            <p style="${LABEL}">Dates</p>
            <p style="${VALUE}">${escapeHtml(input.dates)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 18px;">
            <p style="${LABEL}">Venue</p>
            <p style="${VALUE}">${escapeHtml(input.venue)}</p>
          </td>
        </tr>
      </table>

      <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 14px;">
        <tr>
          <td align="center" style="border-radius:8px;background:${BRAND};">
            <a href="${url}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:650;color:#ffffff;text-decoration:none;border-radius:8px;">View your QR pass</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 26px;font-size:13px;line-height:1.5;color:${MUTED};text-align:center;">
        Button not working? Open this link:<br />
        <a href="${url}" style="color:${BRAND};word-break:break-all;">${url}</a>
      </p>

      <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:${INK};font-weight:700;">At the registration desk</p>
      <ol style="margin:0 0 20px;padding-left:20px;font-size:15px;line-height:1.7;color:${INK};">
        <li>Open your QR pass on your phone.</li>
        <li>Show it to our team at the desk.</li>
        <li>We'll scan it to check you in.</li>
      </ol>

      <p style="${P}">Please keep this email so you can reopen your pass anytime.</p>
      <p style="margin:0;font-size:15px;line-height:1.55;">Warm regards,<br />The MOBISEC ${input.year} Organizing Committee</p>`;
  return shell({
    year: input.year,
    heading: "Your check-in QR pass",
    bodyHtml: body,
    logoUrl: input.logoUrl,
  });
}

export interface CheckInWelcomeEmailInput {
  year: number;
  name: string;
  logoUrl?: string;
  /** Deep link to the campus "Getting Around" wayfinder section (omitted if no base URL). */
  gettingAroundUrl?: string;
}

export function checkInWelcomeSubject(year: number): string {
  return `Welcome to MOBISEC ${year}`;
}

export function renderCheckInWelcomeHtml(input: CheckInWelcomeEmailInput): string {
  const locationBlock = input.gettingAroundUrl
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px;border:1px solid ${BORDER};border-radius:10px;background:${PANEL};">
        <tr>
          <td style="padding:16px 18px;">
            <p style="${LABEL}">Getting around</p>
            <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${INK};">First time on campus? Follow the step-by-step walk from Kookmin University's Main Gate to the MOBISEC venue buildings.</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border-radius:8px;background:${BRAND};">
                  <a href="${escapeHtml(input.gettingAroundUrl)}" style="display:inline-block;padding:11px 22px;font-size:14px;font-weight:650;color:#ffffff;text-decoration:none;border-radius:8px;">View the campus guide</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`
    : "";
  const body = `
      <p style="${P}">Dear ${escapeHtml(input.name)},</p>
      <p style="${P}"><strong>Welcome to MOBISEC ${input.year}</strong>. Your check-in is complete, and we're glad to have you with us.</p>
      <p style="${P}">We hope you have a productive and inspiring conference experience.</p>
      ${locationBlock}
      <p style="margin:0;font-size:15px;line-height:1.55;">Warm regards,<br />The MOBISEC ${input.year} Organizing Committee</p>`;
  return shell({
    year: input.year,
    heading: `Welcome to MOBISEC ${input.year}`,
    bodyHtml: body,
    logoUrl: input.logoUrl,
  });
}
