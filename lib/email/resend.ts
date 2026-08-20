import "server-only";

import { Resend } from "resend";

let client: Resend | undefined;

/** Lazily-initialized Resend client. Throws if `RESEND_API_KEY` is unset. */
export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to send email.");
  }
  client ??= new Resend(apiKey);
  return client;
}
