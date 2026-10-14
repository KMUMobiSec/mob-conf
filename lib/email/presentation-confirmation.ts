import "server-only";

import { getResendClient } from "./resend";

export interface PresentationConfirmationInput {
  to: string;
  year: number;
  paperNumber: string;
  title: string;
  /** Names of the uploaded material files (at least one). */
  materialFileNames: string[];
  /** Name of the uploaded video file, if one was uploaded. */
  videoFileName?: string | null;
  /** External video link, if one was provided instead of an upload. */
  videoUrl?: string | null;
}

const BRAND = "#1F377E"; // forest green
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

function renderHtml(input: PresentationConfirmationInput): string {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};color:${MUTED};font-size:13px;width:160px;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};color:${INK};font-size:14px;">${value}</td>
    </tr>`;

  const filesValue =
    input.materialFileNames.length > 0
      ? input.materialFileNames.map((name) => escapeHtml(name)).join("<br />")
      : "&mdash;";

  const videoValue = input.videoFileName
    ? escapeHtml(input.videoFileName)
    : input.videoUrl
      ? `<a href="${escapeHtml(input.videoUrl)}" style="color:${BRAND};">${escapeHtml(input.videoUrl)}</a>`
      : null;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:${CANVAS};font-family:'IBM Plex Sans',-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK};">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="background:${BRAND};border-radius:10px 10px 0 0;padding:24px 28px;">
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">MOBISEC ${input.year} · Organizing Committee</p>
      <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:650;">Presentation received</h1>
    </div>
    <div style="background:${SURFACE};border:1px solid ${BORDER};border-top:none;border-radius:0 0 10px 10px;padding:28px;">
      <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">Hello,</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:${INK};">
        Thank you for uploading your presentation for MOBISEC ${input.year}. We have recorded your submission. Below is a copy for your records.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
        ${row("Paper number", `<strong>${escapeHtml(input.paperNumber)}</strong>`)}
        ${row("Title", escapeHtml(input.title))}
        ${row(input.materialFileNames.length === 1 ? "File" : "Files", filesValue)}
        ${videoValue ? row("Video", videoValue) : ""}
      </table>
      <p style="margin:0;font-size:13px;line-height:1.55;color:${MUTED};">
        No action is required. If you did not submit this presentation, please disregard this email.
      </p>
    </div>
    <p style="margin:16px 4px 0;font-size:12px;color:${MUTED};">MOBISEC ${input.year} — KIISC International Conference</p>
  </div>
</body>
</html>`;
}

/** Send the recap-only confirmation email to the contact person. Throws on failure. */
export async function sendPresentationConfirmation(
  input: PresentationConfirmationInput,
): Promise<void> {
  const from = process.env.RESEND_EMAIL_FROM_NOREPLY;
  if (!from) {
    throw new Error(
      "RESEND_EMAIL_FROM_NOREPLY is required to send presentation confirmation email.",
    );
  }

  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: `Your MOBISEC ${input.year} presentation has been received`,
    html: renderHtml(input),
  });

  if (error) {
    throw new Error(`Resend failed to send confirmation email: ${error.message}`);
  }
}
