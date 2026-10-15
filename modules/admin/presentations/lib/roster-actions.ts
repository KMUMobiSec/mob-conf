"use server";

import { getCurrentAdminSession } from "@/lib/auth/session";
import { emailLogoUrl } from "@/lib/email/assets";
import type { BlastAttachment } from "@/lib/email/email-blast";
import { sendEmailBlastMessages, sendSingleBlastMessage } from "@/lib/email/email-blast";
import { renderEmailBlastHtml } from "@/lib/email/email-blast.templates";
import { parseAdminYear } from "@/modules/admin/lib/year";
import {
  hasRenderableBody,
  isEmailableRow,
  resolveRecipientEmails,
} from "../../email-blast/lib/recipients";
import { sanitizeEmailHtml } from "../../email-blast/lib/sanitize";
import {
  listPresentationRosterStatus,
  type RosterImportRow,
  upsertPresentationRoster,
} from "./roster-queries";

const MAX_SUBJECT = 200;
const MAX_IMPORT_ROWS = 2000;
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024; // 15 MB, well under Resend's per-message limit.

export interface ImportRosterResult {
  ok: boolean;
  error?: string;
  created: number;
  updated: number;
  skipped: number;
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validate + normalize raw parsed-spreadsheet rows into clean roster rows; invalid rows are dropped. */
function sanitizeImportRows(rows: unknown[]): { valid: RosterImportRow[]; skipped: number } {
  const valid: RosterImportRow[] = [];
  let skipped = 0;

  for (const raw of rows) {
    if (!raw || typeof raw !== "object") {
      skipped++;
      continue;
    }
    const r = raw as Record<string, unknown>;
    const paperNumber = cleanString(r.paperNumber);
    const title = cleanString(r.title);
    const author = cleanString(r.author);
    const contactEmail = cleanString(r.contactEmail).toLowerCase();

    if (!paperNumber || !title || !author || !EMAIL_RE.test(contactEmail)) {
      skipped++;
      continue;
    }
    valid.push({ paperNumber, title, author, contactEmail });
  }

  return { valid, skipped };
}

export async function importPresentationRoster(input: {
  year: number;
  rows: unknown[];
}): Promise<ImportRosterResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, error: "Not authorized.", created: 0, updated: 0, skipped: 0 };

  const year = parseAdminYear(input.year);
  if (!Array.isArray(input.rows) || input.rows.length === 0) {
    return { ok: false, error: "The spreadsheet has no rows.", created: 0, updated: 0, skipped: 0 };
  }
  if (input.rows.length > MAX_IMPORT_ROWS) {
    return {
      ok: false,
      error: `A single import is limited to ${MAX_IMPORT_ROWS} rows.`,
      created: 0,
      updated: 0,
      skipped: 0,
    };
  }

  const { valid, skipped } = sanitizeImportRows(input.rows);
  if (valid.length === 0) {
    return {
      ok: false,
      error:
        "No valid rows found. Check that every row has a paper number, title, author, and a valid contact email.",
      created: 0,
      updated: 0,
      skipped,
    };
  }

  // Later rows win on duplicate paper numbers within the same file.
  const dedupedByPaper = new Map<string, RosterImportRow>();
  for (const row of valid) dedupedByPaper.set(row.paperNumber.trim().toLowerCase(), row);

  try {
    const { created, updated } = await upsertPresentationRoster(
      year,
      Array.from(dedupedByPaper.values()),
    );
    return { ok: true, created, updated, skipped };
  } catch (error) {
    console.error("Failed to import presentation roster", error);
    return { ok: false, error: "Could not import the roster.", created: 0, updated: 0, skipped };
  }
}

export interface PresentationBlastResult {
  ok: boolean;
  error?: string;
  sent: number;
  failed: { email: string; error: string }[];
  skipped: number;
}

function fail(error: string): PresentationBlastResult {
  return { ok: false, error, sent: 0, failed: [], skipped: 0 };
}

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

export interface BlastAttachmentInput {
  filename: string;
  /** Base64-encoded file content (no data: URI prefix). */
  contentBase64: string;
}

function decodeAttachment(input?: BlastAttachmentInput | null): BlastAttachment[] | undefined {
  if (!input) return undefined;
  const buffer = Buffer.from(input.contentBase64, "base64");
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_ATTACHMENT_BYTES) return undefined;
  return [{ filename: input.filename, content: buffer }];
}

/** Recipient source: everyone on the roster, or only those without a matching upload yet. */
export type RosterAudience = "all" | "pending";

async function resolveAudienceEmails(
  year: number,
  rosterIds: string[],
  audience: RosterAudience,
): Promise<{ emails: string[]; skipped: number }> {
  const status = await listPresentationRosterStatus(year);
  const selected = new Set(rosterIds);
  const rows = status.filter((row) => selected.has(row.rosterId));
  const filtered =
    audience === "pending" ? rows.filter((row) => row.presentationId === null) : rows;

  const emailRows = filtered.map((row) => ({ email: row.contactEmail }));
  const emails = resolveRecipientEmails(emailRows);
  const skipped = rosterIds.length - emailRows.filter(isEmailableRow).length;
  return { emails, skipped };
}

export async function sendPresentationRosterBlast(input: {
  year: number;
  subject: string;
  html: string;
  rosterIds: string[];
  audience: RosterAudience;
  attachment?: BlastAttachmentInput | null;
}): Promise<PresentationBlastResult> {
  const session = await getCurrentAdminSession();
  if (!session) return fail("Not authorized.");

  const year = parseAdminYear(input.year);
  const content = prepareContent(input.subject, input.html);
  if (!content.ok) return fail(content.error);
  if (!input.rosterIds.length) return fail("Select at least one recipient.");

  try {
    const { emails, skipped } = await resolveAudienceEmails(year, input.rosterIds, input.audience);
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
      attachments: decodeAttachment(input.attachment),
    });
    return { ok: result.failed.length === 0, sent: result.sent, failed: result.failed, skipped };
  } catch (error) {
    console.error("Failed to send presentation roster blast", error);
    return fail("Could not send the email blast.");
  }
}

export async function sendTestPresentationRosterBlast(input: {
  year: number;
  subject: string;
  html: string;
  attachment?: BlastAttachmentInput | null;
}): Promise<PresentationBlastResult> {
  const session = await getCurrentAdminSession();
  if (!session) return fail("Not authorized.");

  const testEmail = process.env.TEST_EMAIL;
  if (!testEmail) return fail("TEST_EMAIL is not configured.");

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
    await sendSingleBlastMessage({
      to: testEmail,
      subject: content.subject,
      html,
      attachments: decodeAttachment(input.attachment),
    });
    return { ok: true, sent: 1, failed: [], skipped: 0 };
  } catch (error) {
    console.error("Failed to send test presentation roster blast", error);
    return fail("Could not send the test email.");
  }
}
