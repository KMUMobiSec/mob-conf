import "server-only";

import { getResendClient } from "./resend";

export interface RegistrationInvoiceEmailInput {
  to: string;
  year: number;
  categoryName: string;
  total: string;
  invoiceUrl: string;
}

const BRAND = "#1F377E";
const INK = "#121212";
const MUTED = "#646b72";
const BORDER = "#e3e6e8";
const SURFACE = "#ffffff";
const CANVAS = "#f4f5f6";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderHtml(input: RegistrationInvoiceEmailInput): string {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};color:${MUTED};font-size:13px;width:160px;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};color:${INK};font-size:14px;">${value}</td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:${CANVAS};font-family:'IBM Plex Sans',-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK};">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="background:${BRAND};border-radius:10px 10px 0 0;padding:24px 28px;">
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">MOBISEC ${input.year} · Foreign Registration</p>
      <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:650;">Registration received</h1>
    </div>
    <div style="background:${SURFACE};border:1px solid ${BORDER};border-top:none;border-radius:0 0 10px 10px;padding:28px;">
      <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">Hello,</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:${INK};">
        Thank you for registering for MOBISEC ${input.year}. Please complete your payment to confirm your registration.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
        ${row("Category", escapeHtml(input.categoryName))}
        ${row("Total", `<strong>USD ${escapeHtml(input.total)}</strong>`)}
      </table>
      <p style="margin:0 0 24px;text-align:center;">
        <a href="${input.invoiceUrl}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px;">View invoice &amp; pay</a>
      </p>
      <p style="margin:0;font-size:13px;line-height:1.55;color:${MUTED};">
        You can pay by PayPal or bank transfer from the invoice page.
      </p>
    </div>
    <p style="margin:16px 4px 0;font-size:12px;color:${MUTED};">MOBISEC ${input.year} — KIISC International Conference</p>
  </div>
</body>
</html>`;
}

/** Send the "registration received, pay here" email. Throws on failure. */
export async function sendRegistrationInvoiceEmail(
  input: RegistrationInvoiceEmailInput,
): Promise<void> {
  const from = process.env.RESEND_EMAIL_FROM_REGISTRATION;
  if (!from) {
    throw new Error("RESEND_EMAIL_FROM_REGISTRATION is required to send this email.");
  }

  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: `Your MOBISEC ${input.year} registration invoice`,
    html: renderHtml(input),
  });

  if (error) {
    throw new Error(`Resend failed to send registration invoice email: ${error.message}`);
  }
}
