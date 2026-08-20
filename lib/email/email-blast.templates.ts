import { escapeHtml } from "./winner-notification.templates";

// Shared brand tokens, matching the other EBISION transactional templates.
const BRAND = "#578429";
const INK = "#121212";
const MUTED = "#646b72";
const BORDER = "#e3e6e8";
const SURFACE = "#ffffff";
const CANVAS = "#f4f5f6";

export interface EmailBlastTemplateInput {
  year: number;
  /** Used as the header heading; the recipient's subject line is set separately when sending. */
  subject: string;
  /** Already-sanitized body HTML from the composer (see sanitizeEmailHtml). */
  bodyHtml: string;
  logoUrl?: string;
}

/**
 * Wrap an admin-composed, already-sanitized body in the EBISION branded email shell (brand-green
 * header with the logo chip, white content card, muted footer). A `<style>` block gives the
 * semantic Tiptap output (headings, links, lists) reasonable defaults in clients that honor it;
 * the container also sets a base font/color that cascades to text where it isn't.
 */
export function renderEmailBlastHtml(input: EmailBlastTemplateInput): string {
  const logoChip = input.logoUrl
    ? `<td style="width:56px;vertical-align:middle;">
            <div style="width:44px;height:44px;background:#ffffff;border-radius:10px;text-align:center;mso-line-height-rule:exactly;line-height:44px;">
              <img src="${escapeHtml(input.logoUrl)}" width="30" height="30" alt="EBISION" style="display:inline-block;vertical-align:middle;border:0;" />
            </div>
          </td>`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    .eb-body { font-size:15px; line-height:1.6; color:${INK}; }
    .eb-body p { margin:0 0 16px; }
    .eb-body a { color:${BRAND}; text-decoration:underline; }
    .eb-body h1, .eb-body h2, .eb-body h3 { margin:0 0 12px; line-height:1.3; color:${INK}; font-weight:650; }
    .eb-body h1 { font-size:22px; }
    .eb-body h2 { font-size:19px; }
    .eb-body h3 { font-size:16px; }
    .eb-body ul, .eb-body ol { margin:0 0 16px; padding-left:22px; }
    .eb-body li { margin:0 0 6px; }
    .eb-body blockquote { margin:0 0 16px; padding:4px 0 4px 14px; border-left:3px solid ${BORDER}; color:${MUTED}; }
    .eb-body img { max-width:100%; height:auto; }
    .eb-body :last-child { margin-bottom:0; }
  </style>
</head>
<body style="margin:0;padding:0;background:${CANVAS};font-family:'IBM Plex Sans',-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK};">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="background:${BRAND};border-radius:10px 10px 0 0;padding:22px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${logoChip}
          <td style="vertical-align:middle;${input.logoUrl ? "padding-left:14px;" : ""}">
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">EBISION ${input.year}</p>
            <h1 style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:650;">${escapeHtml(input.subject)}</h1>
          </td>
        </tr>
      </table>
    </div>
    <div style="background:${SURFACE};border:1px solid ${BORDER};border-top:none;border-radius:0 0 10px 10px;padding:28px;">
      <div class="eb-body">${input.bodyHtml}</div>
    </div>
    <p style="margin:16px 4px 0;font-size:12px;color:${MUTED};">EBISION ${input.year} &middot; IFIP WG 8.4 International Symposium</p>
  </div>
</body>
</html>`;
}
