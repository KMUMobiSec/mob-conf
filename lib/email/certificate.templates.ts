import { escapeHtml } from "./winner-notification.templates";

const BRAND = "#1F377E";
const INK = "#121212";
const MUTED = "#646b72";
const BORDER = "#e3e6e8";
const SURFACE = "#ffffff";
const CANVAS = "#f4f5f6";
const P = `margin:0 0 16px;font-size:15px;line-height:1.55;`;

export interface CertificateEmailInput {
  year: number;
  name: string;
  /** Role acknowledged on the certificate (e.g. "Author", "Participant", "Keynote Speaker"). */
  role: string;
  logoUrl?: string;
}

export function certificateEmailSubject(year: number): string {
  return `Your MOBISEC ${year} Certificate of Appreciation`;
}

export function renderCertificateEmailHtml({
  year,
  name,
  role,
  logoUrl,
}: CertificateEmailInput): string {
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
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">MOBISEC ${year} &middot; Certificate</p>
            <h1 style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:650;">Certificate of Appreciation</h1>
          </td>
        </tr>
      </table>
    </div>
    <div style="background:${SURFACE};border:1px solid ${BORDER};border-top:none;border-radius:0 0 10px 10px;padding:28px;">
      <p style="${P}">Dear ${escapeHtml(name)},</p>
      <p style="${P}">Thank you for your participation as <strong>${escapeHtml(role)}</strong> in the ${year} KIISC International Conference on Mobile Internet Security (MOBISEC ${year}). Please find your Certificate of Appreciation attached to this email as a PDF.</p>
      <p style="${P}">With appreciation,<br /><strong>The MOBISEC ${year} Organizing Committee</strong></p>
    </div>
    <p style="margin:16px 4px 0;font-size:12px;color:${MUTED};">MOBISEC ${year} &middot; KIISC International Conference</p>
  </div>
</body>
</html>`;
}
