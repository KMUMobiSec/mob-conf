import "server-only";

import { getResendClient } from "./resend";

// Resend accepts up to 100 messages per batch call; a few hundred participants is one or two calls.
const BATCH_SIZE = 100;

export interface BlastSendResult {
  sent: number;
  failed: { email: string; error: string }[];
}

export interface BlastAttachment {
  filename: string;
  /** Raw file bytes. The same attachment is sent to every recipient in the batch. */
  content: Buffer;
}

/** The no-reply sender all email blasts go out from. Throws if the env var is unset. */
export function noreplyFromAddress(): string {
  const from = process.env.RESEND_EMAIL_FROM_NOREPLY;
  if (!from) {
    throw new Error("RESEND_EMAIL_FROM_NOREPLY is required to send an email blast.");
  }
  return from;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Resend's batch endpoint doesn't accept attachments at all (its batch payload type omits the
// field) — they're silently dropped rather than rejected, which is easy to miss. So a blast with
// an attachment falls back to one request per recipient via the regular send endpoint, paced to
// stay under Resend's default rate limit.
const SINGLE_SEND_DELAY_MS = 550;

async function sendIndividually(input: {
  from: string;
  recipients: string[];
  subject: string;
  html: string;
  attachments: BlastAttachment[];
}): Promise<BlastSendResult> {
  const resend = getResendClient();
  const result: BlastSendResult = { sent: 0, failed: [] };

  for (const to of input.recipients) {
    try {
      const { error } = await resend.emails.send({
        from: input.from,
        to,
        subject: input.subject,
        html: input.html,
        attachments: input.attachments,
      });
      if (error) result.failed.push({ email: to, error: error.message });
      else result.sent++;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown send error";
      result.failed.push({ email: to, error: message });
    }
    await sleep(SINGLE_SEND_DELAY_MS);
  }

  return result;
}

/**
 * Send one personalized message per recipient (single-address `to`, so recipients never see each
 * other) from the no-reply sender. A failed batch marks its recipients failed rather than
 * aborting the whole run. `subject`/`html` are already final (sanitized + wrapped) by the caller.
 */
export async function sendEmailBlastMessages(input: {
  subject: string;
  html: string;
  recipients: string[];
  attachments?: BlastAttachment[];
}): Promise<BlastSendResult> {
  const from = noreplyFromAddress();

  if (input.attachments?.length) {
    return sendIndividually({
      from,
      recipients: input.recipients,
      subject: input.subject,
      html: input.html,
      attachments: input.attachments,
    });
  }

  const resend = getResendClient();
  const result: BlastSendResult = { sent: 0, failed: [] };

  for (const group of chunk(input.recipients, BATCH_SIZE)) {
    const payload = group.map((to) => ({
      from,
      to,
      subject: input.subject,
      html: input.html,
    }));
    try {
      // Permissive validation delivers every valid message and returns a per-index error list,
      // so one bad address can't block the rest of the chunk (strict mode fails the whole batch
      // and would strand up to 99 good recipients).
      const { data, error } = await resend.batch.send(payload, {
        batchValidation: "permissive" as const,
      });
      if (error) {
        for (const to of group) result.failed.push({ email: to, error: error.message });
        continue;
      }
      const errors = data?.errors ?? [];
      for (const failure of errors) {
        const email = group[failure.index];
        if (email !== undefined) result.failed.push({ email, error: failure.message });
      }
      result.sent += group.length - errors.length;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown send error";
      for (const to of group) result.failed.push({ email: to, error: message });
    }
  }

  return result;
}

/** Send a single blast message (used by the "send test to me" preview). Throws on failure. */
export async function sendSingleBlastMessage(input: {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: BlastAttachment[];
}): Promise<void> {
  const from = noreplyFromAddress();
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    ...(input.attachments?.length ? { attachments: input.attachments } : {}),
  });
  if (error) {
    throw new Error(`Resend failed to send email blast test: ${error.message}`);
  }
}
