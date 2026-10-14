/**
 * Dev utility: render the registration QR pass page to a static HTML file for
 * browser preview. Run with: pnpm exec tsx scripts/preview-pass-page.ts
 * Writes ./registration-pass-preview.html (untracked). It mirrors the layout and
 * tokens of app/registration-pass/[id]/page.tsx with sample data and a real QR.
 * The QR is signed with a placeholder secret, so it is visually faithful but is
 * not a valid check-in code.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import QRCode from "qrcode";
import { createQrPayload } from "../modules/admin/qr-check-ins/lib/qr";

const sample = {
  year: 2026,
  name: "Ada Lovelace",
  email: "ada@example.org",
  affiliation: "University of London",
  venue: "Kookmin University",
  location: "Seoul, South Korea",
  dates: "July 8-10, 2026",
};

const MUTED = "rgba(0,0,0,0.55)";
const BORDER = "rgba(0,0,0,0.12)";
const BRAND = "#578429";

const icon = (paths: string) =>
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${BRAND}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:0 0 auto;">${paths}</svg>`;

const calendar = icon(
  '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
);
const pin = icon(
  '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
);
const badge = icon(
  '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
);

async function main() {
  const payload = createQrPayload({
    id: "8f3c1a2b-6d44-4e90-9b21-2c5e7a0f1d33",
    qrNonce: "previewNonceExampleBase64Url",
    secret: "preview-secret",
  });
  const qr = await QRCode.toDataURL(payload, { errorCorrectionLevel: "M", margin: 1, width: 360 });

  const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Registration QR pass page preview</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  body { margin:0; background:#f4f5f6; font-family:'IBM Plex Sans',system-ui,sans-serif; color:#121212; padding:32px 16px; }
  .wrap { max-width:576px; margin:0 auto; display:flex; flex-direction:column; gap:24px; }
  .header { border-radius:10px; background:${BRAND}; color:#fff; padding:20px 24px; }
  .tag { font-family:'IBM Plex Mono',monospace; font-size:13px; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.8); margin:0; }
  .subheading { font-size:20px; font-weight:500; letter-spacing:-0.01em; line-height:1.3; margin:8px 0 0; }
  .card { border:1px solid ${BORDER}; border-radius:10px; background:#fafafa; padding:24px; box-shadow:0 1px 2px rgba(0,0,0,0.05); }
  .caption { font-size:13px; line-height:1.5; color:${MUTED}; margin:0; }
  .name { font-size:20px; font-weight:500; letter-spacing:-0.01em; line-height:1.3; margin:4px 0; }
  .qrbox { margin-top:24px; display:flex; justify-content:center; border:1px solid ${BORDER}; border-radius:10px; background:#fff; padding:20px; }
  .qrbox img { width:100%; max-width:320px; height:auto; }
  .meta { margin-top:24px; display:flex; flex-direction:column; gap:12px; font-size:14px; color:${MUTED}; }
  .row { display:flex; align-items:center; gap:8px; }
  .row span { line-height:1.4; }
</style></head>
<body>
  <div class="wrap">
    <div class="header">
      <p class="tag">MOBISEC ${sample.year}</p>
      <h1 class="subheading">Registration QR Pass</h1>
    </div>
    <div class="card">
      <p class="caption">Attendee</p>
      <h2 class="name">${sample.name}</h2>
      <p class="caption">${sample.email}</p>
      <p class="caption">${sample.affiliation}</p>
      <div class="qrbox"><img src="${qr}" alt="MOBISEC ${sample.year} check-in QR code" /></div>
      <div class="meta">
        <div class="row">${calendar}<span>${sample.dates}</span></div>
        <div class="row">${pin}<span>${sample.venue}, ${sample.location}</span></div>
        <div class="row">${badge}<span>Present this QR code at the registration desk.</span></div>
      </div>
    </div>
  </div>
</body></html>`;

  const out = join(process.cwd(), "registration-pass-preview.html");
  writeFileSync(out, html, "utf8");
  console.log(`Wrote ${out}`);
}

main();
