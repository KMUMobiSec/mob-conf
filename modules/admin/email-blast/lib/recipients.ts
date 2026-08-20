// Pure recipient/body helpers (no server-only deps) so they're unit-testable.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Whether a registration row has a usable (normalizable, syntactically valid) email address. */
export function isEmailableRow(row: { email: string | null }): boolean {
  return row.email != null && EMAIL_RE.test(row.email.trim().toLowerCase());
}

/**
 * Normalize, validate, and dedupe recipient email addresses from registration rows. Rows with no
 * email or a malformed address are dropped; two people sharing an address collapse to one message.
 */
export function resolveRecipientEmails(rows: { email: string | null }[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of rows) {
    if (!row.email) continue;
    const email = row.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email) || seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

/**
 * Whether sanitized composer HTML actually carries content. An empty editor emits `<p></p>`, so a
 * tag-only / whitespace-only body counts as empty unless it contains a link, image, or rule.
 */
export function hasRenderableBody(html: string): boolean {
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, "")
    .trim();
  if (text.length > 0) return true;
  return /<(a\b|img\b|hr\b)/i.test(html);
}
