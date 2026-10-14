/**
 * Dev utility: render the transactional emails to a single HTML file for browser preview.
 * Run with: pnpm exec tsx scripts/preview-emails.ts
 * Opens nothing; it writes ./email-preview.html (untracked), open that in a browser.
 *
 * The logo is inlined as a base64 data URI here ONLY so the preview is self-contained.
 * Real sends use an absolute https URL (see lib/email/assets.ts). The banquet venue
 * hero uses the real external image URL, which a browser can load even though some
 * email image proxies may not.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderBanquetConfirmationHtml } from "../lib/email/banquet-confirmation.templates";
import { renderBanquetInvitationHtml } from "../lib/email/banquet-invitation.templates";
import { renderCertificateEmailHtml } from "../lib/email/certificate.templates";
import {
  renderCheckInWelcomeHtml,
  renderRegistrationPassHtml,
} from "../lib/email/registration-check-in.templates";

const root = process.cwd();
const logoBase64 = readFileSync(join(root, "public/assets/email/ebision-logo-email.png")).toString(
  "base64",
);
const logoUrl = `data:image/png;base64,${logoBase64}`;

// The banquet venue photo, inlined so the preview matches what real (self-hosted) sends show.
const venueBase64 = readFileSync(join(root, "public/assets/venue/2026/THE_PLAZA.jpg")).toString(
  "base64",
);
const venueImageUrl = `data:image/jpeg;base64,${venueBase64}`;

const passHtml = renderRegistrationPassHtml({
  year: 2026,
  name: "Ada Lovelace",
  venue: "Kookmin University",
  dates: "July 8-10, 2026",
  passUrl: "https://mobisec.org/registration-pass/8f3c1a2b-6d44-4e90-9b21-2c5e7a0f1d33",
  logoUrl,
});

const welcomeHtml = renderCheckInWelcomeHtml({
  year: 2026,
  name: "Ada Lovelace",
  logoUrl,
});

const invitationHtml = renderBanquetInvitationHtml({
  year: 2026,
  name: "Ada Lovelace",
  banquetDate: "July 9",
  banquetVenue: "the Plaza Hotel",
  surveyUrl: "https://mobisec.org/2026/banquet-survey?email=ada%40example.org&name=Ada%20Lovelace",
  logoUrl,
  venueImageUrl,
});

const confirmationYesHtml = renderBanquetConfirmationHtml({
  year: 2026,
  name: "Ada Lovelace",
  attending: true,
  banquetDate: "July 9",
  banquetVenue: "the Plaza Hotel",
  allergens: ["Nuts", "Vegetarian"],
  message: "Looking forward to it.",
  logoUrl,
  venueImageUrl,
});

const confirmationNoHtml = renderBanquetConfirmationHtml({
  year: 2026,
  name: "Ada Lovelace",
  attending: false,
  banquetDate: "July 9",
  banquetVenue: "the Plaza Hotel",
  allergens: [],
  logoUrl,
});

const certificateHtml = renderCertificateEmailHtml({
  year: 2026,
  name: "Ada Lovelace",
  role: "Author",
  logoUrl,
});

const escapeForAttr = (html: string) => html.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

const frame = (html: string) =>
  `<iframe srcdoc="${escapeForAttr(html)}" onload="this.style.height=this.contentWindow.document.body.scrollHeight+32+'px'"></iframe>`;

const wrapper = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><title>MOBISEC email preview</title>
<style>
  body { margin: 0; padding: 32px 16px; background: #e9eaec; font-family: system-ui, sans-serif; }
  h2 { max-width: 640px; margin: 28px auto 10px; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: #555; }
  iframe { display: block; width: 100%; max-width: 640px; margin: 0 auto; border: 0; background: transparent; }
</style></head>
<body>
  <h2>Banquet invitation email</h2>
  ${frame(invitationHtml)}
  <h2>Banquet confirmation email (attending)</h2>
  ${frame(confirmationYesHtml)}
  <h2>Banquet confirmation email (not attending)</h2>
  ${frame(confirmationNoHtml)}
  <h2>Registration QR pass email</h2>
  ${frame(passHtml)}
  <h2>Check-in welcome email</h2>
  ${frame(welcomeHtml)}
  <h2>Certificate of appreciation email</h2>
  ${frame(certificateHtml)}
</body></html>`;

const outPath = join(root, "email-preview.html");
writeFileSync(outPath, wrapper, "utf8");
console.log(`Wrote ${outPath}`);
