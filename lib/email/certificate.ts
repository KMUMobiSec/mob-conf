import "server-only";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { certificateEmailSubject, renderCertificateEmailHtml } from "./certificate.templates";
import { getResendClient } from "./resend";

// Embed the brand logo INLINE (as a `cid:` attachment) rather than linking an external URL. An
// external URL only works when NEXT_PUBLIC_BASE_URL is a public https origin (it defaults to
// localhost in dev, which no inbox can load) and is subject to image-proxy blocking; an inline
// attachment renders in every client, in dev and prod alike. Loaded once at module init.
const LOGO_CID = "mobisec-logo";
const LOGO_PATH = path.join(process.cwd(), "public/assets/email/mobisec-logo-email.png");
const LOGO_BUFFER: Buffer | null = existsSync(LOGO_PATH) ? readFileSync(LOGO_PATH) : null;

function certificateFromAddress(): string {
  // Certificates are transactional/no-reply; reuse the shared no-reply sender identity.
  const from = process.env.RESEND_EMAIL_FROM_NOREPLY;
  if (!from) {
    throw new Error("RESEND_EMAIL_FROM_NOREPLY is required to send a certificate email.");
  }
  return from;
}

export interface SendCertificateEmailInput {
  to: string;
  year: number;
  name: string;
  /** Role acknowledged on the certificate, used in the email copy. */
  role: string;
  pdf: Buffer;
  filename: string;
}

/** Email a single certificate PDF as an attachment. Throws on Resend failure. */
export async function sendCertificateEmail(input: SendCertificateEmailInput): Promise<void> {
  const resend = getResendClient();

  // Inline logo attachment referenced as `cid:mobisec-logo` in the HTML. Omitted (with the header
  // falling back to text-only) if the asset is missing.
  const logoAttachment = LOGO_BUFFER
    ? [
        {
          filename: "mobisec-logo.png",
          content: LOGO_BUFFER,
          contentId: LOGO_CID,
          contentType: "image/png",
        },
      ]
    : [];

  const { error } = await resend.emails.send({
    from: certificateFromAddress(),
    to: input.to,
    subject: certificateEmailSubject(input.year),
    html: renderCertificateEmailHtml({
      year: input.year,
      name: input.name,
      role: input.role,
      logoUrl: LOGO_BUFFER ? `cid:${LOGO_CID}` : undefined,
    }),
    attachments: [{ filename: input.filename, content: input.pdf }, ...logoAttachment],
  });

  if (error) {
    throw new Error(`Resend failed to send certificate email: ${error.message}`);
  }
}
