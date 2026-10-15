"use server";

import { getCurrentAdminSession } from "@/lib/auth/session";
import { emailLogoUrl } from "@/lib/email/assets";
import { sendEmailBlastMessages, sendSingleBlastMessage } from "@/lib/email/email-blast";
import { renderEmailBlastHtml } from "@/lib/email/email-blast.templates";
import { parseAdminYear } from "@/modules/admin/lib/year";
import { listRegistrationsByIds } from "@/modules/admin/qr-check-ins/lib/queries";
import { getAppSettings } from "@/modules/admin/settings/lib/queries";
import { testModeRecipients } from "@/modules/admin/settings/lib/test-mode";
import { hasRenderableBody, isEmailableRow, resolveRecipientEmails } from "./lib/recipients";
import { sanitizeEmailHtml } from "./lib/sanitize";

const MAX_SUBJECT = 200;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface EmailBlastResult {
  ok: boolean;
  error?: string;
  sent: number;
  failed: { email: string; error: string }[];
  skipped: number;
}

function fail(error: string): EmailBlastResult {
  return { ok: false, error, sent: 0, failed: [], skipped: 0 };
}

/** Validate + sanitize the shared composer fields, returning the final subject and body HTML. */
function prepareContent(
  subject: string,
  html: string,
): { ok: true; subject: string; body: string } | { ok: false; error: string } {
  const trimmed = subject.trim();
  if (!trimmed) return { ok: false, error: "Subject is required." };
  if (trimmed.length > MAX_SUBJECT) {
    return { ok: false, error: `Subject must be ${MAX_SUBJECT} characters or fewer.` };
  }
  const body = sanitizeEmailHtml(html);
  if (!hasRenderableBody(body)) return { ok: false, error: "Message body is empty." };
  return { ok: true, subject: trimmed, body };
}

export async function sendEmailBlast(input: {
  year: number;
  subject: string;
  html: string;
  recipientIds: string[];
}): Promise<EmailBlastResult> {
  const session = await getCurrentAdminSession();
  if (!session) return fail("Not authorized.");

  const year = parseAdminYear(input.year);
  const content = prepareContent(input.subject, input.html);
  if (!content.ok) return fail(content.error);

  // Ids are DB uuids; drop anything that isn't (tampered/stale payload) so a bad value can't crash
  // the uuid query below.
  const ids = Array.from(new Set(input.recipientIds)).filter((id) => UUID_RE.test(id));
  if (ids.length === 0) return fail("Select at least one recipient.");

  try {
    // Re-resolve recipients from the database by id — never trust client-supplied addresses.
    const rows = await listRegistrationsByIds(year, ids);
    const emails = resolveRecipientEmails(rows);
    // Skipped = selected people we can't reach (no/invalid email, or deleted since the page loaded).
    // People who merely share an address are reached by one message, not counted as skipped.
    const skipped = ids.length - rows.filter(isEmailableRow).length;
    if (emails.length === 0) {
      return { ...fail("None of the selected recipients have a valid email."), skipped };
    }

    const html = renderEmailBlastHtml({
      year,
      subject: content.subject,
      bodyHtml: content.body,
      logoUrl: emailLogoUrl(),
    });

    const result = await sendEmailBlastMessages({
      subject: content.subject,
      html,
      recipients: emails,
    });
    return { ok: result.failed.length === 0, sent: result.sent, failed: result.failed, skipped };
  } catch (error) {
    console.error("Failed to send email blast", error);
    return fail("Could not send the email blast.");
  }
}

export async function sendTestEmailBlast(input: {
  year: number;
  subject: string;
  html: string;
}): Promise<EmailBlastResult> {
  const session = await getCurrentAdminSession();
  if (!session) return fail("Not authorized.");

  const settings = await getAppSettings();
  const testers = testModeRecipients(settings.testerEmails);

  const year = parseAdminYear(input.year);
  const content = prepareContent(input.subject, input.html);
  if (!content.ok) return fail(content.error);

  const html = renderEmailBlastHtml({
    year,
    subject: content.subject,
    bodyHtml: content.body,
    logoUrl: emailLogoUrl(),
  });

  try {
    await sendSingleBlastMessage({ to: testers, subject: content.subject, html });
    return { ok: true, sent: 1, failed: [], skipped: 0 };
  } catch (error) {
    console.error("Failed to send test email blast", error);
    return fail("Could not send the test email.");
  }
}
