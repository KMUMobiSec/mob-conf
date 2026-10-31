import "server-only";

import { getResendClient } from "./resend";

export interface RegistrationConfirmEmailInput {
  to: string;
  year: number;
  confirmUrl: string;
}

const BRAND = "#1F377E";
const INK = "#121212";
const MUTED = "#646b72";
const BORDER = "#e3e6e8";
const SURFACE = "#ffffff";
const CANVAS = "#f4f5f6";

function renderHtml(input: RegistrationConfirmEmailInput): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:${CANVAS};font-family:'IBM Plex Sans',-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK};">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="background:${BRAND};border-radius:10px 10px 0 0;padding:24px 28px;">
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">MOBISEC ${input.year} · Foreign Registration</p>
      <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:650;">Continue your registration</h1>
    </div>
    <div style="background:${SURFACE};border:1px solid ${BORDER};border-top:none;border-radius:0 0 10px 10px;padding:28px;">
      <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">Hello,</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:${INK};">
        Click the button below to continue your MOBISEC ${input.year} registration. This link expires in 2 hours.
      </p>
      <p style="margin:0 0 24px;text-align:center;">
        <a href="${input.confirmUrl}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px;">Continue registration</a>
      </p>
      <p style="margin:0;font-size:13px;line-height:1.55;color:${MUTED};">
        If you did not request this, you can safely ignore this email.
      </p>
    </div>
    <p style="margin:16px 4px 0;font-size:12px;color:${MUTED};">MOBISEC ${input.year} — KIISC International Conference</p>
  </div>
</body>
</html>`;
}

/** Send the registration magic-link email. Throws on failure. */
export async function sendRegistrationConfirmEmail(
  input: RegistrationConfirmEmailInput,
): Promise<void> {
  const from = process.env.RESEND_EMAIL_FROM_REGISTRATION;
  if (!from) {
    throw new Error("RESEND_EMAIL_FROM_REGISTRATION is required to send this email.");
  }

  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: `Continue your MOBISEC ${input.year} registration`,
    html: renderHtml(input),
  });

  if (error) {
    throw new Error(`Resend failed to send registration confirm email: ${error.message}`);
  }
}
