/**
 * Pure helpers for check-in test mode — no DB / server imports, so they can be
 * unit-tested and reused on the client (e.g. banner preview of the redirect target).
 */

/** Recipient used when test mode is on but the tester list is empty. */
export const TEST_MODE_FALLBACK_EMAIL = "cyberchair.mobisec@gmail.com";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Resolve the actual recipients for a check-in email.
 * - Test mode: the tester list, or the fallback when the list is empty.
 * - Normal mode: the registration's real email, or null ("no email on file").
 */
export function resolveCheckInRecipients(input: {
  testMode: boolean;
  testerEmails: string[];
  intended: string | null;
}): string[] | null {
  if (input.testMode) {
    return input.testerEmails.length > 0 ? input.testerEmails : [TEST_MODE_FALLBACK_EMAIL];
  }
  return input.intended ? [input.intended] : null;
}

/** The addresses test-mode email is redirected to, for display (list or fallback). */
export function testModeRecipients(testerEmails: string[]): string[] {
  return testerEmails.length > 0 ? testerEmails : [TEST_MODE_FALLBACK_EMAIL];
}

/**
 * Normalize a tester-email input (a textarea string split on newline/comma/semicolon,
 * or an array) into trimmed, lowercased, de-duplicated addresses plus any invalid tokens.
 */
export function normalizeTesterEmails(raw: string | string[]): {
  emails: string[];
  invalid: string[];
} {
  const tokens = Array.isArray(raw) ? raw : raw.split(/[\n,;]+/);
  const emails: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const value = token.trim().toLowerCase();
    if (!value) continue;
    if (!EMAIL_RE.test(value)) {
      invalid.push(token.trim());
      continue;
    }
    if (seen.has(value)) continue;
    seen.add(value);
    emails.push(value);
  }
  return { emails, invalid };
}
