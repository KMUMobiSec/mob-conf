/**
 * Pure (no side-effect) builders for the winner notification emails. Kept
 * separate from the Resend-sending module so the copy + HTML escaping can be
 * unit-tested without importing server-only code.
 */

const BRAND = "#1F377E"; // forest green
const INK = "#121212";
const MUTED = "#646b72";
const BORDER = "#e3e6e8";
const SURFACE = "#ffffff";
const CANVAS = "#f4f5f6";
const PANEL = "#fafbfb";

/** The MOBISEC award ceremony — a fixed event; only the year varies. */
const AWARD_CEREMONY = {
  /** Ceremony day (year is supplied per email). */
  monthDay: "July 9",
  venue: "The Plaza Hotel, Seoul",
  address: "119 Sogong-ro, Jung District, Seoul",
  url: "https://www.hoteltheplaza.com/en/",
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell({
  year,
  heading,
  bodyHtml,
}: {
  year: number;
  heading: string;
  bodyHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:${CANVAS};font-family:'IBM Plex Sans',-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK};">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="background:${BRAND};border-radius:10px 10px 0 0;padding:24px 28px;">
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">MOBISEC ${year} · Awards Committee</p>
      <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:650;">${escapeHtml(heading)}</h1>
    </div>
    <div style="background:${SURFACE};border:1px solid ${BORDER};border-top:none;border-radius:0 0 10px 10px;padding:28px;">
      ${bodyHtml}
    </div>
    <p style="margin:16px 4px 0;font-size:12px;color:${MUTED};">MOBISEC ${year} — KIISC International Conference</p>
  </div>
</body>
</html>`;
}

const P = `margin:0 0 16px;font-size:15px;line-height:1.55;`;
const LABEL = `margin:0 0 2px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};font-weight:600;`;
const VALUE = `margin:0;font-size:15px;color:${INK};font-weight:600;`;

/**
 * Awarding details panel + a link to the public Roll of Honors for the year.
 * The link is omitted (gracefully) when no base URL is configured.
 */
function awardingSectionHtml(year: number, rollOfHonorsUrl?: string): string {
  const url = rollOfHonorsUrl ? escapeHtml(rollOfHonorsUrl) : "";
  const venue = escapeHtml(AWARD_CEREMONY.venue);
  const address = escapeHtml(AWARD_CEREMONY.address);
  const hotelUrl = escapeHtml(AWARD_CEREMONY.url);

  const rollOfHonorsBlock = rollOfHonorsUrl
    ? `
      <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 12px;">
        <tr>
          <td align="center" style="border-radius:8px;background:${BRAND};">
            <a href="${url}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:650;color:#ffffff;text-decoration:none;border-radius:8px;">View the Roll of Honors</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 24px;font-size:13px;line-height:1.5;color:${MUTED};text-align:center;">
        Or open this link:<br />
        <a href="${url}" style="color:${BRAND};word-break:break-all;">${url}</a>
      </p>`
    : "";

  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border:1px solid ${BORDER};border-radius:10px;background:${PANEL};">
        <tr>
          <td style="padding:14px 18px;border-bottom:1px solid ${BORDER};">
            <p style="${LABEL}">Award ceremony</p>
            <p style="${VALUE}">${AWARD_CEREMONY.monthDay}, ${year}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 18px;">
            <p style="${LABEL}">Venue</p>
            <p style="${VALUE}"><a href="${hotelUrl}" style="color:${BRAND};text-decoration:none;">${venue}</a></p>
            <p style="margin:2px 0 0;font-size:14px;color:${MUTED};">${address}</p>
          </td>
        </tr>
      </table>
${rollOfHonorsBlock}`;
}

export interface WinnerEmailInput {
  year: number;
  awardName: string;
  nomineeName: string;
  /** Absolute URL to the year's public Roll of Honors page. Optional. */
  rollOfHonorsUrl?: string;
}

export function winnerCongratulationsSubject(year: number): string {
  return `Congratulations — you're an MOBISEC ${year} award winner!`;
}

export function renderWinnerCongratulationsHtml(input: WinnerEmailInput): string {
  const body = `
      <p style="${P}">Dear ${escapeHtml(input.nomineeName)},</p>
      <p style="${P}">Wonderful news! You have been selected as a <strong>winner of the ${escapeHtml(input.awardName)}</strong> at MOBISEC ${input.year}. Your work truly stood out to the committee.</p>
      <p style="${P}">Please join us at the award ceremony to celebrate — the details are below.</p>
${awardingSectionHtml(input.year, input.rollOfHonorsUrl)}
      <p style="${P}">Huge congratulations once again!</p>
      <p style="margin:0;font-size:15px;line-height:1.55;">— The MOBISEC ${input.year} Awards Committee</p>`;
  return shell({ year: input.year, heading: "Congratulations!", bodyHtml: body });
}

export interface NominatorWinnerEmailInput {
  year: number;
  awardName: string;
  nominatorName: string;
  nomineeName: string;
  /** Absolute URL to the year's public Roll of Honors page. Optional. */
  rollOfHonorsUrl?: string;
}

export function nominatorWinnerNoticeSubject(year: number): string {
  return `Great news about your MOBISEC ${year} nominee`;
}

export function renderNominatorWinnerNoticeHtml(input: NominatorWinnerEmailInput): string {
  const body = `
      <p style="${P}">Dear ${escapeHtml(input.nominatorName)},</p>
      <p style="${P}">The nominee you put forward — <strong>${escapeHtml(input.nomineeName)}</strong> — has been selected as a <strong>winner of the ${escapeHtml(input.awardName)}</strong> at MOBISEC ${input.year}!</p>
      <p style="${P}">Thank you for recognizing their work and taking the time to nominate them. Nominations like yours are what make these awards meaningful. We warmly invite you to join us at the award ceremony.</p>
${awardingSectionHtml(input.year, input.rollOfHonorsUrl)}
      <p style="margin:0;font-size:15px;line-height:1.55;">— The MOBISEC ${input.year} Awards Committee</p>`;
  return shell({ year: input.year, heading: "Great news about your nominee", bodyHtml: body });
}
