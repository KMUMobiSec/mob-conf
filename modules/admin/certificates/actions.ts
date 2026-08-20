"use server";

import { getCurrentAdminSession } from "@/lib/auth/session";
import { sendCertificateEmail } from "@/lib/email/certificate";
import { parseAdminYear } from "@/modules/admin/lib/year";
import {
  type CertificateInput,
  certificateFilename,
  renderCertificate,
} from "./lib/certificate-pdf";
import {
  type CertificateRecipient,
  getCertificateRecipient,
  markCertificateEmailed,
} from "./lib/queries";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface CertificateSendResult {
  ok: boolean;
  error?: string;
}

/**
 * Build the certificate input for a resolved recipient. `asAuthor` is honored only when the
 * recipient actually authored a paper; otherwise we fall back to a participant certificate. When
 * several papers match, `paperTitle` selects one (must be theirs) — else the first is used.
 */
function inputForRecipient(
  year: CertificateInput["year"],
  recipient: CertificateRecipient,
  asAuthor: boolean,
  paperTitle?: string,
): CertificateInput {
  const affiliation = recipient.affiliation ?? "";
  if (asAuthor && recipient.paperTitles.length > 0) {
    const chosen =
      paperTitle && recipient.paperTitles.includes(paperTitle)
        ? paperTitle
        : recipient.paperTitles[0];
    return { kind: "author", year, recipientName: recipient.name, affiliation, paperTitle: chosen };
  }
  return {
    kind: "participant",
    year,
    recipientName: recipient.name,
    affiliation,
    recognitionTitle: "Participant",
  };
}

/** Role label used in the email copy (the PDF composes its own wording). */
function roleLabel(input: CertificateInput): string {
  return input.kind === "author" ? "Author" : input.recognitionTitle;
}

async function sendToRecipient(
  year: CertificateInput["year"],
  recipient: CertificateRecipient,
  asAuthor: boolean,
  paperTitle?: string,
): Promise<CertificateSendResult> {
  if (!recipient.email || !EMAIL_RE.test(recipient.email)) {
    return { ok: false, error: "Recipient has no valid email address." };
  }
  const input = inputForRecipient(year, recipient, asAuthor, paperTitle);
  const pdf = await renderCertificate(input);
  await sendCertificateEmail({
    to: recipient.email,
    year,
    name: recipient.name,
    role: roleLabel(input),
    pdf,
    filename: certificateFilename(year, recipient.name),
  });
  await markCertificateEmailed(recipient.id);
  return { ok: true };
}

export async function sendCertificate(input: {
  year: number;
  id: string;
  asAuthor: boolean;
  paperTitle?: string;
}): Promise<CertificateSendResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, error: "Not authorized." };

  const year = parseAdminYear(input.year);
  try {
    const recipient = await getCertificateRecipient(year, input.id);
    if (!recipient) return { ok: false, error: "Registrant not found." };
    return await sendToRecipient(year, recipient, input.asAuthor, input.paperTitle);
  } catch (error) {
    console.error("Failed to send certificate", error);
    return { ok: false, error: "Could not send the certificate." };
  }
}

export interface CustomCertificateInput {
  year: number;
  recipientName: string;
  affiliation: string;
  isAuthor: boolean;
  paperTitle?: string;
  recognitionTitle?: string;
  email: string;
}

function buildCustomInput(
  input: CustomCertificateInput,
): { ok: true; value: CertificateInput } | { ok: false; error: string } {
  const year = parseAdminYear(input.year);
  const recipientName = input.recipientName.trim();
  const affiliation = input.affiliation.trim();
  if (!recipientName) return { ok: false, error: "Recipient name is required." };
  if (!affiliation) return { ok: false, error: "Affiliation is required." };

  if (input.isAuthor) {
    const paperTitle = input.paperTitle?.trim();
    if (!paperTitle)
      return { ok: false, error: "Paper title is required for author certificates." };
    return { ok: true, value: { kind: "author", year, recipientName, affiliation, paperTitle } };
  }
  const recognitionTitle = input.recognitionTitle?.trim();
  if (!recognitionTitle) return { ok: false, error: "Recognition title is required." };
  return {
    ok: true,
    value: { kind: "participant", year, recipientName, affiliation, recognitionTitle },
  };
}

export async function sendCustomCertificate(
  input: CustomCertificateInput,
): Promise<CertificateSendResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, error: "Not authorized." };

  const email = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "A valid recipient email is required." };

  const built = buildCustomInput(input);
  if (!built.ok) return { ok: false, error: built.error };

  try {
    const pdf = await renderCertificate(built.value);
    await sendCertificateEmail({
      to: email,
      year: built.value.year,
      name: built.value.recipientName,
      role: roleLabel(built.value),
      pdf,
      filename: certificateFilename(built.value.year, built.value.recipientName),
    });
    return { ok: true };
  } catch (error) {
    console.error("Failed to send custom certificate", error);
    return { ok: false, error: "Could not send the certificate." };
  }
}
